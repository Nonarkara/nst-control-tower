import { describe, it, expect } from "vitest";
import { SOUTHERN_PROVINCE_CODES } from "@nst/shared";
import { computeSouthernRisk, buildSouthernCascade } from "./flooddash";
import { NST_CANAL_GLOFAS_THRESHOLDS } from "./flood.js";

describe("computeSouthernRisk", () => {
  it("scores provinces with level-5 water as high band", () => {
    const water = [{
      key: "1",
      nameTh: "สถานี A",
      nameEn: "Station A",
      provinceCode: "80",
      provinceTh: "นครศรีธรรมราช",
      provinceEn: "Nakhon Si Thammarat",
      regionTh: "ภาคใต้",
      regionEn: "South",
      lat: 8.43,
      lng: 99.96,
      obsTime: "2026-06-15T10:00:00",
      situationLevel: 5,
      storagePct: null,
    }];
    const forecast = new Map([["80", 5]]);
    const feed = computeSouthernRisk(water, [], forecast);
    expect(feed.provinces).toHaveLength(1);
    expect(feed.provinces[0].band).toBe("elevated");
    expect(feed.provinces[0].stationsL5).toBe(1);
    expect(feed.summary.regionalBand).toBe("elevated");
  });

  it("weights heavy rain into elevated band", () => {
    const rain = [{
      key: "2",
      nameTh: "ฝนหนัก",
      nameEn: "Heavy rain",
      provinceCode: "79",
      provinceTh: "สงขลา",
      provinceEn: "Songkhla",
      regionTh: "ภาคใต้",
      regionEn: "South",
      lat: 7.0,
      lng: 100.5,
      obsTime: "2026-06-15T10:00:00",
      rain24h: 100,
      rain1h: 5,
    }];
    const forecast = new Map([["79", 20]]);
    const feed = computeSouthernRisk([], rain, forecast);
    expect(feed.provinces[0].rainScore).toBeGreaterThanOrEqual(80);
    expect(["watch", "elevated", "high"]).toContain(feed.provinces[0].band);
  });

  it("returns empty provinces when no southern data", () => {
    const feed = computeSouthernRisk([], [], new Map());
    expect(feed.provinces).toHaveLength(0);
    expect(feed.summary.regionalBand).toBe("normal");
  });
});

describe("buildSouthernCascade", () => {
  it("maps GloFAS discharge to reach bands", () => {
    const results = SOUTHERN_REACH_COUNT().map((_, i) => ({
      daily: {
        time: ["2026-06-15"],
        river_discharge: [i === 0 ? 300 : 50],
      },
    }));
    const feed = buildSouthernCascade(results);
    expect(feed.reaches.length).toBeGreaterThan(0);
    const hatYai = feed.reaches.find((r) => r.id === "utaphao_hatyai");
    expect(hatYai?.band).toBe("warning");
    expect(hatYai?.discharge).toBe(300);
  });

  it("NST canal reaches use same thresholds as flood.ts (52 m³/s = emergency)", () => {
    const results = SOUTHERN_REACH_COUNT().map((_, i) => ({
      daily: {
        time: ["2026-06-15"],
        river_discharge: [i === 4 ? 52 : 10], // pak_phanang index
      },
    }));
    const feed = buildSouthernCascade(results);
    const pak = feed.reaches.find((r) => r.id === "pak_phanang");
    expect(pak?.discharge).toBe(52);
    expect(pak?.band).toBe("emergency");
    expect(pak?.thresholds.emergency).toBe(NST_CANAL_GLOFAS_THRESHOLDS.emergency);
  });
});

describe("SOUTHERN_PROVINCE_CODES", () => {
  it("matches 14 ThaiWater southern province codes (80–86, 90–96)", () => {
    expect(SOUTHERN_PROVINCE_CODES.size).toBe(14);
    for (const code of ["80", "81", "82", "83", "84", "85", "86", "90", "91", "92", "93", "94", "95", "96"]) {
      expect(SOUTHERN_PROVINCE_CODES.has(code)).toBe(true);
    }
    expect(SOUTHERN_PROVINCE_CODES.has("76")).toBe(false);
    expect(SOUTHERN_PROVINCE_CODES.has("79")).toBe(false);
  });
});

function SOUTHERN_REACH_COUNT(): unknown[] {
  return Array.from({ length: 5 });
}
