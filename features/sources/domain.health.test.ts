import { describe, expect, it } from "vitest";
import { computeSourceFailure, dropKnownUrls, isSourceDue, SOURCE_RETRY_BACKOFF_HOURS } from "./domain";

const NOW = new Date("2026-09-19T12:00:00.000Z");

describe("source cool-down policy", () => {
  it("keeps a source enabled for the first two failures", () => {
    expect(computeSourceFailure(0, NOW)).toMatchObject({ failure_count: 1, enabled: true, retry_after: null });
    expect(computeSourceFailure(1, NOW)).toMatchObject({ failure_count: 2, enabled: true, retry_after: null });
  });

  it("disables on the third failure with a 6 hour cool-down, not forever", () => {
    const out = computeSourceFailure(2, NOW);
    expect(out.enabled).toBe(false);
    expect(out.retry_after).toBe("2026-09-19T18:00:00.000Z");
    expect(out.disabled_at).toBe(NOW.toISOString());
  });

  it("backs off further with every failed retry and caps the wait", () => {
    const hours = (n: number) => (new Date(computeSourceFailure(n, NOW).retry_after!).getTime() - NOW.getTime()) / 3600_000;
    expect([2, 3, 4, 5, 6, 20].map(hours)).toEqual([6, 12, 24, 48, 72, 72]);
    expect(SOURCE_RETRY_BACKOFF_HOURS.at(-1)).toBe(72);
  });

  it("polls an enabled source, skips a cooling one, retries it once the cool-down passed", () => {
    expect(isSourceDue({ enabled: true }, NOW)).toBe(true);
    expect(isSourceDue({ enabled: false, retry_after: "2026-09-19T18:00:00.000Z" }, NOW)).toBe(false);
    expect(isSourceDue({ enabled: false, retry_after: "2026-09-19T11:59:00.000Z" }, NOW)).toBe(true);
  });

  it("a source disabled by a person (no retry_after) is never retried automatically", () => {
    expect(isSourceDue({ enabled: false, retry_after: null }, NOW)).toBe(false);
  });
});

describe("dropKnownUrls", () => {
  it("drops items whose URL is already stored and keeps the first of a repeated URL", () => {
    const items = [
      { url: "https://a.example/1", title: "A" },
      { url: "https://a.example/2", title: "B" },
      { url: "https://a.example/1", title: "A again, retitled" },
      { url: "https://a.example/3", title: "C" },
    ];
    const kept = dropKnownUrls(items, new Set(["https://a.example/2"]));
    expect(kept.map((i) => i.title)).toEqual(["A", "C"]);
  });
  it("keeps everything when nothing is known", () => {
    expect(dropKnownUrls([{ url: "x" }, { url: "y" }], new Set())).toHaveLength(2);
  });
});
