import { describe, test, expect } from "vitest";
import { flowDotPositions, thaDeeFlowPath, etaArcRingsLayer, watershedNodesLayer } from "./layers";
import type { ZoneSummary } from "../lib/watershed";
import type { BasinWaterBalance } from "@nst/shared";
import { STATUS, type StatusLevel } from "../lib/status";
import * as L from "./layers";

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

describe("map colour system — severity maps derive from STATUS", () => {
  const rgb = (l: StatusLevel) => STATUS[l].rgb;
  const rgba = (l: StatusLevel, a: number) => [...STATUS[l].rgb, a];

  test("flood gauges: flood (overbank) → critical", () => {
    expect(L.GAUGE_COLOR).toEqual({
      normal: rgb("normal"), watch: rgb("watch"), warning: rgb("warning"), flood: rgb("critical"), unknown: rgb("unknown"),
    });
  });

  test("dam runoff: low + normal → normal, high → warning, spilling → critical", () => {
    expect(L.DAM_COLOR).toEqual({
      low: rgb("normal"), normal: rgb("normal"), high: rgb("warning"), spilling: rgb("critical"), unknown: rgb("unknown"),
    });
  });

  test("HII situation: 5 → critical, 4 → warning, 1–3 → normal", () => {
    expect(L.SITUATION_RGB[5]).toEqual(rgb("critical"));
    expect(L.SITUATION_RGB[4]).toEqual(rgb("warning"));
    for (const lvl of [1, 2, 3]) expect(L.SITUATION_RGB[lvl]).toEqual(rgb("normal"));
  });

  test("DWR EWS: 0 normal · 1 watch · 2 warning · 3 critical", () => {
    expect([0, 1, 2, 3].map((k) => L.EWS_STATUS_RGB[k])).toEqual(
      [rgb("normal"), rgb("watch"), rgb("warning"), rgb("critical")],
    );
  });

  test("basin band: ok normal · tight watch · overflow critical", () => {
    expect(L.BASIN_BAND_RGB).toEqual({ ok: rgb("normal"), tight: rgb("watch"), overflow: rgb("critical"), unknown: rgb("unknown") });
  });

  test("southern watch + discharge bands share one watch colour", () => {
    expect(L.WATCH_BAND_RGB).toEqual({ normal: rgb("normal"), watch: rgb("watch"), elevated: rgb("warning"), high: rgb("critical") });
    expect(L.DISCHARGE_BAND_RGB).toEqual({
      normal: rgb("normal"), watch: rgb("watch"), warning: rgb("warning"), emergency: rgb("critical"), unknown: rgb("unknown"),
    });
    expect(L.WATCH_BAND_RGB.watch).toEqual(L.GAUGE_COLOR.watch);
  });

  test("flood risk / marks / flood-prone / HII / UNOSAT keep domain alpha on STATUS hues", () => {
    expect(L.FLOOD_COLOR).toEqual({ high: rgba("critical", 44), medium: rgba("warning", 36), low: rgba("watch", 28) });
    expect(L.MARK_COLOR).toEqual({ pabuk: rgb("critical"), normal: rgb("watch") });
    expect(L.FLOOD_PRONE_COLOR).toEqual({ 1: rgba("critical", 200), 2: rgba("warning", 180), 3: rgba("watch", 160) });
    expect(L.HII_RISK_COLOR).toEqual({ 1: rgba("critical", 210), 2: rgba("warning", 190), 3: rgba("watch", 170) });
    expect(L.UNOSAT_SEVERITY_COLOR).toEqual({
      extreme: rgba("critical", 220), high: rgba("warning", 200), medium: rgba("watch", 180), low: rgba("normal", 160),
    });
  });

  test("ETA rings: 1h critical, 3h warning, 6h watch", () => {
    const rings = etaArcRingsLayer([cityZone(99.9631, 8.4364)]).slice(0, 3);
    const colors = rings.map((l) => (l as unknown as { props: { getColor: number[] } }).props.getColor.slice(0, 3));
    expect(colors).toEqual([rgb("critical"), rgb("warning"), rgb("watch")]);
  });
});

describe("map colour system — categorical palettes", () => {
  const key = (c: readonly number[]) => c.slice(0, 3).join(",");

  test("every building type has its own RGB, distinct from untyped", () => {
    const keys = [...Object.values(L.LANDMARK_COLOR), L.UNTYPED_COLOR].map(key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("every civic POI kind has its own RGB", () => {
    const keys = Object.values(L.CIVIC_PALETTE).map((p) => key(p.color));
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("CCTV categories stay on Okabe–Ito", () => {
    expect(L.CCTV_CATEGORY_RGB.traffic).toEqual([230, 159, 0]);
    expect(L.CCTV_CATEGORY_RGB.water).toEqual([86, 180, 233]);
  });
});

describe("map text", () => {
  test("labels use the interface type family, ≥ 12 px, weight ≤ 600", () => {
    const layers = [
      ...watershedNodesLayer([zone("khiri-wong", "คลองท่าดี", 99.7833, 8.4338), cityZone(99.9631, 8.4364)], []),
      ...etaArcRingsLayer([cityZone(99.9631, 8.4364)]),
    ];
    const textLayers = layers
      .map((l) => (l as unknown as { props: { fontFamily?: string; getSize?: number; fontWeight?: number | string } }).props)
      .filter((p) => p.fontFamily !== undefined);
    expect(textLayers.length).toBeGreaterThanOrEqual(3);
    for (const p of textLayers) {
      expect(p.fontFamily).toContain("Libre Franklin");
      expect(p.getSize).toBeGreaterThanOrEqual(12);
      expect(Number(p.fontWeight)).toBeLessThanOrEqual(600);
    }
  });
});
