import { describe, expect, it } from "vitest";
import type { BasinWaterBalance, WaterGauge } from "@nst/shared";
import { buildSituationHeadline } from "./situationHeadline";
import { feedHealthWord } from "../components/TopBar";

function gauge(over: Partial<WaterGauge> = {}): WaterGauge {
  return {
    id: "g1", name: "Lan Saka", lat: 8.4, lng: 99.8, levelMsl: 20, levelPrev: 19.9,
    warningMsl: null, criticalMsl: null, diffFromBank: -2, situationLevel: 3, trend: "stable",
    riverName: "คลองท่าดี", amphoe: "ลานสกา", observedAt: "2026-09-17T00:00:00Z", isKeyStation: true,
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
    expect(h.headline).toMatch(/92% of bank, falling/);
  });

  it("calm when every gauge is below watch; flags non-live data", () => {
    const h = buildSituationHeadline({ gauges: [gauge(), gauge({ id: "g2" })], ageMinutes: 400, tier: "cache" });
    expect(h.level).toBe("normal");
    expect(h.headline).toBe("All 2 water gauges are below watch level");
    expect(h.freshness).toMatch(/not live \(cache\)/);
  });
});

describe("feedHealthWord", () => {
  it("only says all-live when every feed is live", () => {
    expect(feedHealthWord("healthy", 9, 9).word).toBe("All data feeds live");
    expect(feedHealthWord("healthy", 4, 9)).toEqual({ word: "5 of 9 feeds not live", dot: "stale" });
    expect(feedHealthWord("down", 9, 9).dot).toBe("unavailable");
    expect(feedHealthWord("healthy", 0, 9).word).toBe("No live data feeds");
  });
});
