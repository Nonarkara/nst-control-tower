import { describe, test, expect } from "vitest";
import type { WaterGauge, RainfallStation, PrecipNowcast, EwsStation } from "@nst/shared";
import { computePosture, leadSignal, LADDER } from "./floodPosture";

// ── Fixtures ──────────────────────────────────────────────────────────
function gauge(overrides: Partial<WaterGauge> = {}): WaterGauge {
  return {
    id: "g1",
    name: "สถานีโทรมาตร Test",
    lat: 8.4,
    lng: 99.9,
    levelMsl: 5,
    levelPrev: 4.9,
    warningMsl: 6,
    criticalMsl: 7,
    diffFromBank: -1,
    situationLevel: 3,
    trend: "stable",
    riverName: "Pak Phanang",
    amphoe: "Mueang",
    observedAt: "2026-06-21T08:00:00+07:00",
    isKeyStation: false,
    ...overrides,
  };
}

function rain(rain24h: number | null): RainfallStation {
  return {
    id: "r1",
    name: "Rain Test",
    lat: 8.4,
    lng: 99.9,
    rain1h: null,
    rain24h,
    amphoe: "Mueang",
    observedAt: "2026-06-21T08:00:00+07:00",
  };
}

function precip(overrides: Partial<PrecipNowcast> = {}): PrecipNowcast {
  return {
    nowMm: 0,
    total2hMm: 0,
    peakMm: 0,
    peakAt: null,
    firstSignificantAt: null,
    minutesToSignificant: null,
    intensity: "dry",
    points: [],
    ...overrides,
  };
}

function ews(overrides: Partial<EwsStation> = {}): EwsStation {
  return {
    id: "STN0079",
    name: "Lan Saka EWS",
    lat: 8.5,
    lng: 99.8,
    type: "rain",
    tambon: "",
    amphoe: "ลานสกา",
    basin: "ภาคใต้ฝั่งตะวันออก",
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
    ...overrides,
  };
}

describe("computePosture", () => {
  test("returns Level 1 MONITOR when all stations are within banks and dry", () => {
    const result = computePosture([gauge({ situationLevel: 3 })], [rain(0)], precip());

    expect(result.level).toBe(1);
    expect(result.drivers).toContain("all stations within banks");
  });

  test("a single high-water station (situation 4) lifts posture to Level 3 EVAC VULNERABLE", () => {
    const result = computePosture([gauge({ situationLevel: 4 })], [], precip());

    expect(result.level).toBe(3);
    expect(LADDER[result.level].en).toBe("EVAC VULNERABLE");
    expect(result.drivers).toContain("river high (situation 4)");
  });

  test("very-heavy rain (>90 mm/24h) escalates a high river one further level", () => {
    // situation 4 → base L3, + very-heavy rain → L4 evacuation order
    const result = computePosture([gauge({ situationLevel: 4 })], [rain(120)], precip());

    expect(result.level).toBe(4);
    expect(LADDER[result.level].en).toBe("EVACUATION ORDER");
  });

  test("widespread overbank (>=3 stations) forces Level 5 EMERGENCY", () => {
    const result = computePosture(
      [
        gauge({ id: "a", situationLevel: 5 }),
        gauge({ id: "b", situationLevel: 5 }),
        gauge({ id: "c", situationLevel: 5 }),
      ],
      [],
      precip(),
    );

    expect(result.level).toBe(5);
    expect(result.overbankCount).toBe(3);
    expect(LADDER[result.level].en).toBe("EMERGENCY");
  });

  test("heavy rain now plus a rising gauge escalates (composite trigger)", () => {
    const result = computePosture(
      [gauge({ situationLevel: 4, trend: "rising" })],
      [],
      precip({ intensity: "heavy" }),
    );

    // base L3 + heavy-now & rising → L4
    expect(result.level).toBe(4);
    expect(result.drivers).toContain("heavy rain now + gauges rising");
  });

  test("weights the highest upland 24h rainfall across stations", () => {
    const result = computePosture(
      [gauge({ situationLevel: 3 })],
      [rain(10), rain(95), rain(40)],
      precip(),
    );

    expect(result.rain24hMax).toBe(95);
    // moderate river but very-heavy upland rain → at least standby/escalated
    expect(result.level).toBeGreaterThanOrEqual(2);
  });

  test("clamps to the 1..5 range", () => {
    // Stack every escalator: overbank-forced L5 should not exceed 5
    const result = computePosture(
      [
        gauge({ id: "a", situationLevel: 5, trend: "rising" }),
        gauge({ id: "b", situationLevel: 5, trend: "rising" }),
        gauge({ id: "c", situationLevel: 5, trend: "rising" }),
      ],
      [rain(200)],
      precip({ intensity: "heavy" }),
    );

    expect(result.level).toBe(5);
    expect(result.level).toBeLessThanOrEqual(5);
  });
});

describe("computePosture — DWR EWS upland signal", () => {
  test("an EWS critical upland alert (status 3) lifts posture to L4 even with a calm city river", () => {
    const result = computePosture(
      [gauge({ situationLevel: 3 })],
      [],
      precip(),
      [ews({ status: 3 })],
    );

    expect(result.level).toBe(4);
    expect(result.worstEwsStatus).toBe(3);
    expect(result.drivers.some((d) => d.includes("upland EWS"))).toBe(true);
  });

  test("an EWS prepare alert (status 2) lifts a calm posture to L3", () => {
    const result = computePosture([gauge({ situationLevel: 3 })], [], precip(), [ews({ status: 2 })]);

    expect(result.level).toBe(3);
    expect(LADDER[result.level].en).toBe("EVAC VULNERABLE");
  });

  test("saturated upland soil plus heavy 12h rain flags a flash-flood-primed slope", () => {
    const result = computePosture(
      [gauge({ situationLevel: 3 })],
      [],
      precip(),
      [ews({ soilMoisture: 90, rain12h: 60 })],
    );

    expect(result.primedCount).toBe(1);
    expect(result.level).toBeGreaterThanOrEqual(3);
    expect(result.drivers.some((d) => d.includes("primed"))).toBe(true);
  });

  test("saturated soil WITHOUT rain is not counted as primed", () => {
    const result = computePosture(
      [gauge({ situationLevel: 3 })],
      [],
      precip(),
      [ews({ soilMoisture: 95, rain12h: 0 })],
    );

    expect(result.primedCount).toBe(0);
    expect(result.maxSoil).toBe(95);
    expect(result.level).toBe(1);
  });

  test("reports max upland soil moisture across stations", () => {
    const result = computePosture([], [], precip(), [
      ews({ id: "a", soilMoisture: 40 }),
      ews({ id: "b", soilMoisture: 88 }),
      ews({ id: "c", soilMoisture: 70 }),
    ]);

    expect(result.maxSoil).toBe(88);
    expect(result.worstEwsStatus).toBe(0);
  });
});

describe("leadSignal", () => {
  test("reports imminent rain when significant rain is <=15 min out", () => {
    expect(leadSignal(precip({ minutesToSignificant: 15 }), 0)).toBe("rain imminent");
  });

  test("reports a countdown when significant rain is further out", () => {
    expect(leadSignal(precip({ minutesToSignificant: 45 }), 0)).toBe("rain in ~45 min");
  });

  test("falls back to rising-level watch when no rain forecast but gauges rising", () => {
    expect(leadSignal(precip(), 2)).toBe("levels rising — watch peak");
  });

  test("reports no near-term signal when dry and steady", () => {
    expect(leadSignal(precip(), 0)).toBe("no near-term rain signal");
  });
});
