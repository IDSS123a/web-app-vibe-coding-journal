import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Key-rotation behaviour of the Gemini provider. Regression for R1
// (2026-09-19): a transient 5xx on the first key used to fail the whole call
// even when other keys were healthy, so the Vibe-Coding Assistant showed
// "Failed to generate prompt" while capacity existed.

const OK_BODY = { candidates: [{ content: { parts: [{ text: JSON.stringify({ relevanceScore: 80, reasoning: "on topic" }) }] } }] };

function res(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
}
const err = (status: number, s: string) => res(status, { error: { code: status, status: s, message: "x" } });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.GEMINI_API_KEY_1 = "key-one";
  process.env.GEMINI_API_KEY_2 = "key-two";
  process.env.GEMINI_API_KEY_3 = "key-three";
  for (let i = 4; i <= 8; i++) delete process.env[`GEMINI_API_KEY_${i}`];
  process.env.GEMINI_FALLBACK_MODELS = ""; // the rotation tests below are about keys, one model
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function provider() {
  const { GeminiProvider } = await import("./gemini-provider");
  return new GeminiProvider();
}
const urlOf = (call: number) => String(fetchMock.mock.calls[call]![0]);

describe("GeminiProvider key rotation", () => {
  it("503 on key 1 rotates to key 2 and succeeds (R1)", async () => {
    fetchMock.mockResolvedValueOnce(err(503, "UNAVAILABLE")).mockResolvedValueOnce(res(200, OK_BODY));

    const out = await (await provider()).assessRelevance({ title: "t", summary: "s" });

    expect(out.relevanceScore).toBe(80);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(urlOf(0)).toContain("key=key-one");
    expect(urlOf(1)).toContain("key=key-two");
  });

  it("500, 502 and 504 rotate as well", async () => {
    for (const status of [500, 502, 504]) {
      fetchMock.mockReset();
      fetchMock.mockResolvedValueOnce(err(status, "INTERNAL")).mockResolvedValueOnce(res(200, OK_BODY));
      const out = await (await provider()).assessRelevance({ title: "t", summary: "s" });
      expect(out.relevanceScore).toBe(80);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    }
  });

  it("all keys returning 503 fails with a 'temporarily unavailable' error, NOT a quota/suspension error", async () => {
    fetchMock.mockResolvedValue(err(503, "UNAVAILABLE"));

    const p = await provider();
    await expect(p.assessRelevance({ title: "t", summary: "s" })).rejects.toThrow(/temporarily unavailable on all 3 key/);
    await expect(p.assessRelevance({ title: "t", summary: "s" })).rejects.not.toMatchObject({ name: "GeminiKeysExhaustedError" });
    // Routes tell "try again in a minute" from "out of quota" by this class.
    await expect(p.assessRelevance({ title: "t", summary: "s" })).rejects.toMatchObject({ name: "GeminiUnavailableError" });
    expect(fetchMock).toHaveBeenCalledTimes(9); // 3 keys x 3 calls
  });

  it("a 400 bad request is NOT rotated -- it surfaces immediately after one call", async () => {
    fetchMock.mockResolvedValue(err(400, "INVALID_ARGUMENT"));

    await expect((await provider()).assessRelevance({ title: "t", summary: "s" })).rejects.toThrow(/HTTP 400/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("429 still rotates (existing behaviour unchanged)", async () => {
    fetchMock.mockResolvedValueOnce(err(429, "RESOURCE_EXHAUSTED")).mockResolvedValueOnce(res(200, OK_BODY));
    const out = await (await provider()).assessRelevance({ title: "t", summary: "s" });
    expect(out.relevanceScore).toBe(80);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("a mix of one 503 and quota errors on the rest still reports quota exhaustion", async () => {
    fetchMock
      .mockResolvedValueOnce(err(503, "UNAVAILABLE"))
      .mockResolvedValueOnce(err(429, "RESOURCE_EXHAUSTED"))
      .mockResolvedValueOnce(err(429, "RESOURCE_EXHAUSTED"));

    await expect((await provider()).assessRelevance({ title: "t", summary: "s" })).rejects.toMatchObject({
      name: "GeminiKeysExhaustedError",
      reason: "quota",
    });
  });

  it("a suspension-type error anywhere still wins the reason (worse interpretation, PDL-012)", async () => {
    fetchMock
      .mockResolvedValueOnce(err(503, "UNAVAILABLE"))
      .mockResolvedValueOnce(err(403, "PERMISSION_DENIED"))
      .mockResolvedValueOnce(err(503, "UNAVAILABLE"));

    await expect((await provider()).assessRelevance({ title: "t", summary: "s" })).rejects.toMatchObject({
      name: "GeminiKeysExhaustedError",
      reason: "suspected_suspension",
    });
  });
});

describe("writing rule: AI tells never leave the provider", () => {
  it("removes an em dash from any string in a model response before the caller sees it", async () => {
    const body = { candidates: [{ content: { parts: [{ text: JSON.stringify({ relevanceScore: 90, reasoning: "on topic — clearly a coding tool" }) }] } }] };
    fetchMock.mockResolvedValueOnce(res(200, body));

    const out = await (await provider()).assessRelevance({ title: "t", summary: "s" });

    expect(out.reasoning).toBe("on topic, clearly a coding tool");
    expect(JSON.stringify(out)).not.toMatch(/[—–]/);
  });
});

describe("assessRelevanceBatch", () => {
  const items = [
    { id: "a", title: "Cursor ships agents", summary: "s" },
    { id: "b", title: "Aviation report", summary: "s" },
    { id: "c", title: "Claude Code update", summary: "s" },
  ];
  const bodyOf = (scores: unknown) => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ scores }) }] } }] });

  it("maps scores back to article ids by number, in one call", async () => {
    fetchMock.mockResolvedValueOnce(
      res(200, bodyOf([{ n: 3, relevanceScore: 92, reasoning: "direct" }, { n: 1, relevanceScore: 88, reasoning: "direct" }, { n: 2, relevanceScore: 4, reasoning: "off topic" }])),
    );

    const out = await (await provider()).assessRelevanceBatch({ items });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(Object.fromEntries(out.results.map((r) => [r.id, r.relevanceScore]))).toEqual({ a: 88, b: 4, c: 92 });
  });

  it("omits items the model skipped, ignores unknown or repeated numbers and clamps the range", async () => {
    fetchMock.mockResolvedValueOnce(
      res(200, bodyOf([{ n: 1, relevanceScore: 250 }, { n: 1, relevanceScore: 5 }, { n: 9, relevanceScore: 50 }, { n: 3, relevanceScore: "high" }])),
    );

    const out = await (await provider()).assessRelevanceBatch({ items });

    expect(out.results).toEqual([{ id: "a", relevanceScore: 100, reasoning: "" }]);
  });

  it("returns nothing for an empty list without calling the API", async () => {
    expect(await (await provider()).assessRelevanceBatch({ items: [] })).toEqual({ results: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("model fallback (each free-tier model has its own daily quota per key)", () => {
  const dayQuota = () => err(429, "RESOURCE_EXHAUSTED");

  it("moves to the next model when every key is out of quota on the first", async () => {
    process.env.GEMINI_FALLBACK_MODELS = "gemini-3.6-flash";
    fetchMock
      .mockResolvedValueOnce(dayQuota())
      .mockResolvedValueOnce(dayQuota())
      .mockResolvedValueOnce(dayQuota())
      .mockResolvedValueOnce(res(200, OK_BODY));

    const out = await (await provider()).assessRelevance({ title: "t", summary: "s" });

    expect(out.relevanceScore).toBe(80);
    expect(urlOf(0)).toContain("gemini-2.5-flash:");
    expect(urlOf(3)).toContain("gemini-3.6-flash:");
    expect(urlOf(3)).toContain("key=key-one");
  });

  it("throws the primary model's error when the fallback fails too", async () => {
    process.env.GEMINI_FALLBACK_MODELS = "gemini-3.6-flash";
    fetchMock.mockResolvedValue(dayQuota());

    await expect((await provider()).assessRelevance({ title: "t", summary: "s" })).rejects.toMatchObject({ name: "GeminiKeysExhaustedError", reason: "quota" });
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("a 402 on one key rotates on instead of aborting (seen live on gemini-3.6-flash)", async () => {
    fetchMock.mockResolvedValueOnce(err(402, "FAILED_PRECONDITION")).mockResolvedValueOnce(res(200, OK_BODY));
    const out = await (await provider()).assessRelevance({ title: "t", summary: "s" });
    expect(out.relevanceScore).toBe(80);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not try another model for a bad request", async () => {
    process.env.GEMINI_FALLBACK_MODELS = "gemini-3.6-flash";
    fetchMock.mockResolvedValue(err(400, "INVALID_ARGUMENT"));
    await expect((await provider()).assessRelevance({ title: "t", summary: "s" })).rejects.toThrow(/HTTP 400/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("malformed JSON from a model that finished normally", () => {
  const bad = { candidates: [{ finishReason: "STOP", content: { parts: [{ text: '{ "relevanceScore": 80, , "reasoning": "x" }' }] } }] };
  const truncated = { candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: '{ "relevanceScore": 80, "reasoning": "unter' }] } }] };

  it("retries once on the next key and succeeds", async () => {
    fetchMock.mockResolvedValueOnce(res(200, bad)).mockResolvedValueOnce(res(200, OK_BODY));
    const out = await (await provider()).assessRelevance({ title: "t", summary: "s" });
    expect(out.relevanceScore).toBe(80);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a response truncated by MAX_TOKENS (that needs a bigger budget, not another key)", async () => {
    fetchMock.mockResolvedValue(res(200, truncated));
    await expect((await provider()).assessRelevance({ title: "t", summary: "s" })).rejects.toThrow(/MAX_TOKENS/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
