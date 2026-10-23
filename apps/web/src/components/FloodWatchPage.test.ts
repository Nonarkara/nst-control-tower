import { describe, it, expect } from "vitest";
import { selectForBriefing } from "./FloodWatchPage";
import type { RainfallStation, WaterGauge } from "@nst/shared";

/**
 * The water is coming for real. The briefing must show every station the
 * upstream reported, and it must raise the near-bank warning even when the
 * reading is old — because "Incomplete coverage does not cancel observed
 * near-bank water" is the page's own rule, and it was unreachable: the
 * near-bank check ran on the fresh subset, so when the gauges went quiet the
 * river table emptied and the warning went with it.
 */
const NOW = Date.parse("2026-10-23T13:00:00Z");
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();

function gauge(over: Partial<WaterGauge> & { id: string }): WaterGauge {
  return {
    name: "สถานีทดสอบ", lat: 8.4, lng: 99.9, levelMsl: 2, levelPrev: null,
    warningMsl: null, criticalMsl: null, diffFromBank: -0.2, situationLevel: 2,
    trend: "stable", riverName: null, amphoe: "เมือง", observedAt: minutesAgo(0),
    isKeyStation: false, stationCode: "T01", bankMsl: null, fullnessPct: null,
    dischargeCms: null, qmaxCms: null, ...over,
  } as WaterGauge;
}

function station(over: Partial<RainfallStation> & { id: string }): RainfallStation {
  return {
    name: "ฝนทดสอบ", lat: 8.4, lng: 99.9, rain1h: 2, rain24h: 30, observedAt: minutesAgo(0),
    amphoe: "เมือง", ...over,
  } as RainfallStation;
}

describe("the briefing shows every station, and says how old each one is", () => {
  it("a near-bank station that is 95 minutes old is still shown and still raises the warning", () => {
    const gauges = [gauge({ id: "old-near", diffFromBank: -0.2, observedAt: minutesAgo(95) })];
    const out = selectForBriefing(gauges, [], NOW);
    expect(out.gauges.map(g => g.id)).toEqual(["old-near"]);
    expect(out.near.map(g => g.id)).toEqual(["old-near"]);
    expect(out.freshWater).toHaveLength(0);
    expect(out.staleWater).toBe(1);
  });

  it("the fresh count is still reported — nothing is dressed up as current", () => {
    const gauges = [
      gauge({ id: "fresh", observedAt: minutesAgo(5) }),
      gauge({ id: "stale", observedAt: minutesAgo(120) }),
    ];
    const out = selectForBriefing(gauges, [], NOW);
    expect(out.freshWater.map(g => g.id)).toEqual(["fresh"]);
    expect(out.gauges).toHaveLength(2);
    expect(out.staleWater).toBe(1);
  });

  it("the closest station to the bank leads the table, fresh or not", () => {
    const gauges = [
      gauge({ id: "far", diffFromBank: -1.5, observedAt: minutesAgo(95) }),
      gauge({ id: "close", diffFromBank: -0.05, observedAt: minutesAgo(95) }),
    ];
    const out = selectForBriefing(gauges, [], NOW);
    expect(out.gauges.map(g => g.id)).toEqual(["close", "far"]);
  });

  it("rain stations are kept too — old rain still says whether it is still raining", () => {
    const rain = [station({ id: "r1", observedAt: minutesAgo(100), rain24h: 55 })];
    const out = selectForBriefing([], rain, NOW);
    expect(out.rain.map(r => r.id)).toEqual(["r1"]);
    expect(out.freshRain).toHaveLength(0);
    expect(out.staleRain).toBe(1);
  });

  it("no stations at all stays empty — an empty table still means no data", () => {
    const out = selectForBriefing([], [], NOW);
    expect(out.gauges).toHaveLength(0);
    expect(out.near).toHaveLength(0);
    expect(out.staleWater).toBe(0);
  });
});
