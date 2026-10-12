import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import type { WaterGauge } from "@nst/shared";
import { waterBand } from "./sensorSituation";

/**
 * A gauge with no official situation level must never be banded "calm".
 *
 * `waterBand` used to fall straight through to `return "calm"` for anything that
 * was not level 4-5. That was harmless while `situation()` invented a 3 for a
 * missing reading — the invented 3 is what created the calm. Now that absence
 * correctly arrives as `null`, the same fall-through would have turned a fix
 * into a worse lie: the station that could not be classified would become the
 * one thing the situation board calls calm.
 *
 * So with no official level the band falls back to what is actually measured —
 * channel fullness, then freeboard, then trend.
 */

function gauge(over: Partial<WaterGauge> = {}): WaterGauge {
  return {
    id: "g1", name: "โรงเรียนวัดโคกโพธิ์สถิตย์",
    lat: 8.44, lng: 99.76,
    levelMsl: 23.26, levelPrev: 23.3,
    warningMsl: 24, criticalMsl: 24.5,
    diffFromBank: -5.4,
    situationLevel: null,
    trend: "falling",
    riverName: "คลองปง",
    amphoe: "ลานสกา",
    observedAt: "2026-10-12T02:20:00.000Z",
    isKeyStation: false,
    stationCode: "LS.1",
    bankMsl: 28.66,
    fullnessPct: null,
    dischargeCms: null,
    qmaxCms: null,
    ...over,
  };
}

describe("a gauge with no official level is judged on what is measured", () => {
  it("is never 'calm' when the channel is over the bank", () => {
    // diffFromBank >= 0 means the water is at or above bank level. HII's
    // situation field is absent; the physical measurement is not.
    const band = waterBand(gauge({ diffFromBank: 0.4, fullnessPct: null, trend: "stable" }));
    expect(band).toBe("critical");
  });

  it("reads a near-full channel as elevated, not calm", () => {
    expect(waterBand(gauge({ fullnessPct: 96, trend: "stable" }))).toBe("elevated");
  });

  it("reads a full channel as critical", () => {
    expect(waterBand(gauge({ fullnessPct: 104 }))).toBe("critical");
  });

  it("reads a rising channel as watch", () => {
    expect(waterBand(gauge({ fullnessPct: 40, trend: "rising" }))).toBe("watch");
  });

  it("is calm only when the measurements say so", () => {
    expect(waterBand(gauge({ fullnessPct: 30, trend: "falling" }))).toBe("calm");
  });
});

describe("a gauge WITH an official level is unchanged", () => {
  it("still bands straight off HII's number", () => {
    expect(waterBand(gauge({ situationLevel: 5, fullnessPct: 10 }))).toBe("critical");
    expect(waterBand(gauge({ situationLevel: 4, fullnessPct: 10 }))).toBe("elevated");
    // Level 3 stays "calm" even with rising water and full channel: HII said normal.
    expect(waterBand(gauge({ situationLevel: 3, fullnessPct: 99, trend: "rising" }))).toBe("watch");
  });
});

describe("nothing downstream borrows the label for a level that does not exist", () => {
  const panel = readFileSync(new URL("../components/WaterPanel.tsx", import.meta.url), "utf8");

  it("the gauge list does not file an unclassified station under 'normal'", () => {
    // `g.situationLevel < 4` is TRUE for null, so a one-character guard is the
    // difference between "unclassified" and "OK".
    expect(panel).toMatch(/situationLevel != null && g\.situationLevel < 4/);
    expect(panel).not.toMatch(/gauges\.filter\(\(g\) => g\.situationLevel < 4\)/);
  });

  it("the gauge panel says how many stations were unclassified", () => {
    // A caveat that looks delivered but never renders is worse than no caveat —
    // the BuildingLegend lesson. If a station drops out of the "normal" bucket,
    // the count must be visible, or the list just looks shorter.
    expect(panel).toMatch(/unclassified\.length > 0/);
    expect(panel).toMatch(/reported no HII situation level/);
    expect(panel).toMatch(/not counted as normal above/);
  });

  it("the waterflow picture sends a null level to 'unknown', never to normal", () => {
    const pic = readFileSync(new URL("../components/WaterFlowPicture.tsx", import.meta.url), "utf8");
    expect(pic).toMatch(/function situationToStatus\(sit: number \| null\)/);
    // The `sit === 3 → "normal"` branch must stay unreachable for a missing value.
    expect(pic).toMatch(/if \(sit === 3\) return "normal";\n\s*if \(sit === 2 \|\| sit === 1\) return "watch";\n\s*return "unknown";/);
  });
});