/**
 * Capstone workshops (phase C): every one of the 15 Appendix B blueprints has its own hands-on repair workshop, and
 * each workshop rubric rewards the parts that make that blueprint work, not just any long prompt.
 */
import { describe, expect, it } from "vitest";
import { AUTHORED_CHAPTERS } from "./index";
import { gradeRepair, type RepairAnswer, type RepairPublic } from "../domain";

const BLUEPRINT_CHAPTERS = ["blueprints-1", "blueprints-2", "blueprints-3"];

describe("blueprint workshops", () => {
  it("each blueprint chapter has one repair workshop per blueprint (5 or more repair exercises)", () => {
    for (const slug of BLUEPRINT_CHAPTERS) {
      const chapter = AUTHORED_CHAPTERS.find((c) => c.slug === slug)!;
      expect(chapter.exercises.filter((e) => e.kind === "repair").length, slug).toBeGreaterThanOrEqual(5);
    }
  });

  it("a long but empty rewrite does not pass any workshop", () => {
    const filler = "Please be very thorough and careful and write something long and detailed and useful about this topic for me, thanks a lot. ".repeat(6);
    for (const slug of BLUEPRINT_CHAPTERS) {
      for (const e of AUTHORED_CHAPTERS.find((c) => c.slug === slug)!.exercises) {
        if (e.kind !== "repair") continue;
        expect(gradeRepair(e.public as RepairPublic, e.answer as RepairAnswer, { text: filler }).passed, `${slug}/${e.slug}`).toBe(false);
      }
    }
  });

  it("the starter of a workshop never passes on its own", () => {
    for (const slug of BLUEPRINT_CHAPTERS) {
      for (const e of AUTHORED_CHAPTERS.find((c) => c.slug === slug)!.exercises) {
        if (e.kind !== "repair") continue;
        const pub = e.public as RepairPublic;
        expect(gradeRepair(pub, e.answer as RepairAnswer, { text: pub.starter }).passed, `${slug}/${e.slug}`).toBe(false);
      }
    }
  });
});
