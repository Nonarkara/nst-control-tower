import { describe, expect, it } from "vitest";
import type { AirQualityPoint, RainfallStation, WaterGauge } from "@nst/shared";
import {
  airHeatWeight,
  summarizeAir,
  summarizeRain,
  summarizeWater,
  thaDeeFlowSteps,
  waterHeatWeight,
} from "./sensorSituation";

function gauge(partial: Partial<WaterGauge> & Pick<WaterGauge, "id" | "name">): WaterGauge {
  return {
    lat: 8.4,
    lng: 99.9,
    levelMsl: 1.2,
    levelPrev: 1.1,
    warningMsl: 2,
    criticalMsl: 2.5,
    diffFromBank: -0.5,
    situationLevel: 3,
    trend: "stable",
    riverName: "ท่าดี",
    amphoe: "เมือง",
    observedAt: "2026-07-19T00:00:00Z",
    isKeyStation: true,
    stationCode: "X.1",
    bankMsl: 1.7,
    fullnessPct: 60,
    dischargeCms: null,
    qmaxCms: null,
    ...partial,
  };
}

describe("summarizeWater", () => {
  it("returns calm empty summary for no gauges", () => {
    const s = summarizeWater([]);
    expect(s.stationCount).toBe(0);
    expect(s.band).toBe("calm");
    expect(s.worst).toBeNull();
  });

  it("flags critical when any station is overbank", () => {
    const s = summarizeWater([
      gauge({ id: "a", name: "A", situationLevel: 3 }),
      gauge({ id: "b", name: "B", situationLevel: 5, fullnessPct: 110, diffFromBank: 0.3 }),
    ]);
    expect(s.overbank).toBe(1);
    expect(s.band).toBe("critical");
    expect(s.worst?.id).toBe("b");
  });

  it("tracks rising count and mean freeboard", () => {
    const s = summarizeWater([
      gauge({ id: "a", name: "A", trend: "rising", diffFromBank: -1 }),
      gauge({ id: "b", name: "B", trend: "falling", diffFromBank: -0.2 }),
    ]);
    expect(s.rising).toBe(1);
    expect(s.falling).toBe(1);
    expect(s.meanFreeboardM).toBeCloseTo(0.6, 5);
  });
});

describe("summarizeAir", () => {
  it("bands by peak PM2.5", () => {
    const stations: AirQualityPoint[] = [
      {
        lat: 8.4,
        lng: 99.9,
        station: "NST",
        aqi: 80,
        pm25: 40,
        category: "unhealthy-sg",
        observedAt: "2026-07-19T00:00:00Z",
        source: "air4thai",
      },
    ];
    const s = summarizeAir(stations);
    expect(s.band).toBe("watch");
    expect(s.maxPm25).toBe(40);
    expect(s.unhealthyShare).toBe(1);
  });
});

describe("summarizeRain", () => {
  it("uses TMD heavy / very-heavy thresholds", () => {
    const stations: RainfallStation[] = [
      { id: "1", name: "a", lat: 8, lng: 99, rain1h: 2, rain24h: 40, amphoe: "x", observedAt: "t" },
      { id: "2", name: "b", lat: 8, lng: 99, rain1h: 10, rain24h: 95, amphoe: "x", observedAt: "t" },
    ];
    const s = summarizeRain(stations);
    expect(s.heavy).toBe(1);
    expect(s.veryHeavy).toBe(1);
    expect(s.band).toBe("critical");
    expect(s.maxRain24h).toBe(95);
  });
});

describe("thaDeeFlowSteps", () => {
  it("orders Khiri Wong → Lan Saka → City when present", () => {
    const steps = thaDeeFlowSteps([
      gauge({ id: "c", name: "สถานีเมืองนคร", amphoe: "เมือง", riverName: "ท่าดี" }),
      gauge({ id: "a", name: "คีรีวง", amphoe: "ลานสกา", riverName: "ท่าดี" }),
      gauge({ id: "b", name: "ลานสกา", amphoe: "ลานสกา", riverName: "ท่าดี" }),
    ]);
    expect(steps.map((s) => s.nameEn)).toEqual(["Khiri Wong", "Lan Saka", "City"]);
  });
});

describe("heat weights", () => {
  it("waterHeatWeight scales with fullness", () => {
    expect(waterHeatWeight(gauge({ id: "a", name: "A", fullnessPct: 120 }))).toBe(1);
    expect(waterHeatWeight(gauge({ id: "b", name: "B", fullnessPct: 60 }))).toBeCloseTo(0.5, 5);
  });

  it("airHeatWeight scales with pm25", () => {
    expect(
      airHeatWeight({
        lat: 0,
        lng: 0,
        station: "x",
        aqi: null,
        pm25: 75,
        category: "unhealthy",
        observedAt: "t",
        source: "air4thai",
      }),
    ).toBeCloseTo(0.5, 5);
  });
});
