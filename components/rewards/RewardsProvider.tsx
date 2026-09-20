"use client";

/**
 * App-wide gamification context (Gamification Wave 2, DECISION_LOG.md
 * PDL-030 follow-up). Wave 1's use-reward-celebration.ts was explicitly
 * "one hook per consuming component (not a global context)... promoting
 * this to app-wide context is a next-wave concern once more trigger
 * points exist" -- this is that promotion, now that CoinBalance needs
 * to reflect a coin earned on ANY page, not just the one that earned
 * it, and multiple pages (Dashboard, ArticleListWithBookmarks,
 * onboarding) all need to call award().
 *
 * Renders the celebration UI (CoinToast / ConfettiSystem /
 * CelebrationOverlay) exactly ONCE here, globally, instead of every
 * consuming component duplicating it — a level-up triggered from
 * anywhere now actually shows, instead of only showing if the
 * triggering component happened to also render the overlay itself.
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useSession } from "@/lib/auth/use-session";
import type { RewardEventType } from "@/features/rewards/domain";
import { CoinToast } from "./CoinToast";
import { CelebrationOverlay } from "./CelebrationOverlay";
import { ConfettiSystem } from "./ConfettiSystem";

export interface RewardState {
  coinBalance: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
}

interface AwardApiResult {
  awarded: boolean;
  coinsAwarded: number;
  leveledUp: boolean;
  streakMilestoneHit: number | null;
  newState: RewardState;
}

interface CelebrationState {
  title: string;
  subtitle: string;
  coins?: number;
}

/** What a trusted server route reports after it paid coins itself (Prompt School, PDL-072). */
export interface ServerReward {
  event: string;
  coinsAwarded: number;
  leveledUp: boolean;
  level: number;
  coinBalance: number;
  currentStreak: number;
  longestStreak: number;
}

interface RewardsContextValue {
  state: RewardState | null;
  /**
   * Shows the celebration for coins that a server route already paid: updates the balance, then a toast for a
   * small payout, an overlay for a completed chapter, a passed level test or a new level. Null entries are ignored.
   */
  applyReward: (rewards: Array<ServerReward | null | undefined>) => void;
  award: (eventType: RewardEventType, dedupeKey: string | null) => Promise<void>;
  /** Confetti only, for a delight moment that pays no coins (a repeat click on the book). */
  sparkle: () => void;
}

const RewardsContext = createContext<RewardsContextValue | null>(null);

export function RewardsProvider({ children }: { children: ReactNode }) {
  const { token, loading } = useSession();
  const [state, setState] = useState<RewardState | null>(null);
  const [toastCoins, setToastCoins] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);

  // Load current state once a session exists -- so CoinBalance has
  // something real to show on first paint, not just after this
  // session's first award() call.
  useEffect(() => {
    if (loading || !token) return;
    let active = true;
    fetch("/api/rewards/state", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { state?: RewardState } | null) => {
        if (active && d?.state) setState(d.state);
      })
      .catch(() => {
        // Reward display is a delight layer -- a failed initial fetch
        // just means CoinBalance stays hidden, never a user-facing error.
      });
    return () => {
      active = false;
    };
  }, [token, loading]);

  const award = useCallback(
    async (eventType: RewardEventType, dedupeKey: string | null) => {
      if (!token) return;
      try {
        const res = await fetch("/api/rewards/award", {
          method: "POST",
          headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify({ eventType, dedupeKey }),
        });
        if (!res.ok) return;
        const result: AwardApiResult = await res.json();
        if (!result.awarded) return;

        setState(result.newState);

        if (eventType === "book_discovery") {
          setConfettiActive(true);
          // The bonus can carry the reader over a level threshold; that news must not be lost behind the book message.
          setCelebration({
            title: result.leveledUp ? `Level ${result.newState.level}` : "You found the book",
            subtitle: result.leveledUp
              ? "You found the book behind this School, and the bonus took you to a new level."
              : "Mastering Prompt Engineering is the book behind this School. Here is a bonus for finding it.",
            coins: result.coinsAwarded || undefined,
          });
        } else if (result.leveledUp) {
          setConfettiActive(true);
          setCelebration({
            title: `Level ${result.newState.level}`,
            subtitle: "Excellent progress. You've reached a new level.",
            coins: result.coinsAwarded || undefined,
          });
        } else if (result.streakMilestoneHit) {
          setConfettiActive(true);
          setCelebration({
            title: `${result.streakMilestoneHit}-Day Streak`,
            subtitle: "Excellent progress. Keep up the pace.",
            coins: result.coinsAwarded || undefined,
          });
        } else if (result.coinsAwarded > 0) {
          setToastCoins(result.coinsAwarded);
        }
      } catch {
        // Reward feedback is a delight layer, not core functionality --
        // a failed award call must never surface as a user-facing error
        // or block the underlying action (M-4 / P-1.1 spirit).
      }
    },
    [token],
  );

  const sparkle = useCallback(() => setConfettiActive(true), []);

  const applyReward = useCallback((rewards: Array<ServerReward | null | undefined>) => {
    const paid = rewards.filter((r): r is ServerReward => Boolean(r) && (r as ServerReward).coinsAwarded > 0);
    if (paid.length === 0) return;
    const last = paid[paid.length - 1]!;
    const coins = paid.reduce((n, r) => n + r.coinsAwarded, 0);
    setState({ coinBalance: last.coinBalance, currentStreak: last.currentStreak, longestStreak: last.longestStreak, level: last.level });
    const has = (event: string) => paid.some((r) => r.event === event);
    if (paid.some((r) => r.leveledUp)) {
      setConfettiActive(true);
      setCelebration({ title: `Level ${last.level}`, subtitle: "Excellent progress. You've reached a new level.", coins });
    } else if (has("ps_level_test_pass")) {
      setConfettiActive(true);
      setCelebration({ title: "Level test passed", subtitle: "You passed the whole level. Well done.", coins });
    } else if (has("ps_chapter_complete")) {
      setConfettiActive(true);
      setCelebration({ title: "Chapter complete", subtitle: "You passed the practice of this chapter. The next chapter is open.", coins });
    } else {
      setToastCoins(coins);
    }
  }, []);

  return (
    <RewardsContext.Provider value={{ state, award, sparkle, applyReward }}>
      {children}
      {toastCoins != null && <CoinToast coins={toastCoins} onDone={() => setToastCoins(null)} />}
      <ConfettiSystem active={confettiActive} onDone={() => setConfettiActive(false)} />
      {celebration && (
        <CelebrationOverlay
          open={true}
          title={celebration.title}
          subtitle={celebration.subtitle}
          coins={celebration.coins}
          onDismiss={() => setCelebration(null)}
        />
      )}
    </RewardsContext.Provider>
  );
}

/** Throws outside RewardsProvider deliberately (M-4) -- a missing provider is a real wiring bug, not something to silently no-op around. */
export function useRewards(): RewardsContextValue {
  const ctx = useContext(RewardsContext);
  if (!ctx) {
    throw new Error("useRewards() must be used within <RewardsProvider>");
  }
  return ctx;
}
