import { describe, test, expect } from "vitest";
import { flowDotPositions, thaDeeFlowPath, etaArcRingsLayer, watershedNodesLayer } from "./layers";
import type { ZoneSummary } from "../lib/watershed";
import type { BasinWaterBalance } from "@nst/shared";

/**
 * flowDotPositions — pure lerp-along-path function driving the watershed
 * flow-dot animation (map/useFlowAnimation.ts). Tested directly (no deck.gl,
 * no rAF) since it's the one part of the animation that's meaningfully
 * deterministic.
 */
describe("flowDotPositions", () => {
  const straightPath: [number, number][] = [[0, 0], [10, 0]]; // 10 units east

  test("returns empty for a path shorter than 2 points", () => {
    expect(flowDotPositions([[0, 0]], 0, 3)).toEqual([]);
    expect(flowDotPositions([], 0.5, 3)).toEqual([]);
  });

  test("returns empty for dotCount < 1", () => {
    expect(flowDotPositions(straightPath, 0.5, 0)).toEqual([]);
  });

  test("t=0 places the first dot at the path start", () => {
    const positions = flowDotPositions(straightPath, 0, 1);
    expect(positions).toHaveLength(1);
    expect(positions[0][0]).toBeCloseTo(0, 5);
    expect(positions[0][1]).toBeCloseTo(0, 5);
  });

  test("t=0.5 places a single dot at the path midpoint", () => {
    const [x, y] = flowDotPositions(straightPath, 0.5, 1)[0];
    expect(x).toBeCloseTo(5, 5);
    expect(y).toBeCloseTo(0, 5);
  });

  test("t=1 wraps to the same position as t=0 (a full lap)", () => {
    const at0 = flowDotPositions(straightPath, 0, 1)[0];
    const at1 = flowDotPositions(straightPath, 1, 1)[0];
    expect(at1[0]).toBeCloseTo(at0[0], 5);
    expect(at1[1]).toBeCloseTo(at0[1], 5);
  });

  test("negative t normalizes into [0,1) rather than going negative", () => {
    const atNeg = flowDotPositions(straightPath, -0.25, 1)[0];
    const atEquiv = flowDotPositions(straightPath, 0.75, 1)[0];
    expect(atNeg[0]).toBeCloseTo(atEquiv[0], 5);
  });

  test("multiple dots are evenly spaced along the path at a given phase", () => {
    const positions = flowDotPositions(straightPath, 0, 2);
    expect(positions).toHaveLength(2);
    // Dot 0 at phase 0 (x=0), dot 1 at phase 0.5 (x=5) — half the path apart.
    expect(positions[0][0]).toBeCloseTo(0, 5);
    expect(positions[1][0]).toBeCloseTo(5, 5);
  });

  test("interpolates across multiple segments, not just the first", () => {
    const bentPath: [number, number][] = [[0, 0], [10, 0], [10, 10]]; // L-shape, 20 units total
    // t=0.75 → 15 units along → 5 units into the second segment (10,0)→(10,10)
    const [x, y] = flowDotPositions(bentPath, 0.75, 1)[0];
    expect(x).toBeCloseTo(10, 5);
    expect(y).toBeCloseTo(5, 5);
  });

  test("a degenerate zero-length path doesn't throw or return NaN", () => {
    const zeroPath: [number, number][] = [[3, 4], [3, 4]];
    expect(flowDotPositions(zeroPath, 0.5, 2)).toEqual([]);
  });
});

/** Builds a minimal ZoneSummary for path-extraction tests — only the fields
 *  thaDeeFlowPath actually reads (zone.river, zone.lng, zone.lat) matter. */
function zone(key: string, river: string, lng: number, lat: number): ZoneSummary {
  return {
    zone: { key, th: key, en: key, role: "", river, lat, lng, amphoe: [] },
    status: "normal",
    situation: 0,
    levelMsl: null,
    diffFromBank: null,
    rain24h: null,
    soil: null,
    ewsStatus: 0,
    rising: false,
    gaugeCount: 0,
    topStation: "",
    modelled: false,
  };
}

describe("thaDeeFlowPath", () => {
  test("excludes zones not on the Tha Dee river (e.g. Thung Song's separate divide)", () => {
    const summaries = [
      zone("thung-song", "คลองท่าเลา / ท่าโลน", 99.679, 8.175),
      zone("khiri-wong", "คลองท่าดี", 99.7833, 8.4338),
      zone("lan-saka", "คลองท่าดี", 99.802, 8.4012),
      zone("city", "คลองท่าดี", 99.9631, 8.4364),
    ];
    const path = thaDeeFlowPath(summaries);
    expect(path).toHaveLength(3);
    // [lng, lat] order, upstream → city.
    expect(path[0]).toEqual([99.7833, 8.4338]);
    expect(path[path.length - 1]).toEqual([99.9631, 8.4364]);
  });

  test("returns an empty path when no zones are on the Tha Dee river", () => {
    expect(thaDeeFlowPath([zone("thung-song", "คลองท่าเลา / ท่าโลน", 99.679, 8.175)])).toEqual([]);
  });
});

/** A ZoneSummary with `isCity` set — required for etaArcRingsLayer to find
 *  the city anchor and emit its three concentric rings. */
function cityZone(lng: number, lat: number): ZoneSummary {
  return {
    zone: { key: "city", th: "เมือง", en: "City", role: "", river: "คลองท่าดี", lat, lng, amphoe: [], isCity: true, basinId: "city_tha_dee" },
    status: "normal",
    situation: 0,
    levelMsl: null,
    diffFromBank: null,
    rain24h: null,
    soil: null,
    ewsStatus: 0,
    rising: false,
    gaugeCount: 0,
    topStation: "",
    modelled: false,
  };
}

/** Builds a minimal BasinWaterBalance — the basin-band wiring in
 *  watershedNodesLayer reads horizons[0].band + verdictEn + basinId. */
function basinBalance(basinId: BasinWaterBalance["basinId"], band: BasinWaterBalance["horizons"][number]["band"], verdictEn = "test verdict"): BasinWaterBalance {
  return {
    basinId,
    nameTh: basinId,
    nameEn: basinId,
    areaKm2: 100,
    areaProvenance: "test",
    runoffCLo: 0.4,
    runoffCHi: 0.7,
    wetness: "moist",
    soilMoisturePct: null,
    tidal: false,
    tideFactor: null,
    horizons: [{ horizonH: 24, rainObservedMm: 0, rainForecastMm: 0, inflowM3Lo: 0, inflowM3Hi: 0, conveyanceM3: null, reservoirHeadroomM3: 0, stressLo: null, stressHi: null, band }],
    gauges: [],
    chokeStationCode: null,
    chokeUtilizationPct: null,
    worstEtaOvertopH: null,
    suggestedScenarioM: null,
    hasReservoir: false,
    reservoirs: [],
    verdictTh: verdictEn,
    verdictEn,
    assumptions: [],
  };
}

describe("etaArcRingsLayer", () => {
  test("returns 4 layers (3 ring PathLayers + 1 label TextLayer) when a city zone is present", () => {
    const layers = etaArcRingsLayer([cityZone(99.9631, 8.4364)]);
    expect(layers).toHaveLength(4);
    const ids = layers.map((l) => String((l as unknown as { id: string }).id));
    expect(ids).toEqual(["eta-arc-1h", "eta-arc-3h", "eta-arc-6h", "eta-arc-labels"]);
  });

  test("returns an empty array when no zone has isCity set", () => {
    const layers = etaArcRingsLayer([zone("khiri-wong", "คลองท่าดี", 99.7833, 8.4338)]);
    expect(layers).toEqual([]);
  });
});

describe("watershedNodesLayer — basin-band bridge", () => {
  test("does not throw when called with an empty basin balance (cold start / network error)", () => {
    // The function still has to render — the markers fall back to the
    // observational status colour when the ledger is empty.
    const summaries = [
      zone("khiri-wong", "คลองท่าดี", 99.7833, 8.4338),
      cityZone(99.9631, 8.4364),
    ];
    expect(() => watershedNodesLayer(summaries, [])).not.toThrow();
    const layers = watershedNodesLayer(summaries, []);
    // 4 layers: flow line + nodes scatter + zone labels + verdict pills.
    // (The verdict pill emits for the upstream zone with a real ETA; the
    // city has no upstream ETA so it gets filtered.)
    expect(layers).toHaveLength(4);
    const ids = layers.map((l) => String((l as unknown as { id: string }).id));
    expect(ids).toEqual(["watershed-flow", "watershed-nodes", "watershed-node-labels", "watershed-verdict-pills"]);
  });

  test("accepts the basin balance without crashing when summaries are empty", () => {
    expect(() => watershedNodesLayer([], [basinBalance("city_tha_dee", "tight")])).not.toThrow();
  });

  test("accepts the basin balance without crashing when the cascade has only the city", () => {
    expect(() =>
      watershedNodesLayer([cityZone(99.9631, 8.4364)], [basinBalance("city_tha_dee", "overflow")]),
    ).not.toThrow();
  });
});
