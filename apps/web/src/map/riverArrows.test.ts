import { describe, test, expect } from "vitest";
import type { Feature, LineString } from "geojson";
import type { WaterGauge } from "@nst/shared";
import {
  amountFromSensors,
  arrowSizePx,
  blinkAlpha,
  blinkMsForAmount,
  featureName,
  flowWidthPx,
  isThaDeeName,
  matchReachGauge,
  placeArrows,
  prepareRiverArrows,
  riverArrowGlyphs,
  riverTypographyData,
  segmentAngleDeg,
  type WaterwayArrowProps,
} from "./riverArrows";
import { fmtCityInflowShort, summarizeCityInflow } from "../lib/watershed";

function line(
  coords: [number, number][],
  props: WaterwayArrowProps = {},
): Feature<LineString, WaterwayArrowProps> {
  return { type: "Feature", properties: props, geometry: { type: "LineString", coordinates: coords } };
}

function gauge(o: Partial<WaterGauge> = {}): WaterGauge {
  return {
    id: "g",
    name: "บ้านนาป่า คลองท่าดี",
    lat: 8.436,
    lng: 99.963,
    levelMsl: 3,
    levelPrev: 2.9,
    warningMsl: 4,
    criticalMsl: 5,
    diffFromBank: -1,
    situationLevel: 3,
    trend: "stable",
    riverName: "คลองท่าดี",
    amphoe: "เมืองนครศรีธรรมราช",
    observedAt: "2026-09-03T08:00:00+07:00",
    isKeyStation: true,
    stationCode: "X.1",
    bankMsl: 4,
    fullnessPct: 40,
    dischargeCms: null,
    qmaxCms: 80,
    ...o,
  };
}

const LONG: [number, number][] = [
  [99.90, 8.44],
  [99.96, 8.44],
];

describe("segmentAngleDeg", () => {
  test("eastward segment is ~0° (right-pointing glyph)", () => {
    expect(segmentAngleDeg([0, 0], [1, 0])).toBeCloseTo(0, 5);
  });
  test("northward segment is ~90°", () => {
    expect(segmentAngleDeg([0, 0], [0, 1])).toBeCloseTo(90, 5);
  });
  test("westward segment is ~180°", () => {
    expect(Math.abs(segmentAngleDeg([0, 0], [-1, 0]))).toBeCloseTo(180, 5);
  });
});

describe("amountFromSensors / thickness", () => {
  test("live discharge vs qmax drives amount, thicker than modelled slow", () => {
    const live = amountFromSensors(gauge({ dischargeCms: 40, qmaxCms: 80 }), "slow");
    const modelled = amountFromSensors(null, "slow");
    expect(live.gauged).toBe(true);
    expect(live.amount).toBeCloseTo(0.5, 5);
    expect(modelled.gauged).toBe(false);
    expect(arrowSizePx(live.amount)).toBeGreaterThan(arrowSizePx(modelled.amount));
    expect(flowWidthPx(live.amount)).toBeGreaterThan(flowWidthPx(modelled.amount));
  });

  test("fullness is a gauged fallback when discharge is missing", () => {
    const a = amountFromSensors(gauge({ dischargeCms: null, fullnessPct: 90 }), "slow");
    expect(a.gauged).toBe(true);
    expect(a.amount).toBeCloseTo(0.9, 5);
  });

  test("ungauged uses flowClass (fast > slow)", () => {
    expect(amountFromSensors(null, "fast").amount).toBeGreaterThan(amountFromSensors(null, "slow").amount);
  });
});

describe("blink", () => {
  test("alpha stays in 110–255 and pulses over a cycle", () => {
    const a0 = blinkAlpha(0, 1000);
    const a1 = blinkAlpha(500, 1000);
    expect(a0).toBeGreaterThanOrEqual(110);
    expect(a0).toBeLessThanOrEqual(255);
    expect(a1).toBeGreaterThan(a0);
  });

  test("flood blinks faster than a modelled trickle", () => {
    expect(blinkMsForAmount(0.9, true)).toBeLessThan(blinkMsForAmount(0.2, false));
  });
});

describe("placeArrows", () => {
  test("arrows ride the downhill node order (west → east here)", () => {
    const seeds = placeArrows(LONG, 0.02, 4);
    expect(seeds.length).toBeGreaterThanOrEqual(1);
    for (const s of seeds) {
      expect(s.position[0]).toBeGreaterThanOrEqual(99.90 - 1e-6);
      expect(s.position[0]).toBeLessThanOrEqual(99.96 + 1e-6);
      expect(s.angle).toBeCloseTo(0, 0); // due east
    }
  });
});

describe("matchReachGauge / prepareRiverArrows", () => {
  test("skips stubs, keeps real lines", () => {
    const prepared = prepareRiverArrows([
      line(LONG, { flowClass: "medium", name: "คลองท่าดี" }),
      line([[99.90, 8.44], [99.9001, 8.4401]], { flowClass: "fast" }),
    ]);
    expect(prepared).toHaveLength(1);
    expect(prepared[0].thaDee).toBe(true);
  });

  test("nearby live discharge thickens the Tha Dee reach and flags gauged", () => {
    const g = gauge({ dischargeCms: 60, qmaxCms: 80, lng: 99.93, lat: 8.44 });
    const [live] = prepareRiverArrows([line(LONG, { flowClass: "slow", name: "Khlong Tha Di" })], [g]);
    const [base] = prepareRiverArrows([line(LONG, { flowClass: "slow", name: "Khlong Tha Di" })], []);
    expect(live.gauged).toBe(true);
    expect(live.sizePx).toBeGreaterThan(base.sizePx);
    expect(isThaDeeName(live.name)).toBe(true);
  });

  test("a far-away gauge does not hijack an ungauged drain", () => {
    const g = gauge({ lng: 100.4, lat: 7.9, dischargeCms: 90 });
    const [p] = prepareRiverArrows([line(LONG, { flowClass: "slow" })], [g]);
    expect(p.gauged).toBe(false);
  });

  test("glyphs inherit blink + size from the prepared line", () => {
    const prepared = prepareRiverArrows([line(LONG, { flowClass: "fast", nameEn: "Khlong Tha Di" })]);
    const glyphs = riverArrowGlyphs(prepared, 0);
    expect(glyphs.length).toBe(prepared[0].seeds.length);
    expect(glyphs[0].size).toBe(prepared[0].sizePx);
    expect(glyphs[0].color[3]).toBe(blinkAlpha(0, prepared[0].blinkMs));
  });
});

describe("typography + city inflow", () => {
  test("names HIGH/LOW ends and the city flood destination", () => {
    const prepared = prepareRiverArrows([
      line(LONG, {
        name: "คลองท่าดี",
        nameEn: "Khlong Tha Di",
        flowClass: "fast",
        elevStart: 284,
        elevEnd: 2,
      }),
    ]);
    const inflow = summarizeCityInflow([gauge({ dischargeCms: 12.4, qmaxCms: 40, fullnessPct: 31 })]);
    const labels = riverTypographyData(prepared, inflow);
    const texts = labels.map((l) => l.text).join(" | ");
    expect(texts).toMatch(/คลองท่าดี/);
    expect(texts).toMatch(/HIGH 284/);
    expect(texts).toMatch(/LOW 2/);
    expect(texts).toMatch(/floods here/);
    expect(texts).toMatch(/เมือง/);
    expect(texts).toMatch(/12\.4 m³\/s/);
    expect(texts).toMatch(/LIVE/);
  });

  test("featureName prefers Thai then OSM then English", () => {
    expect(featureName({ nameTh: "คลองท่าดี", name: "x", nameEn: "Tha Dee" })).toContain("คลองท่าดี");
  });

  test("matchReachGauge prefers a rated station inside the radius", () => {
    const far = gauge({ id: "far", lng: 99.93, lat: 8.44, dischargeCms: null });
    const rated = gauge({ id: "q", lng: 99.935, lat: 8.441, dischargeCms: 22 });
    expect(matchReachGauge(99.93, 8.44, [far, rated], true)?.id).toBe("q");
  });
});

describe("summarizeCityInflow", () => {
  test("live discharge at the city gauge", () => {
    const inflow = summarizeCityInflow([gauge({ dischargeCms: 18, qmaxCms: 60, fullnessPct: 50 })]);
    expect(inflow.live).toBe(true);
    expect(inflow.dischargeCms).toBe(18);
    expect(inflow.volumeM3PerHour).toBe(18 * 3600);
    expect(inflow.channelPct).toBeCloseTo(30, 5);
    expect(fmtCityInflowShort(inflow)).toMatch(/LIVE/);
  });

  test("fullness × qmax is estimated, not LIVE", () => {
    const inflow = summarizeCityInflow([gauge({ dischargeCms: null, qmaxCms: 50, fullnessPct: 40 })]);
    expect(inflow.live).toBe(false);
    expect(inflow.estimatedCms).toBeCloseTo(20, 5);
    expect(fmtCityInflowShort(inflow)).toMatch(/est/);
  });

  test("unrelated gauges do not invent city inflow", () => {
    const inflow = summarizeCityInflow([
      gauge({ name: "ฝายคลองท่าเลา", amphoe: "ทุ่งสง", riverName: "คลองท่าเลา", dischargeCms: 99 }),
    ]);
    expect(inflow.dischargeCms).toBeNull();
    expect(inflow.live).toBe(false);
    expect(fmtCityInflowShort(inflow)).toMatch(/MODELLED/);
  });
});
