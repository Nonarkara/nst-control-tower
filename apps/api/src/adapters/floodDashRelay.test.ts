import { describe, it, expect, vi, afterEach } from "vitest";
import { bangkokIso, mapRelayRain, mapRelayWater, nearestAmphoe, SILENT_AFTER_H, type RelayWater } from "./floodDashRelay";
import { dropSilent, fetchWaterGauges, fetchRainfall } from "./thaiwater";

/**
 * FloodDash relay — the path NST's river gauges take when ThaiWater refuses
 * Cloudflare's egress (2026-09-28: zero gauges on the Worker while five NST
 * stations were at situation level 4).
 */

function water(over: Partial<RelayWater> = {}): RelayWater {
  return {
    key: "1093079", name_th: "คลองชะอวด", lat: 7.96636, lng: 99.99436,
    meta: { oldcode: "CHAU01", min_bank: 24.22, river: "คลองชะอวด" },
    obs_time: "2026-09-28T16:40", age_min: 21,
    situation_level: 4, wl_msl: 22.58, storage_pct: 93.24,
    indicator: { rise_m_h: 0.01 },
    ...over,
  };
}

describe("bangkokIso", () => {
  it("reads FloodDash wall time as Asia/Bangkok", () => {
    expect(bangkokIso("2026-09-28T16:40")).toBe("2026-09-28T09:40:00.000Z");
  });
  it("reads ThaiWater's space-separated form too", () => {
    expect(bangkokIso("2026-09-28 16:40:00")).toBe("2026-09-28T09:40:00.000Z");
  });
  it("keeps an explicit offset", () => {
    expect(bangkokIso("2026-09-28T09:40:00Z")).toBe("2026-09-28T09:40:00.000Z");
  });
  it("garbage → null, not a fake 'now'", () => {
    expect(bangkokIso("not a date")).toBeNull();
    expect(bangkokIso(null)).toBeNull();
  });
});

describe("mapRelayWater", () => {
  it("maps a level-4 station into the WaterGauge contract", () => {
    const { gauges, silent } = mapRelayWater([water()]);
    expect(silent).toBe(0);
    const g = gauges[0]!;
    expect(g.situationLevel).toBe(4);
    expect(g.levelMsl).toBe(22.58);
    // 22.58 − 24.22 = −1.64 → 1.64 m of freeboard (negative = below bank)
    expect(g.diffFromBank).toBe(-1.64);
    expect(g.stationCode).toBe("CHAU01");
    expect(g.observedAt).toBe("2026-09-28T09:40:00.000Z");
    expect(g.amphoe).toBe("ชะอวด");
  });

  it("over the bank reads positive", () => {
    const g = mapRelayWater([water({ wl_msl: 24.5 })]).gauges[0]!;
    expect(g.diffFromBank).toBe(0.28);
  });

  it("a silent station is dropped and counted — never shown as its last value", () => {
    const dead = water({ key: "dead", age_min: 36_000, situation_level: 3 });
    const { gauges, silent } = mapRelayWater([water(), dead]);
    expect(gauges.map((g) => g.id)).toEqual(["1093079"]);
    expect(silent).toBe(1);
  });

  it(`exactly ${SILENT_AFTER_H} h old is still reporting; a minute more is silent`, () => {
    expect(mapRelayWater([water({ age_min: SILENT_AFTER_H * 60 })]).silent).toBe(0);
    expect(mapRelayWater([water({ age_min: SILENT_AFTER_H * 60 + 1 })]).silent).toBe(1);
  });

  it("unknown age is treated as silent", () => {
    expect(mapRelayWater([water({ age_min: null })]).silent).toBe(1);
  });

  it("trend follows the relayed rise rate", () => {
    expect(mapRelayWater([water({ indicator: { rise_m_h: 0.2 } })]).gauges[0]!.trend).toBe("rising");
    expect(mapRelayWater([water({ indicator: { rise_m_h: -0.2 } })]).gauges[0]!.trend).toBe("falling");
    expect(mapRelayWater([water({ indicator: null })]).gauges[0]!.trend).toBe("stable");
  });
});

describe("mapRelayRain", () => {
  it("0 mm is dry, and kept", () => {
    const { stations } = mapRelayRain([{ key: "r", name_th: "บ้านตากแดด", lat: 8.45, lng: 99.95, obs_time: "2026-09-28T15:00", age_min: 60, rain_1h: 0, rain_24h: 0 }]);
    expect(stations).toHaveLength(1);
    expect(stations[0]!.rain24h).toBe(0);
  });
});

describe("nearestAmphoe", () => {
  it("places the city gauge in Mueang", () => {
    expect(nearestAmphoe(8.43, 99.96)).toBe("เมืองนครศรีธรรมราช");
  });
  it("far outside the province → empty, not a wrong district", () => {
    expect(nearestAmphoe(13.75, 100.5)).toBe("");
  });
});

describe("dropSilent (ThaiWater primary path)", () => {
  it("drops readings older than the silence horizon", () => {
    const now = Date.parse("2026-09-28T10:00:00Z");
    const rows = [{ observedAt: "2026-09-28T09:40:00.000Z" }, { observedAt: "2026-09-03T03:00:00.000Z" }, { observedAt: "" }];
    const { live, silent } = dropSilent(rows, now);
    expect(live).toHaveLength(1);
    expect(silent).toBe(2);
  });
});

describe("fallback wiring: ThaiWater down → FloodDash relay", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("gauges and rain come through the relay, labelled, when ThaiWater throws", async () => {
    const now = new Date();
    const bkk = new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 16);
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).includes("thaiwater.net")) throw new Error("connect timeout");
      return new Response(JSON.stringify({
        generated_at: now.toISOString(),
        water: [water({ obs_time: bkk, age_min: 5 }), water({ key: "dead", age_min: 99_999 })],
        rain: [{ key: "r", name_th: "นานอก", lat: 8.1, lng: 99.95, obs_time: bkk, age_min: 5, rain_1h: 3, rain_24h: 40 }],
      }), { status: 200, headers: { "content-type": "application/json" } });
    }));

    const gauges = await fetchWaterGauges();
    expect(gauges.meta.fallbackTier).toBe("live");
    expect(gauges.meta.source).toContain("flooddash");
    expect(gauges.features).toHaveLength(1);
    expect(gauges.meta.note).toMatch(/1 reporting · 1 silent/);

    const rain = await fetchRainfall();
    expect(rain.meta.source).toContain("flooddash");
    expect(rain.features[0]!.rain24h).toBe(40);
  });
});
