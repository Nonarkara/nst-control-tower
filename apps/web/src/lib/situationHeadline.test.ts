import { describe, expect, it } from "vitest";
import type { BasinWaterBalance, WaterGauge } from "@nst/shared";
import { buildSituationHeadline } from "./situationHeadline";
import { feedHealthWord } from "../components/TopBar";

function gauge(over: Partial<WaterGauge> = {}): WaterGauge {
  return {
    id: "g1", name: "Lan Saka", lat: 8.4, lng: 99.8, levelMsl: 20, levelPrev: 19.9,
    warningMsl: null, criticalMsl: null, diffFromBank: -2, situationLevel: 3, trend: "stable",
    riverName: "คลองท่าดี", amphoe: "ลานสกา", observedAt: new Date().toISOString(), isKeyStation: true,
    stationCode: "X.200", bankMsl: 22, fullnessPct: 50, dischargeCms: null, qmaxCms: null,
    ...over,
  };
}

function basinWith(snaps: Array<Partial<BasinWaterBalance["gauges"][number]>>): BasinWaterBalance {
  return {
    gauges: snaps.map((s, i) => ({
      id: `g${i + 1}`, code: null, name: `snap${i + 1}`, levelMsl: 20, bankMsl: 22, freeboardM: 1,
      fullnessPct: 80, dischargeCms: null, qmaxCms: null, situationLevel: 3, riseMPerH: 0.2, etaOvertopH: null,
      ...s,
    })),
  } as unknown as BasinWaterBalance;
}

describe("buildSituationHeadline", () => {
  it("says there is no data when the gauge feed is empty — never 'all normal'", () => {
    const h = buildSituationHeadline({ gauges: [], ageMinutes: null, tier: "unavailable" });
    expect(h.level).toBe("unknown");
    expect(h.headline).toMatch(/No water-gauge data/);
  });

  it("an overbank gauge is the headline, whatever the ETAs say", () => {
    const gauges = [gauge(), gauge({ id: "g2", name: "Khiri Wong", situationLevel: 5, diffFromBank: 0.3 })];
    const h = buildSituationHeadline({ gauges, basins: [basinWith([{ etaOvertopH: 2 }])], ageMinutes: 5, tier: "live" });
    expect(h.level).toBe("critical");
    expect(h.headline).toMatch(/Khiri Wong.*over its bank by 0\.30 m/);
    expect(h.action).toMatch(/Warn residents/);
  });

  it("the soonest real time-to-overtop wins over a fuller but falling gauge", () => {
    const gauges = [
      gauge({ id: "g1", name: "สะพานนางพระยา", fullnessPct: 97, situationLevel: 4, trend: "falling" }),
      gauge({ id: "g2", name: "Lan Saka", fullnessPct: 85, trend: "rising" }),
    ];
    const h = buildSituationHeadline({
      gauges,
      basins: [basinWith([{ id: "g2", etaOvertopH: 3.5, freeboardM: 0.7, riseMPerH: 0.2 }])],
      ageMinutes: 12,
      tier: "live",
    });
    expect(h.level).toBe("critical");
    expect(h.headline).toMatch(/Lan Saka.*may overtop in about 3\.5 h/);
    expect(h.detail).toMatch(/0\.70 m below bank · rising 20 cm\/h/);
    expect(h.freshness).toBe("Gauges updated 12 min ago");
  });

  it("an ETA between 6 and 24 h is a warning with a standby action", () => {
    const h = buildSituationHeadline({ gauges: [gauge()], basins: [basinWith([{ etaOvertopH: 14 }])], ageMinutes: 90, tier: "live" });
    expect(h.level).toBe("warning");
    expect(h.action).toMatch(/standby/);
    expect(h.freshness).toBe("Gauges updated 2 h ago");
  });

  it("falls back to the fullness ranking when nothing is rising", () => {
    const h = buildSituationHeadline({ gauges: [gauge({ fullnessPct: 92, trend: "falling" })], ageMinutes: 3, tier: "live" });
    expect(h.level).toBe("warning");
    expect(h.headline).toMatch(/water is 92% of the way to the top of the bank, and falling/);
  });

  it("calm when every gauge is below watch; flags non-live data", () => {
    const h = buildSituationHeadline({ gauges: [gauge(), gauge({ id: "g2" })], ageMinutes: 400, tier: "cache" });
    expect(h.level).toBe("unknown");
    expect(h.headline).toBe("No watch-level signal in 2 assessable gauges");
    expect(h.freshness).toMatch(/not live \(cache\)/);
  });
});

describe("feedHealthWord", () => {
  it("only says all-live when every feed is live", () => {
    expect(feedHealthWord("healthy", 9, 9).word).toBe("All data sources live");
    expect(feedHealthWord("healthy", 4, 9)).toEqual({ word: "5 of 9 data sources not live", dot: "stale" });
    expect(feedHealthWord("down", 9, 9).dot).toBe("unavailable");
    expect(feedHealthWord("healthy", 0, 9).word).toBe("No live data sources");
  });
});

import { plainReason } from "./situationHeadline";
describe("plainReason", () => {
  it.each([
    ["97% of bank", "water is 97% of the way to the top of the bank"],
    ["over bank", "water is over the bank"],
    ["at/above critical level", "water has reached the critical level"],
    ["0.45 m below critical", "water is 0.45 m from the critical level"],
    ["high (situation 4)", "water is high"],
    ["something new", "something new"],
  ])("%s → %s", (raw, plain) => expect(plainReason(raw)).toBe(plain));
});

describe("Thai headline", () => {
  const base = { id: "g", name: "สะพานนางพระยา", lat: 8.43, lng: 100.0, levelMsl: 0.6, levelPrev: 0.5, warningMsl: null, criticalMsl: null, diffFromBank: -0.13, situationLevel: 4, trend: "rising", riverName: "", amphoe: "เมือง", observedAt: new Date().toISOString(), isKeyStation: false, stationCode: null, bankMsl: 0.73, fullnessPct: 97, dischargeCms: null, qmaxCms: null } as unknown as WaterGauge;
  const th = (over: Partial<WaterGauge> = {}, extra = {}) => buildSituationHeadline({ gauges: [{ ...base, ...over }], ageMinutes: 5, tier: "live", lang: "th", ...extra });

  it("reads as one language — no English words in headline, detail, action or age", () => {
    const h = th();
    for (const text of [h.headline, h.detail, h.action, h.freshness]) expect(text).not.toMatch(/\b(water|bank|rising|check|gauge|updated|ago)\b/i);
  });
  it("says what it means in Thai", () => {
    const h = th();
    expect(h.headline).toContain("น้ำอยู่ที่ 97% ของระดับตลิ่ง");
    expect(h.headline).toContain("และกำลังสูงขึ้น");
    expect(h.freshness).toBe("อัปเดตข้อมูลสถานีเมื่อสักครู่".replace("เมื่อสักครู่", "5 นาทีที่แล้ว"));
  });
  it("over-bank is critical and in Thai", () => {
    const h = th({ situationLevel: 5, diffFromBank: 0.2 });
    expect(h.level).toBe("critical");
    expect(h.headline).toContain("น้ำล้นตลิ่ง");
    expect(h.action).toContain("แจ้งเตือนประชาชน");
  });
  it("no data and calm are in Thai too", () => {
    expect(buildSituationHeadline({ gauges: [], ageMinutes: null, tier: "loading", lang: "th" }).headline).toBe("กำลังตรวจสอบสถานีวัดน้ำ…");
    expect(buildSituationHeadline({ gauges: [{ ...base, situationLevel: 2, fullnessPct: 10, diffFromBank: -5 } as WaterGauge], ageMinutes: 1, tier: "live", lang: "th" }).headline).toMatch(/ยังไม่พบสัญญาณระดับเฝ้าระวัง/);
  });
  it("English is unchanged when no language is given", () => {
    expect(buildSituationHeadline({ gauges: [base], ageMinutes: 5, tier: "live" }).headline).toMatch(/water is 97% of the way/);
  });
});

it("unknown references and absent ETA never become an all-clear", () => {
  const h = buildSituationHeadline({gauges: [gauge({situationLevel:null, fullnessPct:null, diffFromBank:null, warningMsl:null, criticalMsl:null})], ageMinutes: 0, tier: "live"});
  expect(h.level).toBe("unknown");
  expect(h.headline).toContain("0 assessable");
  expect(h.action).not.toContain("No action");
});
it("a recent retrieval cannot renew a stale or future observation", () => {
  for (const observedAt of ["invalid", new Date(Date.now()-121*60_000).toISOString(), new Date(Date.now()+6*60_000).toISOString()]) {
    expect(buildSituationHeadline({gauges:[gauge({observedAt})], ageMinutes:0, tier:"live"}).level).toBe("unknown");
  }
});
