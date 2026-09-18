import { describe, expect, it } from "vitest";
import type { EwsStation, RainfallStation, WaterGauge } from "@nst/shared";
import { rankEvacuation, summarizeEvacuation, villageLabel, type EvacData, type EvacVillage } from "./evacPriority";

const SEPT = new Date("2026-09-18T10:00:00+07:00");

function village(over: Partial<EvacVillage> = {}): EvacVillage {
  return {
    code: "80190302", village: "ดอนทราย", moo: "2", community: null, tambon: "ควนหนองคว้า", amphoe: "จุฬาภรณ์",
    lat: 8.0953, lng: 99.9467, floodTypes: ["standing"], mustEvacuate: false, riskMonths: [11, 12],
    population: 1000, households: 350, centre: { authority: "อบต.ควนหนองคว้า", trained: true },
    ...over,
  };
}

function data(villages: EvacVillage[]): EvacData {
  return {
    generatedAt: "2026-09-18", sources: {}, years: { population: "2568", disabled: "2568", elderly: "2567" },
    villages,
    districts: { จุฬาภรณ์: { bedridden: 72, homebound: 223, disabled: 1349, population: 31301 } },
  };
}

function gauge(over: Partial<WaterGauge> = {}): WaterGauge {
  return {
    id: "g1", name: "ควนหนองคว้า", lat: 8.10, lng: 99.95, levelMsl: 5, levelPrev: 5, warningMsl: null, criticalMsl: null,
    diffFromBank: -1, situationLevel: 3, trend: "stable", riverName: "คลอง", amphoe: "จุฬาภรณ์", observedAt: "", isKeyStation: false,
    stationCode: null, bankMsl: 6, fullnessPct: 40, dischargeCms: null, qmaxCms: null, ...over,
  };
}

describe("rankEvacuation", () => {
  it("no live signal and out of season → calm, nobody told to move", () => {
    const rows = rankEvacuation({ data: data([village()]), gauges: [gauge()], now: SEPT });
    expect(rows[0]!.tier).toBe("calm");
    expect(summarizeEvacuation(rows).moveNow).toBe(0);
  });

  it("seasonality alone never triggers 'move now' — only watch for must-evacuate villages", () => {
    const rows = rankEvacuation({ data: data([village({ mustEvacuate: true, riskMonths: [9] })]), gauges: [], now: SEPT });
    expect(rows[0]!.tier).toBe("watch");
  });

  it("an overbank gauge nearby moves a must-evacuate village now, with the reason and the estimate", () => {
    const rows = rankEvacuation({
      data: data([village({ mustEvacuate: true })]),
      gauges: [gauge({ situationLevel: 5, diffFromBank: 0.2, fullnessPct: 104 })],
      now: SEPT,
    });
    const r = rows[0]!;
    expect(r.tier).toBe("move-now");
    expect(r.signals[0]!.text).toMatch(/ควนหนองคว้า gauge .* away/);
    // district rate × village population: 72/31301×1000 ≈ 2, 223/31301×1000 ≈ 7
    expect(r.est).toEqual({ bedridden: 2, homebound: 7, disabled: 43 });
    expect(r.needHelp).toBe(9);
    expect(r.action).toMatch(/Move bedridden and homebound residents now/);
    expect(r.action).toMatch(/อบต\.ควนหนองคว้า/);
  });

  it("a real time-to-overtop ≤ 6 h is critical even before the gauge is over bank", () => {
    const rows = rankEvacuation({
      data: data([village()]),
      gauges: [gauge({ id: "g9" })],
      basins: [{ gauges: [{ id: "g9", etaOvertopH: 4 }] } as never],
      now: SEPT,
    });
    expect(rows[0]!.tier).toBe("move-now");
    expect(rows[0]!.signals[0]!.text).toMatch(/may overtop in about 4\.0 h/);
  });

  it("does not cry wolf: heavy rain alone is 'watch', an EWS prepare alarm is 'get ready'", () => {
    const flash = village({ floodTypes: ["flash"] });
    const heavy = { id: "r", name: "นานอก", lat: 8.1, lng: 99.95, rain1h: 5, rain24h: 45, amphoe: "", observedAt: "" } as RainfallStation;
    expect(rankEvacuation({ data: data([flash]), gauges: [], rain: [heavy], now: SEPT })[0]!.tier).toBe("watch");
    const ews = { id: "S1", name: "เขาหลวง", lat: 8.1, lng: 99.95, status: 2 } as EwsStation;
    expect(rankEvacuation({ data: data([flash]), gauges: [], ews: [ews], now: SEPT })[0]!.tier).toBe("get-ready");
  });

  it("critical alarms and extreme rain do move people now", () => {
    const flash = village({ floodTypes: ["flash"] });
    const ews = { id: "S1", name: "เขาหลวง", lat: 8.1, lng: 99.95, status: 3 } as EwsStation;
    expect(rankEvacuation({ data: data([flash]), gauges: [], ews: [ews], now: SEPT })[0]!.tier).toBe("move-now");
    const burst = { id: "r", name: "ลานสกา", lat: 8.1, lng: 99.95, rain1h: 55, rain24h: 80, amphoe: "", observedAt: "" } as RainfallStation;
    const r = rankEvacuation({ data: data([flash]), gauges: [], rain: [burst], now: SEPT })[0]!;
    expect(r.tier).toBe("move-now");
    expect(r.signals[0]!.text).toMatch(/55 mm in 1 h — extreme rain/);
  });

  it("a stale warning station (stopped reporting) is not evidence — even at CRITICAL", () => {
    const flash = village({ floodTypes: ["flash"] });
    const dead = { id: "S9", name: "บ้านดินดอน", lat: 8.1, lng: 99.95, status: 3, stale: true } as EwsStation;
    expect(rankEvacuation({ data: data([flash]), gauges: [], ews: [dead], now: SEPT })[0]!.tier).toBe("calm");
  });

  it("within a tier, flash-flood villages come before standing-water ones", () => {
    const standing = village({ code: "S", population: 5000 });
    const flash = village({ code: "F", population: 500, floodTypes: ["flash"] });
    const rows = rankEvacuation({ data: data([standing, flash]), gauges: [gauge({ situationLevel: 5, diffFromBank: 0.1 })], now: SEPT });
    expect(rows.map((r) => r.village.code)).toEqual(["F", "S"]);
  });

  it("gauges further than 5 km away are ignored", () => {
    const far = gauge({ lat: 8.15, lng: 99.95, situationLevel: 5, diffFromBank: 0.5 }); // ~6 km
    expect(rankEvacuation({ data: data([village()]), gauges: [far], now: SEPT })[0]!.tier).toBe("calm");
  });

  it("orders by urgency, then by people who need help to move", () => {
    const big = village({ code: "B", population: 3000, mustEvacuate: true });
    const small = village({ code: "S", population: 300, mustEvacuate: true });
    const rows = rankEvacuation({ data: data([small, big]), gauges: [gauge({ situationLevel: 5, diffFromBank: 0.1 })], now: SEPT });
    expect(rows.map((r) => r.village.code)).toEqual(["B", "S"]);
    const s = summarizeEvacuation(rows);
    expect(s.moveNow).toBe(2);
    expect(s.peopleMoveNow).toBe(3300);
  });

  it("unknown population → no invented estimate", () => {
    const r = rankEvacuation({ data: data([village({ population: null })]), gauges: [], now: SEPT })[0]!;
    expect(r.est.bedridden).toBeNull();
    expect(r.needHelp).toBeNull();
  });

  it("labels villages the way people say them", () => {
    expect(villageLabel(village())).toBe("หมู่ 2 บ้านดอนทราย · ต.ควนหนองคว้า · อ.จุฬาภรณ์");
  });
});
