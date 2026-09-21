"use client";

/**
 * The screen a reader sees when they reach a Premium feature without Premium. It used to be a
 * bare "Premium Subscription Required" line and a back link, which wasted the one moment a
 * reader is looking straight at what they cannot open (Director, 2026-09-19). It now sells:
 * what this feature gives, what else Premium includes, what it costs per day, and a checkout
 * button on the same screen.
 *
 * Two situations, decided by the server's answer in /api/me and passed in (never computed here):
 *   - an ACTIVE Basic subscriber pays only the $40 difference (the $10 already paid counts);
 *   - everyone else (trial, expired) buys Premium for $50 a year.
 * Every claim below is a fact about the product as it is (lesson, quiz and term counts are
 * checked against the database; the Assistant cap is ASSISTANT_DAILY_CAP_PER_USER).
 * There is deliberately no invented scarcity, countdown or testimonial.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { PayPalCheckout } from "@/components/PayPalCheckout";
import { BASIC_PRICE_USD, PREMIUM_PRICE_USD, UPGRADE_PRICE_USD, centsPerDay, perMonthUsd } from "@/lib/pricing";

export type PremiumFeature = "university" | "dictionary" | "assistant" | "promptschool";

export interface PitchAudience {
  /** True for an active Basic subscriber, who pays the difference. */
  isActiveBasic: boolean;
}

const FEATURE_COPY: Record<PremiumFeature, { eyebrow: string; headline: string; lead: string; peekTitle: string; peek: string[] }> = {
  promptschool: {
    eyebrow: "Prompt School",
    headline: "Learn to write prompts that work, by writing them.",
    lead: "A hands-on course built on the book Mastering Prompt Engineering, from your first clear prompt to advanced techniques. You do not only read: you complete, order, repair and write prompts, and every attempt is checked at once with feedback on what to fix.",
    peekTitle: "What you practise",
    peek: ["The five pillars of every effective prompt", "Repair a vague prompt until it is precise", "Spot the flaw in a broken prompt", "Complete and assemble real prompt templates", "Run your own prompt on a real model and see what it does"],
  },
  assistant: {
    eyebrow: "Vibe-Coding Assistant",
    headline: "Turn your idea into a build-ready prompt in under a minute.",
    lead: "Answer a few plain questions about your project. The Assistant writes the full prompt for Claude Code, Cursor or any AI coding tool, with a flow diagram and the next steps, built on a proven prompt-engineering method.",
    peekTitle: "What you get in every Blueprint",
    peek: ["Context, instructions, constraints and output format, already written", "A copy-ready prompt with the risks spelled out", "A flow diagram and a suggested order of work", "Up to 5 Blueprints a day, all saved in your history"],
  },
  university: {
    eyebrow: "Vibe-Coding University",
    headline: "Go from first prompt to confident builder, one lesson at a time.",
    lead: "A complete course for people who build software with AI: 75 lessons in 15 chapters across three levels, with quizzes after every chapter and a test to close each level.",
    peekTitle: "A peek at the curriculum",
    peek: ["The Vibe-Coding Mindset: Judgment Over Typing", "Writing Effective Prompts for Code Generation", "Spotting Common AI Mistakes in Generated Code", "Security, Risk, and Governance for AI-Assisted Development"],
  },
  dictionary: {
    eyebrow: "Vibe-Coding Dictionary",
    headline: "Never get lost in the jargon again.",
    lead: "More than 2,600 terms in plain language, searchable in a keystroke, grouped by topic and level. Every term is written for people who build with AI, not for specialists.",
    peekTitle: "Terms you will look up",
    peek: ["Context engineering", "Model Context Protocol", "Human-in-the-loop", "Prompt injection"],
  },
};

const PREMIUM_INCLUDES = [
  "Vibe-Coding University: 75 lessons, chapter quizzes and level tests",
  "Vibe-Coding Dictionary: 2,600+ terms in plain language",
  "Vibe-Coding Assistant: prompts written for you",
  "Prompt School: learn to write prompts with hands-on practice",
  "Everything in Basic: Daily Report, Archive and Bookmarks",
];

interface Props {
  feature: PremiumFeature;
  audience: PitchAudience;
  token: string | null;
  /** Called once /api/me confirms Premium after a payment, so the page can open. */
  onUnlocked: () => void;
  /** Which /api/me boolean means "Premium is active" for polling. */
  unlockedKey: "hasUniversityAccess" | "hasAssistantAccess" | "hasPromptSchoolAccess";
}

export function PremiumPitch({ feature, audience, token, onUnlocked, unlockedKey }: Props) {
  const copy = FEATURE_COPY[feature];
  const [awaiting, setAwaiting] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!awaiting || !token) return;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      fetch("/api/me", { headers: { authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d: Record<string, unknown>) => {
          if (d[unlockedKey] === true) {
            clearInterval(interval);
            onUnlocked();
          } else if (attempts >= 10) {
            clearInterval(interval);
            setTimedOut(true);
            setAwaiting(false);
          }
        })
        .catch(() => {
          if (attempts >= 10) {
            clearInterval(interval);
            setTimedOut(true);
            setAwaiting(false);
          }
        });
    }, 2000);
    return () => clearInterval(interval);
  }, [awaiting, token, unlockedKey, onUnlocked]);

  const price = audience.isActiveBasic ? UPGRADE_PRICE_USD : PREMIUM_PRICE_USD;
  const checkout = audience.isActiveBasic ? ({ kind: "upgrade" } as const) : ({ kind: "tier", tier: "premium" } as const);

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/*
        Three blocks in reading order: the promise, the offer, the proof. On a phone the price and the
        checkout button come right after the headline instead of below two screens of text; from lg up
        the promise and the proof share the left column and the offer sits beside them.
      */}
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="border border-black p-5 sm:p-8 lg:col-span-3 lg:row-start-1">
          <p className="mb-2 text-signal k-label">{copy.eyebrow}</p>
          <h2 className="leading-[0.95] text-black k-h2">{copy.headline}</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-black">{copy.lead}</p>
        </section>

        {/* The offer */}
        <aside className="border border-signal p-5 sm:p-8 lg:col-span-2 lg:col-start-4 lg:row-span-2 lg:row-start-1">
          <p className="mb-1 text-signal k-label">
            {audience.isActiveBasic ? "Your upgrade" : "Premium, one year"}
          </p>
          <p className="k-date-read text-black">
            ${price}
          </p>
          {audience.isActiveBasic ? (
            <p className="mt-3 text-sm leading-relaxed text-black">
              You already paid ${BASIC_PRICE_USD} for Basic, so you pay only the <strong>${UPGRADE_PRICE_USD} difference</strong> to unlock everything, for a full year of Premium (${PREMIUM_PRICE_USD} in total).
            </p>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-black">
              One payment, a full year of everything. That is about <strong>{centsPerDay(PREMIUM_PRICE_USD)} cents a day</strong>, or ${perMonthUsd(PREMIUM_PRICE_USD)} a month.
            </p>
          )}

          <div className="mt-6">
            {awaiting ? (
              <p role="status" className="border border-black p-4 text-sm font-bold text-black">
                Payment received, unlocking your Premium access. This usually takes a few seconds.
              </p>
            ) : token ? (
              <PayPalCheckout checkout={checkout} token={token} onApproved={() => setAwaiting(true)} />
            ) : (
              <Link href="/login" className="inline-flex min-h-12 w-full items-center justify-center k-btn k-btn-primary">
                Sign in to upgrade
              </Link>
            )}
            {timedOut && (
              <p role="alert" className="mt-3 text-sm text-black">
                Your payment went through but activation is taking longer than usual. Please reload this page in a minute.
              </p>
            )}
          </div>

          <ul className="mt-6 space-y-1.5 text-xs text-black/80">
            <li>Secure checkout with PayPal, no card details on our site.</li>
            <li>Access starts as soon as the payment is confirmed.</li>
            <li>Sandbox mode: no real payment is processed yet.</li>
          </ul>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 k-btn"
          >
            Not now, back to the Daily Report
          </Link>
        </aside>

        <section className="border border-black p-5 sm:p-8 lg:col-span-3 lg:row-start-2">
          <div className="border border-black bg-paper-2 p-4 sm:p-5">
            <h3 className="mb-3 text-black k-label">{copy.peekTitle}</h3>
            <ul className="space-y-2">
              {copy.peek.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-black">
                  <span aria-hidden="true" className="mt-0.5 inline-block h-2.5 w-2.5 shrink-0 bg-signal" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <h3 className="mb-3 mt-8 text-black k-label">Premium includes everything</h3>
          <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {PREMIUM_INCLUDES.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-black">
                <span aria-hidden="true" className="font-black text-signal">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

      </div>
    </div>
  );
}
