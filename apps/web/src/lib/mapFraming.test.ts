import { describe, test, expect } from "vitest";
import type { WaterGauge } from "@nst/shared";
import { frameCityAndWorstGauge, worstGauge, MAX_GAUGE_DISTANCE_KM } from "./mapFraming";

const CITY = { lng: 99.9631, lat: 8.4304 };
const g = (over: Partial<WaterGauge>): WaterGauge => ({
  id: "g", name: "g", lat: 8.43, lng: 100.0, levelMsl: 1, levelPrev: 1, warningMsl: null, criticalMsl: null, diffFromBank: -1,
  situationLevel: 4, trend: "stable", riverName: "", amphoe: "", observedAt: "", isKeyStation: false, stationCode: null,
  bankMsl: 2, fullnessPct: 90, dischargeCms: null, qmaxCms: null, ...over,
} as WaterGauge);

describe("worstGauge", () => {
  test("ignores calm gauges", () => expect(worstGauge([g({ situationLevel: 3 }), g({ situationLevel: 2 })])).toBeNull());
  test("higher level wins, then fuller channel", () => {
    const a = g({ id: "a", situationLevel: 4, fullnessPct: 97 });
    const b = g({ id: "b", situationLevel: 5, fullnessPct: 50 });
    const c = g({ id: "c", situationLevel: 5, fullnessPct: 80 });
    expect(worstGauge([a, b, c])?.id).toBe("c");
  });
  test("skips gauges with no position", () => expect(worstGauge([g({ lat: NaN })])).toBeNull());
});

describe("frameCityAndWorstGauge", () => {
  test("centres between the city and a gauge 4 km away, at street-ish zoom", () => {
    const f = frameCityAndWorstGauge([g({ lng: 100.0, lat: 8.43 })], CITY)!;
    expect(f.lng).toBeGreaterThan(CITY.lng);
    expect(f.lng).toBeLessThan(100.0);
    expect(f.zoom).toBeGreaterThanOrEqual(13);
    expect(f.zoom).toBeLessThanOrEqual(14);
  });
  test("a farther gauge zooms out so both stay in view", () => {
    const near = frameCityAndWorstGauge([g({ lng: 100.0 })], CITY)!;
    const far = frameCityAndWorstGauge([g({ lng: 100.12, lat: 8.5 })], CITY)!;
    expect(far.zoom).toBeLessThan(near.zoom);
  });
  test("a gauge in another part of the province does not drag the city view away", () => {
    expect(frameCityAndWorstGauge([g({ lng: 99.99, lat: 7.9 })], CITY)).toBeNull();
    expect(MAX_GAUGE_DISTANCE_KM).toBe(25);
  });
  test("no alarming gauge → leave the default view alone", () => {
    expect(frameCityAndWorstGauge([g({ situationLevel: 3 })], CITY)).toBeNull();
  });
  test("a narrow phone viewport zooms out further than a desktop one", () => {
    const d = frameCityAndWorstGauge([g({ lng: 100.06 })], CITY, 900)!;
    const p = frameCityAndWorstGauge([g({ lng: 100.06 })], CITY, 390)!;
    expect(p.zoom).toBeLessThan(d.zoom);
  });
});
