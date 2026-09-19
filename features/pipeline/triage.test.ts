import { describe, expect, it } from "vitest";
import { triageArticle } from "./triage";

describe("free relevance triage", () => {
  it("passes AI coding vocabulary on to the AI gate", () => {
    expect(triageArticle({ title: "Cursor ships background agents" })).toEqual({ decision: "ai", reason: "strong_term" });
    expect(triageArticle({ title: "Show HN: a CLI built with Claude Code" }).decision).toBe("ai");
    expect(triageArticle({ title: "MCP servers explained" }).decision).toBe("ai");
  });

  it("passes general software vocabulary on too (a false pass costs one batched judgment)", () => {
    expect(triageArticle({ title: "Postgres 18 is out", summary: "New database features" }).decision).toBe("ai");
    expect(triageArticle({ title: "Migrating a Next.js app to the edge" }).decision).toBe("ai");
  });

  it("looks at the summary as well as the title", () => {
    expect(triageArticle({ title: "Weekly roundup", summary: "This week: new coding assistant features" }).decision).toBe("ai");
  });

  it("skips text with no AI or software vocabulary at all, for free", () => {
    expect(triageArticle({ title: "NTSB releases report on regional airline landing incident" })).toEqual({ decision: "skip", reason: "no_vocabulary" });
    expect(triageArticle({ title: "The mathematics of knitting", summary: "A tour of stitch patterns" }).decision).toBe("skip");
  });

  it("always lets official vendor blogs (class A) reach the AI gate", () => {
    expect(triageArticle({ title: "Introducing our newest release", sourceClass: "A" })).toEqual({ decision: "ai", reason: "trusted_source" });
    expect(triageArticle({ title: "Introducing our newest release", sourceClass: "C" }).decision).toBe("skip");
  });

  it("is case insensitive", () => {
    expect(triageArticle({ title: "GITHUB COPILOT UPDATE" }).decision).toBe("ai");
  });
});
