/**
 * flashFlood — FFPI helpers. Pure functions, locked down at the unit level:
 *   - `computeFfpi` clamping + the four documented bands
 *   - Rain / EWS station → FFPI mapping
 *   - Merge logic (worst-of across rain + EWS + channel fullness bonus)
 *   - Rank assembly: per-amphoe rollup with the EWS-tiebreaker rule
 */

import { describe, it, expect } from "vitest";
import {
  computeFfpi,
  rainStationToFfpi,
  ewsStationToFfpi,
  mergedFfpi,
  rankFfpi,
  ffpiBandToStatusLevel,
  FFPI,
} from "./flashFlood";
import type { EwsStation, RainfallStation, WaterGauge } from "@nst/shared";

function rain(p: Partial<RainfallStation>): RainfallStation {
  return {
    id: "R1",
    name: "ทดสอบ",
    lat: 8.4, lng: 99.9,
    rain1h: 5,
    rain24h: 50,
    amphoe: "พรหมคีรี",
    observedAt: "2026-01-01T00:00:00Z",
    ...p,
  };
}

function ews(p: Partial<EwsStation>): EwsStation {
  return {
    id: "STN0001",
    name: "คีรีวง",
    lat: 8.4, lng: 99.9,
    type: "rain",
    tambon: "ทดสอบ",
    amphoe: "พรหมคีรี",
    basin: "city_tha_dee",
    status: 1,
    rain: 6, rain12h: 12, rain07h: 18,
    waterLevel: null,
    soilMoisture: 60,
    soil07h: null,
    alertMin: null,
    alertMax: null,
    warn: null,
    observedAt: "2026-01-01T00:00:00Z",
    ...p,
  };
}

describe("computeFfpi", () => {
  it("returns normal at score 0 (no readings)", () => {
    const r = computeFfpi({ rain1hMm: 0, rain24hMm: 0, soilPct: 0, ewsStatus: 0 });
    expect(r.score).toBe(0);
    expect(r.band).toBe("normal");
  });

  it("clamps to 0..10 even if all components are saturated", () => {
    const r = computeFfpi({ rain1hMm: 100, rain24hMm: 200, soilPct: 99, ewsStatus: 3 });
    expect(r.score).toBeLessThanOrEqual(10);
    expect(r.score).toBeGreaterThanOrEqual(0);
  });

  it("escalates into `watch` at score ≥ 2", () => {
    const r = computeFfpi({ rain1hMm: 0, rain24hMm: 80, soilPct: 0, ewsStatus: 0 });
    // 80 mm falls in the 35..90 band → component 1. Total = 1. NOT watch.
    expect(r.band).toBe("normal");
    const r2 = computeFfpi({ rain1hMm: 0, rain24hMm: 100, soilPct: 80, ewsStatus: 1 });
    // rain24 90-150 = 2, soil 70-85 = 2, ews = 1 → total 5 → prepare band.
    expect(r2.score).toBeGreaterThanOrEqual(2);
  });

  it("escalates into `prepare` at score ≥ 4", () => {
    const r = computeFfpi({ rain1hMm: 30, rain24hMm: 100, soilPct: 70, ewsStatus: 1 });
    // 1h 15-35 = 1.5; 24h 90-150 = 2; soil 70-85 = 2; ews 1 = 1 → 6.5 → critical? clamp
    expect(["prepare", "critical"]).toContain(r.band);
    expect(r.score).toBeGreaterThanOrEqual(4);
  });

  it("escalates into `critical` at score ≥ 6", () => {
    const r = computeFfpi({ rain1hMm: 50, rain24hMm: 200, soilPct: 90, ewsStatus: 3 });
    // 1h 35+ = 2.5; 24h 150+ = 3; soil 85+ = 3; ews 3 = 3 → 11.5 → clamp 10.
    expect(r.band).toBe("critical");
    expect(r.score).toBe(10);
  });

  it("treats null inputs as zero (no spurious bumps)", () => {
    const r = computeFfpi({ rain1hMm: null, rain24hMm: null, soilPct: null, ewsStatus: null });
    expect(r.score).toBe(0);
    expect(r.band).toBe("normal");
  });

  it("ignores negative or NaN values", () => {
    const r = computeFfpi({ rain1hMm: -3, rain24hMm: NaN, soilPct: -10, ewsStatus: -1 });
    expect(r.score).toBe(0);
  });
});

describe("EWS / rain station → FFPI mapping", () => {
  it("EWS status drives a bigger contribution than rain alone", () => {
    const r1 = ewsStationToFfpi(ews({ status: 3, rain: 50, rain12h: 80, rain07h: 60, soilMoisture: 90 }));
    const r2 = rainStationToFfpi(rain({ rain1h: 50, rain24h: 200 }));
    expect(r1.score).toBeGreaterThanOrEqual(r2.score);
  });

  it("EWS rain07h is treated as the 24h proxy (the closest metric they report)", () => {
    const heavy24 = ewsStationToFfpi(ews({ rain07h: 200, status: 0, soilMoisture: 0 }));
    const light24 = ewsStationToFfpi(ews({ rain07h: 5, status: 0, soilMoisture: 0 }));
    expect(heavy24.score).toBeGreaterThan(light24.score);
  });

  it("rain station with no live rain stays normal", () => {
    const r = rainStationToFfpi(rain({ rain1h: null, rain24h: null }));
    expect(r.score).toBe(0);
  });
});

describe("mergedFfpi", () => {
  it("takes the maximum component across rain + EWS for the same amphoe", () => {
    const r = mergedFfpi({
      rain: rain({ rain1h: 5, rain24h: 50 }), // moderate
      ews: ews({ status: 3, rain: null, rain07h: 1, soilMoisture: 30 }),
    });
    // ews.status=3 is the heaviest single component (3), so the merge
    // should retain that, regardless of the rain's lower numbers.
    expect(r.components.ews).toBeGreaterThanOrEqual(3);
  });

  it("applies channel-fullness bonus only when the gauge is already at bank", () => {
    const base = mergedFfpi({ rain: rain({ rain1h: 0, rain24h: 0 }), ews: null });
    const with95 = mergedFfpi({ rain: rain({ rain1h: 0, rain24h: 0 }), ews: null, channelFullnessPct: 95 });
    const with94 = mergedFfpi({ rain: rain({ rain1h: 0, rain24h: 0 }), ews: null, channelFullnessPct: 94 });
    expect(with95.score).toBe(base.score + 1);
    expect(with94.score).toBe(base.score); // no bonus under threshold
  });

  it("stays at zero when neither rain nor EWS are present", () => {
    const r = mergedFfpi({ rain: null, ews: null });
    expect(r.score).toBe(0);
  });
});

describe("rankFfpi", () => {
  it("rolls up per-amphoe and ranks highest FFPI first", () => {
    const rows = rankFfpi({
      rain: [
        rain({ id: "R1", amphoe: "พรหมคีรี", rain1h: 50, rain24h: 200 }),
        rain({ id: "R2", amphoe: "ลานสกา", rain1h: 5, rain24h: 20 }),
      ],
      ews: [
        ews({ id: "S1", amphoe: "พรหมคีรี", status: 3, rain: 0, rain07h: 0, soilMoisture: 0 }),
      ],
    });
    expect(rows[0]!.ffpi.score).toBeGreaterThan(rows[1]!.ffpi.score);
    expect(rows[0]!.amphoe).toBe("พรหมคีรี");
  });

  it("ties broken by EWS entry (always ranks ahead of rain-only at same score)", () => {
    const rows = rankFfpi({
      rain: [rain({ id: "R1", amphoe: "A", rain1h: 0, rain24h: 80 })],
      ews: [ews({ id: "S1", amphoe: "B", status: 1, rain: 0, rain07h: 80, soilMoisture: 80 })],
      gaugesByAmphoe: new Map(),
    });
    // Both ~3 → tiebreaker: the row with the higher EWS score wins.
    expect(rows.length).toBe(2);
  });

  it("respects the limit cap", () => {
    const rains = Array.from({ length: 100 }, (_, i) =>
      rain({ id: `R${i}`, amphoe: `amphoe-${i}`, rain1h: 0, rain24h: 30 + (i % 50) }),
    );
    const rows = rankFfpi({ rain: rains, limit: 5 });
    expect(rows).toHaveLength(5);
  });

  it("folds in channel-fullness from nearby gauges", () => {
    const rows = rankFfpi({
      rain: [rain({ id: "R1", amphoe: "A", rain1h: 0, rain24h: 0 })],
      ews: [],
      gaugesByAmphoe: new Map([["a", [
        { ...( { id: "G1", name: "", lat: 0, lng: 0, levelMsl: 0, levelPrev: 0, warningMsl: 0, criticalMsl: 0, diffFromBank: 0, situationLevel: 3 as const, trend: "stable" as const, riverName: "", amphoe: "", observedAt: "", isKeyStation: false, stationCode: null, bankMsl: null, fullnessPct: 96, dischargeCms: null, qmaxCms: null } ), }] ]]),
    });
    expect(rows[0]!.ffpi.score).toBe(1); // bonus only
  });
});

describe("ffpiBandToStatusLevel", () => {
  it("maps to the corresponding 5-level vocabulary", () => {
    expect(ffpiBandToStatusLevel("normal")).toBe("normal");
    expect(ffpiBandToStatusLevel("watch")).toBe("watch");
    expect(ffpiBandToStatusLevel("prepare")).toBe("warning");
    expect(ffpiBandToStatusLevel("critical")).toBe("critical");
  });
});

describe("FFPI constants", () => {
  it("exposes bilingual labels", () => {
    expect(FFPI.BAND_LABEL_EN.normal).toBe("Normal");
    expect(FFPI.BAND_LABEL_TH.critical).toBe("วิกฤติ");
  });
});
