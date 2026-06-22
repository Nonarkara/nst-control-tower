import { describe, test, expect } from "vitest";
import type { WaterGauge, RainfallStation, EwsStation } from "@nst/shared";
import { summarizeWatershed, summarizeZone, WATERSHED_ZONES } from "./watershed";

function gauge(o: Partial<WaterGauge> = {}): WaterGauge {
  return {
    id: "g",
    name: "บ้านทดสอบ",
    lat: 8.5,
    lng: 99.8,
    levelMsl: 5,
    levelPrev: 4.9,
    warningMsl: 6,
    criticalMsl: 7,
    diffFromBank: -1,
    situationLevel: 3,
    trend: "stable",
    riverName: "คลองท่าดี",
    amphoe: "ลานสกา",
    observedAt: "2026-06-21T08:00:00+07:00",
    isKeyStation: false,
    ...o,
  };
}

function rain(amphoe: string, rain24h: number | null): RainfallStation {
  return {
    id: "r",
    name: "rain",
    lat: 8.5,
    lng: 99.8,
    rain1h: null,
    rain24h,
    amphoe,
    observedAt: "2026-06-21T08:00:00+07:00",
  };
}

function ews(o: Partial<EwsStation> = {}): EwsStation {
  return {
    id: "STN",
    name: "ews",
    lat: 8.5,
    lng: 99.8,
    type: "rain",
    tambon: "",
    amphoe: "ลานสกา",
    basin: "",
    status: 0,
    rain: 0,
    rain12h: 0,
    rain07h: 0,
    waterLevel: null,
    soilMoisture: 50,
    soil07h: 50,
    alertMin: null,
    alertMax: null,
    warn: null,
    observedAt: "2026-06-21T08:00:00+07:00",
    ...o,
  };
}

const ZONE = (key: string) => WATERSHED_ZONES.find((z) => z.key === key)!;

describe("watershed zones", () => {
  test("defines the upstream→city flow order ending at the city", () => {
    expect(WATERSHED_ZONES.map((z) => z.key)).toEqual([
      "thung-song",
      "khiri-wong",
      "lan-saka",
      "city",
    ]);
    expect(WATERSHED_ZONES[WATERSHED_ZONES.length - 1].isCity).toBe(true);
  });
});

describe("summarizeZone", () => {
  test("Khiri Wong matches only คีรีวง-named gauges within ลานสกา", () => {
    const gauges = [
      gauge({ id: "a", name: "สะพานบ้านคีรีวง คลองท่าดี", amphoe: "ลานสกา", situationLevel: 4 }),
      gauge({ id: "b", name: "บ้านวังไทร", amphoe: "ลานสกา", situationLevel: 2 }),
    ];

    const khiri = summarizeZone(ZONE("khiri-wong"), gauges, [], []);
    const lansaka = summarizeZone(ZONE("lan-saka"), gauges, [], []);

    // Khiri Wong picks up the คีรีวง gauge only
    expect(khiri.gaugeCount).toBe(1);
    expect(khiri.situation).toBe(4);
    expect(khiri.status).toBe("high");
    // Lan Saka excludes the คีรีวง gauge
    expect(lansaka.gaugeCount).toBe(1);
    expect(lansaka.topStation).toContain("วังไทร");
  });

  test("overbank situation (5) yields flood status", () => {
    const s = summarizeZone(ZONE("city"), [gauge({ name: "บ้านนาป่า", amphoe: "เมืองนครศรีธรรมราช", situationLevel: 5 })], [], []);
    expect(s.status).toBe("flood");
    expect(s.situation).toBe(5);
  });

  test("a DWR EWS critical status escalates a calm gauge zone to flood", () => {
    const s = summarizeZone(
      ZONE("lan-saka"),
      [gauge({ name: "บ้านวังไทร", situationLevel: 3 })],
      [],
      [ews({ status: 3, soilMoisture: 95 })],
    );
    expect(s.ewsStatus).toBe(3);
    expect(s.status).toBe("flood");
    expect(s.soil).toBe(95);
  });

  test("aggregates max 24h rainfall by amphoe", () => {
    const s = summarizeZone(ZONE("thung-song"), [], [rain("ทุ่งสง", 12), rain("ทุ่งสง", 64), rain("เมือง", 200)], []);
    expect(s.rain24h).toBe(64); // only ทุ่งสง stations counted
  });

  test("matches English amphoe names from HII gauges (adapter emits English)", () => {
    // HII adapter outputs "Lan Saka District" / "Thung Song District" etc.
    const gauges = [
      gauge({ name: "บ้านวังไทร", amphoe: "Lan Saka District", situationLevel: 4 }),
      gauge({ name: "ฝายคลองท่าเลา", amphoe: "Thung Song District", situationLevel: 5 }),
    ];

    const lansaka = summarizeZone(ZONE("lan-saka"), gauges, [], []);
    const thungsong = summarizeZone(ZONE("thung-song"), gauges, [], []);

    expect(lansaka.gaugeCount).toBe(1);
    expect(lansaka.status).toBe("high");
    expect(thungsong.gaugeCount).toBe(1);
    expect(thungsong.status).toBe("flood");
  });

  test("empty zone reports nodata status", () => {
    const s = summarizeZone(ZONE("thung-song"), [], [], []);
    expect(s.status).toBe("nodata");
    expect(s.gaugeCount).toBe(0);
  });
});

describe("summarizeWatershed", () => {
  test("returns one summary per zone in flow order", () => {
    const result = summarizeWatershed([gauge()], [rain("ลานสกา", 5)], []);
    expect(result).toHaveLength(WATERSHED_ZONES.length);
    expect(result.map((r) => r.zone.key)).toEqual(WATERSHED_ZONES.map((z) => z.key));
  });
});
