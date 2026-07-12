import { describe, test, expect, beforeEach } from "vitest";
import {
  BASINS,
  adjustRunoffC,
  etaOvertopHours,
  runoffVolumeM3,
  stressBand,
  tideFactorFromLevels,
  wetnessFromRain24h,
  wetnessFromSoil,
} from "./waterBalance.js";
import {
  recordGaugeSample,
  resetGaugeHistory,
  riseRatePerHour,
} from "../lib/gaugeHistory.js";

// ── runoff volume ──────────────────────────────────────────────────────

describe("runoffVolumeM3", () => {
  test("mm × km² × C converts to m³ exactly", () => {
    // 100 mm over 200 km² at C=0.5 → 0.1 m × 200e6 m² × 0.5 = 10,000,000 m³
    expect(runoffVolumeM3(100, 200, 0.5)).toBe(10_000_000);
  });

  test("zero rain → zero volume", () => {
    expect(runoffVolumeM3(0, 3000, 0.4)).toBe(0);
  });

  test("sanity anchor: annual NST rain over the Tha Dee basin reproduces the GloFAS baseline", () => {
    // 2,400 mm/yr × 200 km² × C 0.45 → mean discharge ≈ 6.8 m³/s, matching the
    // 6–8 m³/s GloFAS baseline the repo calibrated thresholds against.
    const annualM3 = runoffVolumeM3(2400, 200, 0.45);
    const meanCms = annualM3 / (365 * 86400);
    expect(meanCms).toBeGreaterThan(5);
    expect(meanCms).toBeLessThan(9);
  });
});

// ── stress bands ───────────────────────────────────────────────────────

describe("stressBand", () => {
  test("unknown when either bound is null", () => {
    expect(stressBand(null, null)).toBe("unknown");
    expect(stressBand(0.5, null)).toBe("unknown");
  });

  test("overflow when the lo/hi midpoint reaches 1", () => {
    expect(stressBand(0.9, 1.2)).toBe("overflow"); // mid 1.05
    expect(stressBand(1.0, 1.0)).toBe("overflow");
  });

  test("tight when hi reaches 0.7 but midpoint below 1", () => {
    expect(stressBand(0.4, 0.8)).toBe("tight");
    expect(stressBand(0.3, 0.7)).toBe("tight");
  });

  test("ok when even the high estimate stays under 0.7", () => {
    expect(stressBand(0.1, 0.69)).toBe("ok");
    expect(stressBand(0, 0)).toBe("ok");
  });
});

// ── time to overtop ────────────────────────────────────────────────────

describe("etaOvertopHours", () => {
  test("freeboard ÷ rise", () => {
    expect(etaOvertopHours(2, 0.5)).toBe(4);
  });

  test("already overbank → 0", () => {
    expect(etaOvertopHours(-0.3, 0.5)).toBe(0);
    expect(etaOvertopHours(0, 0.01)).toBe(0);
  });

  test("not meaningfully rising → null", () => {
    expect(etaOvertopHours(2, 0.01)).toBeNull(); // below MIN_RISE
    expect(etaOvertopHours(2, -0.2)).toBeNull(); // falling
    expect(etaOvertopHours(null, 0.5)).toBeNull();
    expect(etaOvertopHours(2, null)).toBeNull();
  });
});

// ── tide gating ────────────────────────────────────────────────────────

describe("tideFactorFromLevels", () => {
  test("semi-diurnal sinusoid → roughly half the hours below median → ~0.75", () => {
    const levels = Array.from({ length: 48 }, (_, h) => Math.sin((h / 12.4) * 2 * Math.PI));
    const f = tideFactorFromLevels(levels);
    expect(f).not.toBeNull();
    expect(f!).toBeGreaterThanOrEqual(0.7);
    expect(f!).toBeLessThanOrEqual(0.8);
  });

  test("fewer than 12 samples → null (no reliable median)", () => {
    expect(tideFactorFromLevels([0.1, 0.2, 0.3])).toBeNull();
  });

  test("flat sea → 0.5 floor (nothing strictly below the median)", () => {
    expect(tideFactorFromLevels(Array(48).fill(1.0))).toBe(0.5);
  });
});

// ── wetness → runoff C ─────────────────────────────────────────────────

describe("wetness", () => {
  test("soil bands follow the SOIL_PRIMED precedent", () => {
    expect(wetnessFromSoil(null)).toBe("unknown");
    expect(wetnessFromSoil(90)).toBe("saturated");
    expect(wetnessFromSoil(70)).toBe("wet");
    expect(wetnessFromSoil(45)).toBe("moist");
    expect(wetnessFromSoil(10)).toBe("dry");
  });

  test("rain-24h fallback follows the FloodDash API bands", () => {
    expect(wetnessFromRain24h(150)).toBe("saturated");
    expect(wetnessFromRain24h(80)).toBe("wet");
    expect(wetnessFromRain24h(40)).toBe("moist");
    expect(wetnessFromRain24h(5)).toBe("dry");
  });

  test("adjustRunoffC raises C on saturated ground and clamps at 0.9", () => {
    const sat = adjustRunoffC(0.3, 0.55, "saturated");
    expect(sat.lo).toBeCloseTo(0.45);
    expect(sat.hi).toBeCloseTo(0.75);
    const extreme = adjustRunoffC(0.7, 0.85, "saturated");
    expect(extreme.hi).toBe(0.9); // clamped
    const dry = adjustRunoffC(0.3, 0.55, "dry");
    expect(dry.lo).toBeCloseTo(0.25);
    expect(dry.hi).toBeCloseTo(0.55);
  });
});

// ── basin config invariants ────────────────────────────────────────────

describe("BASINS config", () => {
  test("ids unique, areas positive, C ranges ordered", () => {
    const ids = BASINS.map((b) => b.basinId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of BASINS) {
      expect(b.areaKm2).toBeGreaterThan(0);
      expect(b.cLo).toBeGreaterThan(0);
      expect(b.cLo).toBeLessThan(b.cHi);
      expect(b.areaProvenance.length).toBeGreaterThan(10);
      expect(b.wrfBox.lngMin).toBeLessThan(b.wrfBox.lngMax);
      expect(b.wrfBox.latMin).toBeLessThan(b.wrfBox.latMax);
    }
  });

  test("choke station, when set, is one of the basin's own gauges", () => {
    for (const b of BASINS) {
      if (b.chokeCode) expect(b.gaugeCodes).toContain(b.chokeCode);
    }
  });

  test("the city basin is honest: tidal, no reservoirs, X.203 choke", () => {
    const city = BASINS.find((b) => b.basinId === "city_tha_dee")!;
    expect(city.tidal).toBe(true);
    expect(city.reservoirIds).toHaveLength(0);
    expect(city.chokeCode).toBe("X.203");
    expect(city.chokeQmaxFallback).toBeCloseTo(42.1);
  });

  test("reservoir ids stay within the verified NST set (see rid.ts)", () => {
    const valid = new Set(["rsv434", "rsv435", "rsv436", "rsv437"]);
    for (const b of BASINS) {
      for (const id of b.reservoirIds) expect(valid.has(id)).toBe(true);
    }
  });
});

// ── gauge history ring ─────────────────────────────────────────────────

describe("gaugeHistory", () => {
  beforeEach(() => resetGaugeHistory());

  test("computes m/h from samples spanning the window", () => {
    const t0 = Date.parse("2026-07-13T00:00:00+07:00");
    recordGaugeSample("X.203", "2026-07-13T00:00:00+07:00", 8.0);
    recordGaugeSample("X.203", "2026-07-13T02:00:00+07:00", 8.5);
    const rate = riseRatePerHour("X.203", t0 + 2 * 3600_000);
    expect(rate).toBeCloseTo(0.25);
  });

  test("null until two samples ≥30 min apart", () => {
    recordGaugeSample("g", "2026-07-13T00:00:00+07:00", 8.0);
    expect(riseRatePerHour("g")).toBeNull();
    recordGaugeSample("g", "2026-07-13T00:10:00+07:00", 8.1);
    const t = Date.parse("2026-07-13T00:10:00+07:00");
    expect(riseRatePerHour("g", t)).toBeNull(); // only 10 min span
  });

  test("ignores duplicate observations and null levels", () => {
    recordGaugeSample("g", "2026-07-13T00:00:00+07:00", 8.0);
    recordGaugeSample("g", "2026-07-13T00:00:00+07:00", 9.9); // same timestamp → dropped
    recordGaugeSample("g", "bad-date", 8.2);
    recordGaugeSample("g", "2026-07-13T01:00:00+07:00", null);
    recordGaugeSample("g", "2026-07-13T01:00:00+07:00", 8.6);
    const t = Date.parse("2026-07-13T01:00:00+07:00");
    expect(riseRatePerHour("g", t)).toBeCloseTo(0.6);
  });
});
