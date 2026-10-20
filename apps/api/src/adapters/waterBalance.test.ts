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

// Missing observations are unknown quantities, not zero-rain evidence.
describe("basin ledger input coverage", () => {
  const city = BASINS.find((b) => b.basinId === "city_tha_dee")!;
  test("missing rainfall and forecast never produce a reassuring stress band", async () => {
    const { buildBasinLedger } = await import("./waterBalance.js");
    const ledger = buildBasinLedger(city, { gauges: [], rain: [], reservoirs: [], ews: [], wrf: null, tideFactor: null });
    expect(ledger.horizons.every((h) => h.band === "unknown" && h.stressLo === null && h.stressHi === null)).toBe(true);
    expect(ledger.wetness).toBe("unknown");
    expect(ledger.suggestedScenarioM).toBeNull();
    expect(ledger.verdictEn).toContain("inputs incomplete");
  });
  test("measured official danger remains visible even when the model lacks inputs", async () => {
    const { buildBasinLedger } = await import("./waterBalance.js");
    const ledger = buildBasinLedger(city, { gauges: [{ id: "danger", stationCode: "X.203", situationLevel: 5, observedAt: new Date().toISOString(), levelMsl: 10, bankMsl: 9, trend: "rising", amphoe: "เมืองนครศรีธรรมราช" } as import("@nst/shared").WaterGauge], rain: [], reservoirs: [], ews: [], wrf: null, tideFactor: null });
    expect(ledger.horizons[0].band).toBe("unknown");
    expect(ledger.verdictEn).toContain("exceeds drainage capacity");
  });
});

describe("forecast grid coverage", () => {
  test("zero measured rain can be assessed, while NODATA or missing days cannot", async () => {
    const { buildBasinLedger } = await import("./waterBalance.js");
    const city = BASINS.find((b) => b.basinId === "city_tha_dee")!;
    const grid = { lngMin: 99.7, latMax: 8.5, cellDeg: 0.1, nrows: 1, ncols: 1, valuesMm: [0] };
    const inputs = { gauges: [], rain: [{ amphoe: "ลานสกา", rain24h: 0 }], reservoirs: [], ews: [], wrf: { runId: `${new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)}_12UTC`, fetchedAt: new Date().toISOString(), days: [grid, grid, grid] }, tideFactor: 0.75 };
    expect(buildBasinLedger(city, inputs).horizons.every((h) => h.band === "ok")).toBe(true);
    expect(buildBasinLedger(city, { ...inputs, tideFactor: null }).horizons[0].band).toBe("unknown");
    const missing = buildBasinLedger(city, { ...inputs, wrf: { ...inputs.wrf, days: [grid, null, grid] } });
    expect(missing.horizons.map((h) => h.band)).toEqual(["ok", "unknown", "unknown"]);
    const nodata = { ...grid, valuesMm: [-1] };
    expect(buildBasinLedger(city, { ...inputs, wrf: { ...inputs.wrf, days: [nodata, nodata, nodata] } }).horizons[0].band).toBe("unknown");
  });
});

describe("storm-time forecast and antecedent honesty", () => {
  test("does not reuse yesterday's WRF day-1 as the next 24 hours", async () => {
    const { buildBasinLedger } = await import("./waterBalance.js");
    const grid = { lngMin: 99.7, latMax: 8.5, cellDeg: .1, nrows: 1, ncols: 1, valuesMm: [100] };
    const b = buildBasinLedger(BASINS[0], { gauges: [], rain: [{ amphoe: "ลานสกา", rain24h: 50 }], reservoirs: [], ews: [], tideFactor: .7, wrf: { runId: "2020-01-01_12UTC", fetchedAt: new Date().toISOString(), days: [grid, grid, grid] } });
    expect(b.horizons.every(h => h.band === "unknown")).toBe(true);
  });
  test("uses the fresh antecedent proxy conservatively without presenting it as a soil sensor", async () => {
    const { buildBasinLedger } = await import("./waterBalance.js");
    const b = buildBasinLedger(BASINS[0], { gauges: [], rain: [{ amphoe: "ลานสกา", rain24h: 2 }], reservoirs: [], ews: [], tideFactor: null, wrf: null, antecedent: { api: 900, band: "saturated", asOf: new Date().toISOString() } });
    expect(b.wetness).toBe("saturated"); expect(b.soilMoisturePct).toBeNull();
    expect(b.assumptions.join(" ")).toContain("not measured soil moisture");
  });
});
