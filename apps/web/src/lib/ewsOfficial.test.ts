import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  ewsAlertState,
  ewsSoilState,
  ewsStatusLine,
  ewsStatusLineEn,
  ewsWaterRows,
  SOIL_PRIMED,
} from "./ewsOfficial";
import type { EwsStation } from "@nst/shared";

/**
 * The official DWR layer, on the mayor's briefing.
 *
 * The water is coming for real now, and the one thing the briefing could not
 * say was what the authority itself had declared. These tests pin the rules
 * that decide what a duty officer is told, so that a later change cannot
 * quietly turn "no alert" into "we could not ask".
 */
const NOW = Date.parse("2026-10-23T15:00:00Z");
beforeEach(() => { vi.spyOn(Date, "now").mockReturnValue(NOW); });
afterEach(() => { vi.restoreAllMocks(); });
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();

function station(over: Partial<EwsStation> & { id: string }): EwsStation {
  return {
    name: "สถานีทดสอบ", lat: 8.4, lng: 99.9, type: "water", tambon: "กำโลน",
    amphoe: "สิชล", basin: "ภาคใต้ฝั่งตะวันออก", status: 0, rain: 0, rain12h: 0,
    rain07h: 0, waterLevel: 1, soilMoisture: null, soil07h: null, alertMax: 4,
    warn: null, observedAt: minutesAgo(10), stale: false, ...over,
  } as EwsStation;
}

describe("the official alert state is never guessed", () => {
  it("a province with nothing declared says so, and says how much it checked", () => {
    const state = ewsAlertState([station({ id: "a" }), station({ id: "b" })]);
    expect(state.checked).toBe(2);
    expect(state.maxTier).toBe(0);
    expect(state.alerting).toHaveLength(0);
    expect(ewsStatusLine(state)).toBe("ไม่มีประกาศเตือนจาก DWR ขณะนี้ (ตรวจ 2 สถานีที่มีรายงานปัจจุบัน)");
  });

  it("an unreadable source is NOT the same sentence as no alert", () => {
    const state = ewsAlertState([]);
    expect(state.checked).toBe(0);
    const line = ewsStatusLine(state);
    expect(line).toContain("ยังยืนยันสถานะเตือน DWR ไม่ได้");
    expect(line).toContain("ไม่ใช่การไม่มีประกาศ");
    expect(line).not.toContain("ไม่มีประกาศเตือน");
    expect(ewsStatusLineEn(state)).toContain("cannot be confirmed");
  });

  it("an alert in force is stated, with the count and the tier", () => {
    const state = ewsAlertState([
      station({ id: "a", status: 0 }),
      station({ id: "b", status: 2 }),
      station({ id: "c", status: 1 }),
    ]);
    expect(state.maxTier).toBe(2);
    expect(state.alerting.map(s => s.id)).toEqual(["b", "c"]);
    expect(ewsStatusLine(state)).toBe("DWR ประกาศเตือน 2 สถานี — ระดับเตรียมพร้อม");
    expect(ewsStatusLineEn(state)).toContain("tier prepare");
  });

  it("a last-good snapshot is labelled as such, not as live", () => {
    const state = ewsAlertState([station({ id: "a" })]);
    expect(ewsStatusLine(state, { fromSnapshot: true })).toContain("จากสแนปช็อตล่าสุด ไม่ใช่ข้อมูลสด");
    expect(ewsStatusLine(state)).not.toContain("สแนปช็อต");
  });
});

describe("each DWR station against DWR's own alert level", () => {
  it("the margin is the level the authority will raise, minus the level now", () => {
    const rows = ewsWaterRows([station({ id: "a", waterLevel: 2.94, alertMax: 4 })], NOW);
    expect(rows).toHaveLength(1);
    expect(rows[0].margin).toBeCloseTo(1.06);
    expect(rows[0].current).toBe(true);
  });

  it("a station at or over the level has a negative margin — it is at alert level", () => {
    const rows = ewsWaterRows([station({ id: "a", waterLevel: 4.2, alertMax: 4 })], NOW);
    expect(rows[0].margin).toBeLessThan(0);
  });

  it("a station with no configured threshold is not compared to one", () => {
    // The upstream sends alert_max = 0 for "no threshold set". Treating 0 as a
    // level would call every such station "at alert level".
    const rows = ewsWaterRows([station({ id: "a", waterLevel: 1.84, alertMax: null })], NOW);
    expect(rows).toHaveLength(0);
  });

  it("rain stations are not water stations, even when they carry a level", () => {
    const rows = ewsWaterRows([station({ id: "a", type: "rain", waterLevel: 3.01 })], NOW);
    expect(rows).toHaveLength(0);
  });

  it("current stations lead, so a 25-day-old reading cannot top the table", () => {
    const rows = ewsWaterRows([
      station({ id: "old", waterLevel: 3.7, alertMax: 4, observedAt: minutesAgo(60 * 24 * 25), stale: true }),
      station({ id: "fresh", waterLevel: 2.94, alertMax: 4, observedAt: minutesAgo(42) }),
    ], NOW);
    expect(rows.map(r => r.station.id)).toEqual(["fresh", "old"]);
    expect(rows[0].current).toBe(true);
    expect(rows[1].current).toBe(false);
    expect(rows[1].ageMinutes).toBeGreaterThanOrEqual(60 * 24 * 25);
  });

  it("an old station is kept in the table — a silent station is a gap, not calm", () => {
    const rows = ewsWaterRows([
      station({ id: "old", observedAt: minutesAgo(60 * 24 * 25), stale: true }),
    ], NOW);
    expect(rows).toHaveLength(1);
  });

  it("a station whose observation is older than the current window is not current", () => {
    const rows = ewsWaterRows([station({ id: "a", observedAt: minutesAgo(200) })], NOW);
    expect(rows[0].current).toBe(false);
  });

  it("the closest station to the authority's threshold leads", () => {
    const rows = ewsWaterRows([
      station({ id: "far", waterLevel: 0.3, alertMax: 4 }),
      station({ id: "close", waterLevel: 3.7, alertMax: 4 }),
    ], NOW);
    expect(rows.map(r => r.station.id)).toEqual(["close", "far"]);
  });
});

describe("soil moisture is the measured value, not a proxy", () => {
  it("counts the stations that report it and the ones at the primed line", () => {
    const state = ewsSoilState([
      station({ id: "a", type: "rain", soilMoisture: 100 }),
      station({ id: "b", type: "rain", soilMoisture: 86 }),
      station({ id: "c", type: "rain", soilMoisture: 40 }),
      station({ id: "d", type: "rain", soilMoisture: null }),
    ]);
    expect(state.measured).toBe(3);
    expect(state.primed).toBe(2);
    expect(state.wettest[0].id).toBe("a");
  });

  it("the primed line is the one the map lens already uses", () => {
    expect(SOIL_PRIMED).toBe(85);
  });
});

it("expired/future official tiers and soil reports cannot remain current",()=>{
 const old=station({id:"old",status:3,soilMoisture:99,observedAt:minutesAgo(121)});
 const future=station({id:"future",status:3,soilMoisture:99,observedAt:minutesAgo(-6)});
 expect(ewsAlertState([old,future],NOW).checked).toBe(0);
 expect(ewsSoilState([old,future],3,NOW).measured).toBe(0);
});
