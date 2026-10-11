import { describe, it, expect, vi, afterEach } from "vitest";
import type { RelayWater } from "./floodDashRelay";

/**
 * What happens when the FloodDash relay goes away.
 *
 * ThaiWater answers a Thai residential IP but not Cloudflare's egress, so every
 * river gauge NST shows has come through one relay on one laptop. That laptop
 * restarted on 2026-10-11 and the dashboard went to ZERO gauges while five NST
 * stations sat at situation level 4 — not because the rivers were quiet, but
 * because the adapter *cached the outage as a fresh, successful answer* and threw
 * away the last good snapshot.
 *
 * `cachedWithStale` only falls back to the previous snapshot when `compute`
 * REJECTS. Resolving `{features: []}` is indistinguishable, to the cache, from
 * a genuine reading of "there are no gauges". These tests pin the reject.
 */

function water(over: Partial<RelayWater> = {}): RelayWater {
  return {
    key: "1093079", name_th: "คลองชะอวด", lat: 7.96636, lng: 99.99436,
    meta: { oldcode: "CHAU01", min_bank: 24.22, river: "คลองชะอวด" },
    obs_time: "2026-10-11T16:40", age_min: 5,
    situation_level: 4, wl_msl: 22.58, storage_pct: 93.24,
    indicator: { rise_m_h: 0.01 },
    ...over,
  };
}

/** Bangkok wall time as the relay reports it, relative to "now". */
function bkkNow(): string {
  return new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 16);
}

function relayPayload() {
  const bkk = bkkNow();
  return JSON.stringify({
    generated_at: new Date().toISOString(),
    water: [
      water({ obs_time: bkk, age_min: 5 }),
      water({ key: "1093080", name_th: "สะพานนางพระยา-บางหลวง", obs_time: bkk, age_min: 5 }),
    ],
    rain: [
      { key: "r1", name_th: "นานอก", lat: 8.1, lng: 99.95, obs_time: bkk, age_min: 5, rain_1h: 3, rain_24h: 40 },
      { key: "r2", name_th: "บ้านตากแดด", lat: 8.45, lng: 99.95, obs_time: bkk, age_min: 5, rain_1h: 0, rain_24h: 12 },
    ],
  });
}

describe("the relay goes down", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not blank the river gauges that were there a minute ago", async () => {
    vi.resetModules();
    let relayDown = false;
    let relayCalls = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).includes("thaiwater.net")) throw new Error("connect timeout");
      relayCalls++;
      if (relayDown) throw new Error("ECONNREFUSED");
      return new Response(relayPayload(), { status: 200, headers: { "content-type": "application/json" } });
    }));

    const { fetchWaterGauges } = await import("./thaiwater");
    const { setCache } = await import("../lib/cache");

    const first = await fetchWaterGauges();
    expect(first.meta.fallbackTier).toBe("live");
    expect(first.features).toHaveLength(2);

    // The laptop reboots. Expire the entry so the next read genuinely recomputes
    // — otherwise this test would pass on a still-fresh cache hit and prove
    // nothing about the outage path at all.
    relayDown = true;
    const callsBefore = relayCalls;
    setCache("thaiwater-gauges", first, -1);

    const second = await fetchWaterGauges();

    // Prove the outage path actually ran (not a cache hit).
    expect(relayCalls).toBeGreaterThan(callsBefore);
    // The total, not the presence of one member: both stations must survive.
    expect(second.features).toHaveLength(2);
    expect(second.meta.fallbackTier).toBe("live");
    expect(second.features.map((g) => g.name).sort()).toEqual([
      "คลองชะอวด", "สะพานนางพระยา-บางหลวง",
    ]);
  });

  it("does not blank the rain gauges either", async () => {
    vi.resetModules();
    let relayDown = false;
    let relayCalls = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).includes("thaiwater.net")) throw new Error("connect timeout");
      relayCalls++;
      if (relayDown) throw new Error("ECONNREFUSED");
      return new Response(relayPayload(), { status: 200, headers: { "content-type": "application/json" } });
    }));

    const { fetchRainfall } = await import("./thaiwater");
    const { setCache } = await import("../lib/cache");

    const first = await fetchRainfall();
    expect(first.features).toHaveLength(2);

    relayDown = true;
    const callsBefore = relayCalls;
    setCache("thaiwater-rain", first, -1);

    const second = await fetchRainfall();
    expect(relayCalls).toBeGreaterThan(callsBefore);
    expect(second.features).toHaveLength(2);
  });

  it("still serves the snapshot after a SECOND outage — the outage is never cached", async () => {
    vi.resetModules();
    let relayDown = false;
    let relayCalls = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).includes("thaiwater.net")) throw new Error("connect timeout");
      relayCalls++;
      if (relayDown) throw new Error("ECONNREFUSED");
      return new Response(relayPayload(), { status: 200, headers: { "content-type": "application/json" } });
    }));

    const { fetchWaterGauges } = await import("./thaiwater");
    const { setCache } = await import("../lib/cache");

    const good = await fetchWaterGauges();
    expect(good.features).toHaveLength(2);
    relayDown = true;

    for (let i = 0; i < 3; i++) {
      setCache("thaiwater-gauges", good, -1);
      const out = await fetchWaterGauges();
      expect(out.features).toHaveLength(2);
    }

    // A retry every single time: the empty feed was never written into the cache.
    expect(relayCalls).toBe(4);
  });

  it("cold start with no snapshot says so, instead of showing an empty river", async () => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("connect ETIMEDOUT");
    }));

    const { fetchWaterGauges } = await import("./thaiwater");
    const feed = await fetchWaterGauges();

    expect(feed.features).toHaveLength(0);
    expect(feed.meta.fallbackTier).toBe("unavailable");
    expect(feed.meta.note).toMatch(/relay also failed/);
    // It must not claim to be live, and must not claim the rivers are quiet.
    expect(feed.meta.source).toBe("thaiwater-waterlevel");
  });

  it("the outage rejects rather than resolving an empty feed", async () => {
    // The cache can only fall back on a REJECTION. This asserts the mechanism
    // directly, so the behavioural tests above cannot be satisfied by a future
    // edit that quietly reintroduces a resolved `{features: []}`.
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("connect ETIMEDOUT");
    }));
    const mod = await import("./thaiwater");
    const { setCache } = await import("../lib/cache");

    // A prior good snapshot, EXPIRED so compute genuinely re-runs. A fresh entry
    // would be returned before compute is ever called, and this assertion would
    // pass against the very defect it is meant to catch.
    setCache("thaiwater-gauges", {
      features: [],
      meta: { source: "x", fetchedAt: new Date().toISOString(), ageMinutes: 0, fallbackTier: "live" },
    }, -1);

    // The outage must reject, so the snapshot is served and stays "live".
    // Resolving an empty feed instead returns "unavailable" — the defect.
    const feed = await mod.fetchWaterGauges();
    expect(feed.meta.fallbackTier).toBe("live");
  });
});