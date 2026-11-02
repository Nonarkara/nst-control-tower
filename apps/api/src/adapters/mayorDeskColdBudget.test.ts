import { afterEach, beforeEach, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({ delay: 15_000, edgeLatency: 0, stamp: "2026-11-03T00:00:00.000Z" }));
vi.mock("./floodOperations.js", () => ({
  fetchFloodObservations: () => new Promise(resolve => setTimeout(() => resolve({
    water: { features: [{ id: "critical", name: "Measured overbank gauge", stationCode: "TEST", diffFromBank: .1,
      trend: "rising", levelPrev: 1, observedAt: fixture.stamp }],
      meta: { source: "fixture", fetchedAt: fixture.stamp, ageMinutes: 0, fallbackTier: "live" } },
    rain: { features: [], meta: { source: "fixture", fetchedAt: fixture.stamp, ageMinutes: 0, fallbackTier: "unavailable" } },
  }), fixture.delay)),
  fetchFloodWeather: async () => ({ points: [], fetchedAt: fixture.stamp }),
}));
vi.mock("./dwrEws.js", () => ({ fetchEwsStations: async () => ({ features: [], meta: { source: "DWR", fetchedAt: fixture.stamp, fallbackTier: "unavailable" } }) }));
vi.mock("./news.js", () => ({ fetchNews: async () => ({ features: [{ id: "news", title: "Bridge repair update", summary: "Road works", tags: ["IN"],
  source: "fixture", sourceUrl: "https://example.org/news", score: 50, publishedAt: fixture.stamp, placeName: null }] }) }));
beforeEach(() => {
  vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(new Date(fixture.stamp));
  vi.stubGlobal("fetch", vi.fn((_url, init) => new Promise((_, reject) => {
    const fail = () => reject(new Error("translation source timeout"));
    if (init?.signal?.aborted) fail();
    else init?.signal?.addEventListener("abort", fail, { once: true });
  })));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
for (const {delay, edgeLatency} of [{delay:15_000,edgeLatency:0},{delay:17_500,edgeLatency:0},{delay:17_500,edgeLatency:750}]) {
  it(`retains critical observations taking ${delay}ms with ${edgeLatency * 2}ms edge I/O within the response budget`, async () => {
    fixture.delay = delay;
    if (edgeLatency) vi.stubGlobal("caches", {default:{
      match: () => new Promise(resolve => setTimeout(() => resolve({json: () => new Promise(r => setTimeout(() => r(null), edgeLatency))}), edgeLatency)),
      put: async () => {},
    }});
    const { fetchMayorDesk } = await import("./mayorDesk");
    const { withCacheLifetime } = await import("../lib/cache");
    const lifetime: Promise<unknown>[] = [];
    let returnedAt = 0;
    const work = withCacheLifetime(p => lifetime.push(p), () => fetchMayorDesk().then(result => { returnedAt = Date.now(); return result; }));
    await vi.advanceTimersByTimeAsync(24_001);
    const result = (await work).features[0];
    expect(result.level).toBe("critical");
    expect(result.parts.find(p => p.key === "river")).toMatchObject({ observedAt: fixture.stamp, sourceTier: "live" });
    expect(returnedAt - Date.parse(fixture.stamp)).toBeLessThanOrEqual(22_000);
    expect(result.translationIncomplete).toBe(true);
    await vi.advanceTimersByTimeAsync(40_000); await Promise.allSettled(lifetime);
  });
}
it("an over-budget observation source stays unknown instead of producing a calm reading", async () => {
  fixture.delay = 30_000;
  const { fetchMayorDesk } = await import("./mayorDesk");
  const { withCacheLifetime } = await import("../lib/cache");
  const lifetime: Promise<unknown>[] = [];
  const work = withCacheLifetime(p => lifetime.push(p), () => fetchMayorDesk());
  await vi.advanceTimersByTimeAsync(24_001);
  const result = (await work).features[0];
  expect(result.parts.find(p => p.key === "river")?.level).toBe("unknown");
  expect(result.level).toBe("unknown");
  expect(result.gaps).toContain("HII water/rain observations unavailable or exceeded their deadline");
  await vi.advanceTimersByTimeAsync(40_000); await Promise.allSettled(lifetime);
});
