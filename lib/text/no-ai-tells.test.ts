import { describe, expect, it } from "vitest";
import { hasAiTells, stripAiTells, stripAiTellsDeep } from "./no-ai-tells";

describe("stripAiTells", () => {
  it("replaces a spaced em dash with a comma and a space (the Director's own example)", () => {
    expect(stripAiTells("Vibe-Coding Journal watches the landscape for you — filters the noise, connects the dots.")).toBe(
      "Vibe-Coding Journal watches the landscape for you, filters the noise, connects the dots.",
    );
  });

  it("handles unspaced and en dashes", () => {
    expect(stripAiTells("fast—but fragile")).toBe("fast, but fragile");
    expect(stripAiTells("fast – but fragile")).toBe("fast, but fragile");
  });

  it("keeps the meaning of number ranges with a hyphen", () => {
    expect(stripAiTells("Culture, Slang & Emerging Terms (2025–2026)")).toBe("Culture, Slang & Emerging Terms (2025-2026)");
    expect(stripAiTells("pages 10 – 20")).toBe("pages 10-20");
  });

  it("does not leave double commas or a comma before punctuation", () => {
    expect(stripAiTells("Well, — it works.")).toBe("Well, it works.");
    expect(stripAiTells("Really —.")).toBe("Really.");
    expect(stripAiTells("a — , b")).toBe("a, b");
  });

  it("removes a dash that starts or ends a line", () => {
    expect(stripAiTells("— first item\nsecond —")).toBe("first item\nsecond");
    expect(stripAiTells("levels —\n  a running record")).toBe("levels,\n  a running record");
  });

  it("turns a placeholder dash into n/a", () => {
    expect(stripAiTells("**Confidence:** —")).toBe("**Confidence:** n/a");
  });

  it("converts a hand typed ' -- ' but never touches CLI flags", () => {
    expect(stripAiTells("it works -- mostly")).toBe("it works, mostly");
    expect(stripAiTells("run npm test --coverage")).toBe("run npm test --coverage");
  });

  it("leaves fenced and inline code untouched", () => {
    const md = "Use `a -- b` or:\n```\nnpm run x -- --flag — note\n```\nthen — done";
    expect(stripAiTells(md)).toBe("Use `a -- b` or:\n```\nnpm run x -- --flag — note\n```\nthen, done");
  });

  it("returns text without tells unchanged, and handles empty input", () => {
    expect(stripAiTells("Plain text, with commas.")).toBe("Plain text, with commas.");
    expect(stripAiTells("")).toBe("");
  });

  it("hasAiTells detects and stripAiTells is idempotent", () => {
    const t = "a — b";
    expect(hasAiTells(t)).toBe(true);
    expect(hasAiTells(stripAiTells(t))).toBe(false);
    expect(stripAiTells(stripAiTells(t))).toBe(stripAiTells(t));
  });
});

describe("stripAiTellsDeep", () => {
  it("cleans every string inside nested JSON and leaves other types alone", () => {
    const input = { a: "x — y", n: 3, ok: true, none: null, list: ["p — q", { deep: "r – s" }] };
    expect(stripAiTellsDeep(input)).toEqual({ a: "x, y", n: 3, ok: true, none: null, list: ["p, q", { deep: "r, s" }] });
  });
});
