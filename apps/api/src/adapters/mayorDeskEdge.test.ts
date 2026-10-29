import { describe, it, expect, vi, afterEach } from "vitest";

/** A cold Worker instance must not make the mayor wait for a full recompute. */
describe("mayor desk — shared last desk", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

  it("a cold instance answers from the edge copy at once, even while every upstream hangs", async () => {
    vi.resetModules();
    const generatedAt = new Date(Date.now() - 4 * 60_000).toISOString();
    const lastDesk = {
      features: [{ generatedAt, level: "warning", answerTh: "ฉบับก่อนหน้า", answerEn: "previous", parts: ["river", "official", "rain", "forecast"].map(key => ({key,level:"unknown",kind:"measured",th:"ไม่ทราบ",en:"Unknown",titleTh:"สถานี",titleEn:"Station",sourceTh:"HII",sourceEn:"HII",evidence:[],observedAt:null,staleAfterMs:7200000})), news: [], notice: null, missing: 0, gaps: [], translationIncomplete: false, translationNote: null }],
      meta: { source: "t", fetchedAt: generatedAt, ageMinutes: 0, fallbackTier: "scenario" },
    };
    const store = new Map<string, Response>([["https://nst-control-tower-api.internal/mayor-desk-v2", new Response(JSON.stringify(lastDesk))]]);
    vi.stubGlobal("caches", { default: { match: async (r: Request) => store.get(r.url)?.clone(), put: async () => {} } });
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {}))); // every upstream hangs

    const { fetchMayorDesk } = await import("./mayorDesk");
    const t0 = Date.now();
    const out = await Promise.race([
      fetchMayorDesk({}),
      new Promise<null>((r) => setTimeout(() => r(null), 2_000)),
    ]);
    expect(out).not.toBeNull();
    expect(Date.now() - t0).toBeLessThan(2_000);
    expect(out!.features[0]!.generatedAt).toBe(generatedAt); // the real age travels with it
  });
});
