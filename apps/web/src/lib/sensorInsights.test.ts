import { describe, test, expect } from "vitest";
import type {
  BasinWaterBalance,
  EwsStation,
  RainfallStation,
  RidReservoir,
  WaterGauge,
} from "@nst/shared";
import { buildSensorInsights, parseFeedTime } from "./sensorInsights";

// ── Fixtures ──────────────────────────────────────────────────────────

function gauge(o: Partial<WaterGauge> = {}): WaterGauge {
  return {
    id: "g1",
    name: "สถานีทดสอบ",
    lat: 8.4,
    lng: 99.9,
    levelMsl: 5,
    levelPrev: 4.9,
    warningMsl: 6,
    criticalMsl: 7,
    diffFromBank: -1,
    situationLevel: 3,
    trend: "stable",
    riverName: "คลองท่าดี",
    amphoe: "Lan Saka District",
    observedAt: "2026-07-13 10:00",
    isKeyStation: false,
    stationCode: "X.203",
    bankMsl: 10.5,
    fullnessPct: 50,
    dischargeCms: null,
    qmaxCms: null,
    ...o,
  };
}

function rain(o: Partial<RainfallStation> = {}): RainfallStation {
  return {
    id: "r1",
    name: "ฝนทดสอบ",
    lat: 8.5,
    lng: 99.8,
    rain1h: 0,
    rain24h: 5,
    amphoe: "Sichon District",
    observedAt: "2026-07-13 10:00",
    ...o,
  };
}

function ews(o: Partial<EwsStation> = {}): EwsStation {
  return {
    id: "e1",
    name: "บ้านทดสอบ",
    lat: 8.6,
    lng: 99.7,
    type: "rain",
    tambon: "ตำบลทดสอบ",
    amphoe: "Nopphitam District",
    basin: "",
    status: 0,
    rain: null,
    rain12h: null,
    rain07h: null,
    waterLevel: null,
    soilMoisture: null,
    soil07h: null,
    alertMin: null,
    alertMax: null,
    warn: null,
    observedAt: "13/07/69 10:00 น.",
    ...o,
  };
}

function reservoir(o: Partial<RidReservoir> = {}): RidReservoir {
  return {
    id: "rsv435",
    name: "อ่างเก็บน้ำคลองกะทูน",
    storageMcm: 70.5,
    volumeMcm: 30,
    storagePct: 42,
    inflowMcm: null,
    outflowMcm: null,
    observedAt: "2026-07-13T00:00:00+07:00",
    ...o,
  };
}

const EMPTY = {
  gauges: [] as WaterGauge[],
  rain: [] as RainfallStation[],
  ews: [] as EwsStation[],
  reservoirs: [] as RidReservoir[],
  basins: [] as BasinWaterBalance[],
};

// ── Tests ─────────────────────────────────────────────────────────────

describe("buildSensorInsights", () => {
  test("calm inputs → no insights", () => {
    expect(
      buildSensorInsights({
        ...EMPTY,
        gauges: [gauge()],
        rain: [rain()],
        ews: [ews()],
        reservoirs: [reservoir()],
      }),
    ).toHaveLength(0);
  });

  test("situation level 4 gauge → overbank warn with freeboard readout", () => {
    const out = buildSensorInsights({
      ...EMPTY,
      gauges: [gauge({ situationLevel: 4, fullnessPct: 93.7, levelMsl: 9.8, bankMsl: 10.5 })],
    });
    const ob = out.find((i) => i.type === "overbank")!;
    expect(ob.severity).toBe("warn");
    expect(ob.body).toContain("94% ของตลิ่ง");
    expect(ob.body).toContain("0.70 ม. ถึงตลิ่ง");
  });

  test("fullness ≥100 or level 5 → critical", () => {
    const out = buildSensorInsights({
      ...EMPTY,
      gauges: [gauge({ situationLevel: 5, fullnessPct: 104 })],
    });
    expect(out.find((i) => i.type === "overbank")!.severity).toBe("critical");
  });

  test("TMD rain bands: 40mm warn, 95mm critical, 35mm/1h flash-critical", () => {
    const out = buildSensorInsights({
      ...EMPTY,
      rain: [
        rain({ id: "a", rain24h: 40 }),
        rain({ id: "b", rain24h: 95, amphoe: "Cha-uat District" }),
        rain({ id: "c", rain1h: 35, amphoe: "Phipun District" }),
      ],
    });
    expect(out.find((i) => i.id === "rain-a")!.severity).toBe("warn");
    expect(out.find((i) => i.id === "rain-b")!.severity).toBe("critical");
    expect(out.find((i) => i.id === "flash-c")!.severity).toBe("critical");
  });

  test("EWS status 3 → critical; soil ≥85 alone → warn", () => {
    const out = buildSensorInsights({
      ...EMPTY,
      ews: [
        ews({ id: "crit", status: 3, soilMoisture: 89 }),
        ews({ id: "soil", status: 0, soilMoisture: 87, amphoe: "Tha Sala District" }),
      ],
    });
    expect(out.find((i) => i.id === "soil-crit")!.severity).toBe("critical");
    expect(out.find((i) => i.id === "soil-soil")!.severity).toBe("warn");
  });

  test("two independent signals in one amphoe → compound event", () => {
    const out = buildSensorInsights({
      ...EMPTY,
      gauges: [gauge({ situationLevel: 4, amphoe: "Cha-uat District" })],
      rain: [rain({ rain1h: 32, amphoe: "Cha-uat District" })],
    });
    const c = out.find((i) => i.type === "compound")!;
    expect(c.titleTh).toContain("2 สัญญาณ");
    expect(c.body).toContain("น้ำสูง");
    expect(c.body).toContain("ฝน 1 ชม.");
  });

  test("reservoir ≥95% → critical, ≥85% → warn", () => {
    const out = buildSensorInsights({
      ...EMPTY,
      reservoirs: [
        reservoir({ id: "rsv434", storagePct: 96 }),
        reservoir({ id: "rsv437", name: "คลองดินแดง", storagePct: 88 }),
      ],
    });
    expect(out.find((i) => i.id === "rsv-rsv434")!.severity).toBe("critical");
    expect(out.find((i) => i.id === "rsv-rsv437")!.severity).toBe("warn");
  });

  test("sensor gap measured against the newest station, not wall clock", () => {
    const out = buildSensorInsights({
      ...EMPTY,
      gauges: [
        gauge({ id: "fresh1", observedAt: "2026-07-13 10:00" }),
        gauge({ id: "fresh2", observedAt: "2026-07-13 09:50" }),
        gauge({ id: "stale", name: "สถานีเงียบ", observedAt: "2026-07-13 02:00" }),
      ],
    });
    const gap = out.find((i) => i.type === "sensor_gap")!;
    expect(gap.titleTh).toContain("8 ชม.");
    expect(gap.severity).toBe("info");
  });

  test("critical sorts before warn before info; capped at 14", () => {
    const gauges = Array.from({ length: 10 }, (_, i) =>
      gauge({ id: `g${i}`, situationLevel: 4, fullnessPct: 90, amphoe: `A${i}` }),
    );
    const out = buildSensorInsights({
      ...EMPTY,
      gauges,
      rain: [rain({ rain1h: 40 })],
    });
    expect(out.length).toBeLessThanOrEqual(14);
    expect(out[0].severity).toBe("critical");
    const ranks = out.map((i) => ({ critical: 0, warn: 1, info: 2 })[i.severity]);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  });
});

describe("parseFeedTime", () => {
  test("parses ThaiWater 'YYYY-MM-DD HH:mm'", () => {
    expect(parseFeedTime("2026-07-13 10:30")).toBe(Date.UTC(2026, 6, 13, 10, 30));
  });
  test("rejects Buddhist-era and junk shapes", () => {
    expect(parseFeedTime("13/07/69 22:30 น.")).toBeNull();
    expect(parseFeedTime("")).toBeNull();
  });
});

describe("tidal-station honesty", () => {
  test("PTTEP3 rapid rise is capped at warn and explains the tide", () => {
    const basin = {
      basinId: "city_tha_dee",
      gauges: [
        {
          id: "pt", code: "PTTEP3", name: "ปากนคร", levelMsl: 0.1, bankMsl: 0.73,
          freeboardM: 0.63, fullnessPct: 84, dischargeCms: null, qmaxCms: null,
          situationLevel: 4, riseMPerH: 0.16, etaOvertopH: 4,
        },
        {
          id: "x", code: "X.203", name: "บ้านนาป่า", levelMsl: 8.3, bankMsl: 10.5,
          freeboardM: 2.2, fullnessPct: 30, dischargeCms: 2.5, qmaxCms: 42,
          situationLevel: 2, riseMPerH: 0.3, etaOvertopH: 7.3,
        },
      ],
    } as unknown as BasinWaterBalance;
    const out = buildSensorInsights({ ...EMPTY, basins: [basin] });
    const tidal = out.find((i) => i.id === "rise-pt")!;
    expect(tidal.severity).toBe("warn");
    expect(tidal.body).toContain("น้ำขึ้น-ลง");
    const inland = out.find((i) => i.id === "rise-x")!;
    expect(inland.severity).toBe("critical");
    expect(inland.body).toContain("ถึงตลิ่งใน");
  });
});
