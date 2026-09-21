import { describe, expect, it } from "vitest";
import { CERTIFICATES, earnedKinds, issueDate, makeCertificateCode, normalizeCertificateCode } from "./domain";
import { BADGES } from "@/features/badges/domain";

describe("certificates (PDL-080)", () => {
  it("every badge a certificate requires is a real badge", () => {
    const ids = new Set(BADGES.map((b) => b.id));
    for (const c of CERTIFICATES) for (const id of c.requires) expect(ids.has(id), `${c.kind}: ${id}`).toBe(true);
  });

  it("Prompt School needs every chapter AND the three level tests, the University needs its three level tests", () => {
    expect(earnedKinds(["ps-graduate"])).toEqual([]);
    expect(earnedKinds(["ps-graduate", "ps-beginner", "ps-intermediate"])).toEqual([]);
    expect(earnedKinds(["ps-graduate", "ps-beginner", "ps-intermediate", "ps-advanced"])).toEqual(["prompt-school"]);
    expect(earnedKinds(["uni-beginner", "uni-intermediate"])).toEqual([]);
    expect(earnedKinds(["uni-beginner", "uni-intermediate", "uni-expert"])).toEqual(["university"]);
    expect(earnedKinds(BADGES.map((b) => b.id)).sort()).toEqual(["prompt-school", "university"]);
    expect(earnedKinds([])).toEqual([]);
  });

  it("the issue date is the day the LAST required badge was earned, and unknown until all are", () => {
    const m = new Map([
      ["uni-beginner", "2026-10-01T10:00:00Z"],
      ["uni-intermediate", "2026-11-15T10:00:00Z"],
      ["uni-expert", "2026-10-20T10:00:00Z"],
    ]);
    expect(issueDate("university", m)).toBe("2026-11-15T10:00:00Z");
    m.delete("uni-expert");
    expect(issueDate("university", m)).toBeNull();
  });

  it("makes readable codes of the right shape from random values, and rejects too few values", () => {
    const code = makeCertificateCode([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(code).toMatch(/^VBJ-[A-Z2-9]{5}-[A-Z2-9]{5}$/);
    expect(code.slice(4)).not.toMatch(/[01ILOU]/);
    expect(makeCertificateCode([255, 255, 255, 255, 255, 255, 255, 255, 255, 255])).toMatch(/^VBJ-/);
    expect(() => makeCertificateCode([1, 2, 3])).toThrow();
  });

  it("checks a typed code by shape, forgiving case and spaces", () => {
    const code = makeCertificateCode([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(normalizeCertificateCode(code)).toBe(code);
    expect(normalizeCertificateCode(`  ${code.toLowerCase()} `)).toBe(code);
    for (const bad of ["", "VBJ", "VBJ-AAAAA", "VBJ-AAAA1-AAAAA", "XYZ-AAAAA-BBBBB", "VBJ-AAAAA-BBBBB-CCCCC", "'; drop table--"]) {
      expect(normalizeCertificateCode(bad), bad).toBeNull();
    }
  });

  it("the wording uses no dashes", () => {
    for (const c of CERTIFICATES) expect(/—|–| -- /.test(`${c.title}${c.statement}${c.howToEarn}`), c.kind).toBe(false);
  });
});
