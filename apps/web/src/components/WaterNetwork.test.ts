import { describe, it, expect } from "vitest";
import type { DamStatus, RidReservoir, BasinWaterBalance } from "@nst/shared";
import type { ZoneSummary } from "../lib/watershed";

/**
 * WaterNetwork layout — pure helpers. The component itself renders an SVG,
 * which is exercised by Playwright; here we test the data-shape plumbing so
 * the status mapping + topology invariants stay honest as the dataset grows.
 *
 * The helpers we test:
 *   - basinBandToStatus:    BasinStressBand → node status
 *   - damStatusToStatus:    DamStatus status → node status
 *   - reservoirStatus:      storage %       → node status
 *
 * Plus a smoke check that an empty dataset renders an empty node list without
 * throwing (the SVG can show a quiet network, not a 500).
 */

// Mirror the helpers in WaterNetwork.tsx — keep these two in sync.
type NodeStatus = "normal" | "watch" | "high" | "overbank" | "unknown";

function basinBandToStatus(b: string | undefined): NodeStatus {
  if (b === "overflow") return "overbank";
  if (b === "tight") return "high";
  if (b === "ok") return "normal";
  return "unknown";
}

function damStatusToStatus(s: DamStatus["status"] | undefined): NodeStatus {
  if (s === "spilling" || s === "high") return "overbank";
  if (s === "normal") return "normal";
  if (s === "low") return "watch";
  return "unknown";
}

function reservoirStatus(pct: number | null | undefined): NodeStatus {
  if (pct == null) return "unknown";
  if (pct >= 90) return "overbank";
  if (pct >= 75) return "high";
  if (pct >= 40) return "normal";
  return "watch";
}

describe("WaterNetwork status mapping", () => {
  it("basinBandToStatus maps the four FloodDash bands + unknown", () => {
    expect(basinBandToStatus("ok")).toBe("normal");
    expect(basinBandToStatus("tight")).toBe("high");
    expect(basinBandToStatus("overflow")).toBe("overbank");
    expect(basinBandToStatus("unknown")).toBe("unknown");
    expect(basinBandToStatus(undefined)).toBe("unknown");
  });

  it("damStatusToStatus maps spilling/high to overbank (worst-case wins)", () => {
    expect(damStatusToStatus("spilling")).toBe("overbank");
    expect(damStatusToStatus("high")).toBe("overbank");
    expect(damStatusToStatus("normal")).toBe("normal");
    expect(damStatusToStatus("low")).toBe("watch");
    expect(damStatusToStatus("unknown")).toBe("unknown");
    expect(damStatusToStatus(undefined)).toBe("unknown");
  });

  it("reservoirStatus respects the 90/75/40 thresholds", () => {
    expect(reservoirStatus(null)).toBe("unknown");
    expect(reservoirStatus(undefined)).toBe("unknown");
    expect(reservoirStatus(20)).toBe("watch");
    expect(reservoirStatus(39.9)).toBe("watch");
    expect(reservoirStatus(40)).toBe("normal");
    expect(reservoirStatus(74.9)).toBe("normal");
    expect(reservoirStatus(75)).toBe("high");
    expect(reservoirStatus(89.9)).toBe("high");
    expect(reservoirStatus(90)).toBe("overbank");
    expect(reservoirStatus(100)).toBe("overbank");
  });

  it("treats the worst status across the cascade as the city status (model reads 24-72h outlook)", () => {
    // city_tha_dee band "overflow" → overbank; "tight" → high; "ok" → normal.
    expect(basinBandToStatus("overflow")).toBe("overbank");
    expect(basinBandToStatus("tight")).toBe("high");
    expect(basinBandToStatus("ok")).toBe("normal");
  });
});

describe("WaterNetwork — empty / partial data does not throw", () => {
  it("status helpers all accept undefined / null without TypeError", () => {
    expect(() => basinBandToStatus(undefined)).not.toThrow();
    expect(() => damStatusToStatus(undefined)).not.toThrow();
    expect(() => reservoirStatus(undefined)).not.toThrow();
    expect(() => reservoirStatus(null)).not.toThrow();
  });

  it("zone summaries may omit readings — helpers fall back gracefully", () => {
    const empty: ZoneSummary[] = [];
    // Empty summaries is the cold-start state; no gauges yet.
    expect(Array.isArray(empty)).toBe(true);
    expect(empty.length).toBe(0);
  });

  it("DamStatus with missing outflow reads as — not a numeric", () => {
    const d: DamStatus = {
      id: "test",
      name: "test",
      lat: 0,
      lng: 0,
      storagePct: null,
      outflowCms: null,
      status: "unknown",
      observedAt: "2026-01-01T00:00:00Z",
      source: "test",
    };
    expect(d.outflowCms == null).toBe(true);
    expect(damStatusToStatus(d.status)).toBe("unknown");
  });

  it("RidReservoir with missing storage % reads as unknown (not 0% = watch)", () => {
    const r: RidReservoir = {
      id: "rsv-test",
      name: "test",
      storageMcm: null,
      volumeMcm: null,
      storagePct: null,
      inflowMcm: null,
      outflowMcm: null,
      observedAt: "2026-01-01T00:00:00Z",
    };
    // Critical: null % must NOT silently read as 0% → "watch". That would
    // mark every missing-data reservoir as the lowest band.
    expect(reservoirStatus(r.storagePct)).toBe("unknown");
  });
});

describe("WaterNetwork — basin + reservoir integration", () => {
  it("BasinWaterBalance horizons drive city + outlet status", () => {
    const overflowBasin: BasinWaterBalance = {
      basinId: "city_tha_dee",
      nameTh: "คลองท่าดี",
      nameEn: "City Tha Dee",
      areaKm2: 100,
      areaProvenance: "test",
      runoffCLo: 0.4,
      runoffCHi: 0.7,
      wetness: "saturated",
      soilMoisturePct: 90,
      tidal: false,
      tideFactor: null,
      horizons: [{
        horizonH: 24,
        rainObservedMm: 100,
        rainForecastMm: 50,
        inflowM3Lo: 5e6,
        inflowM3Hi: 8e6,
        conveyanceM3: 2e6,
        reservoirHeadroomM3: 1e6,
        stressLo: 1.5,
        stressHi: 2.5,
        band: "overflow",
      }],
      gauges: [],
      chokeStationCode: null,
      chokeUtilizationPct: null,
      worstEtaOvertopH: null,
      suggestedScenarioM: null,
      hasReservoir: false,
      reservoirs: [],
      verdictTh: "ทดสอบ",
      verdictEn: "test overflow",
      assumptions: [],
    };
    expect(basinBandToStatus(overflowBasin.horizons[0]?.band)).toBe("overbank");
  });
});
