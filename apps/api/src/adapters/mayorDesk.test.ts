import { describe, it, expect, vi } from "vitest";
import {
  buildDeskAnswer,
  deskHeadline,
  forecastPart,
  hasThai,
  officialPart,
  rainPart,
  rankDeskNews,
  riverLevel,
  riverPart,
  translateOne,
} from "./mayorDesk";
import type { DeskPart, IntelligenceItem } from "@nst/shared";

/**
 * The mayor's desk. The rules that decide what a duty officer is told:
 * the worst signal names the answer, every part keeps its own provenance,
 * and a part that could not be read is a line that says so — never a calm
 * line and never a dropped one.
 */
const NOW = Date.parse("2026-10-24T00:00:00Z");
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();

const part = (over: Partial<DeskPart> = {}): DeskPart => ({
  key: "p", level: "good", kind: "measured", titleTh: "ทดสอบ", titleEn: "Test",
  th: "เรียบร้อย", en: "all clear", evidence: [], sourceTh: "ทดสอบ", sourceEn: "test",
  observedAt: minutesAgo(10), staleAfterMs: 7200_000, ...over,
});

/** One DWR station, as the upstream sends it. */
const ews = (over: Record<string, unknown> = {}) => ({
  id: "STN0503", name: "บ้านนางเอื้อย", amphoe: "สิชล", type: "water", status: 0,
  waterLevel: 2.94, alertMax: 4, observedAt: minutesAgo(42), stale: false, ...over,
});

describe("the river part", () => {
  const gauge = (over: Record<string, unknown> = {}) => ({
    id: "g1", name: "ปากนคร", stationCode: "PTTEP3", diffFromBank: -1.5,
    trend: "stable", observedAt: minutesAgo(10), ...over,
  });

  it("a gauge over the bank is critical, inside 30 cm is an alert", () => {
    expect(riverLevel(0)).toBe("critical");
    expect(riverLevel(-0.2)).toBe("critical");
    expect(riverLevel(0.2)).toBe("alert");
    expect(riverLevel(0.5)).toBe("watch");
    expect(riverLevel(1.5)).toBe("good");
    expect(riverLevel(null)).toBe("unknown");
  });

  it("no gauge data is not evidence that the rivers are normal", () => {
    const p = riverPart([], NOW);
    expect(p.level).toBe("unknown");
    expect(p.th).toContain("ไม่ใช่หลักฐานว่าแม่น้ำปกติ");
  });

  it("no reading within 2 h says the current condition is unknown", () => {
    const p = riverPart([gauge({ observedAt: minutesAgo(200) })], NOW);
    expect(p.level).toBe("unknown");
    expect(p.th).toContain("สภาพน้ำปัจจุบันยังไม่ทราบ");
  });

  it("the closest gauge to the bank leads, with its distance and trend", () => {
    const p = riverPart([
      gauge({ id: "far", diffFromBank: -3 }),
      gauge({ id: "close", diffFromBank: -0.1, trend: "rising" }),
    ], NOW);
    expect(p.level).toBe("alert");
    expect(p.th).toContain("ปากนคร");
    expect(p.th).toContain("เหลือถึงตลิ่ง 0.10 ม.");
    expect(p.th).toContain("กำลังขึ้น");
  });

  it("a gauge with no bank datum is counted as ungraded, not as safe", () => {
    const p = riverPart([gauge({ diffFromBank: null })], NOW);
    expect(p.level).toBe("unknown");
    expect(p.coverageIncomplete).toBe(true);
    expect(p.th).toContain("ประเมินไม่ได้");
  });
});

describe("the official part", () => {
  it("an unreadable source is NOT the same sentence as no alert", () => {
    const p = officialPart([], NOW);
    expect(p.level).toBe("unknown");
    expect(p.th).toContain("ยังยืนยันสถานะเตือน อต. ไม่ได้");
    expect(p.th).toContain("ไม่ใช่การไม่มีประกาศ");
  });

  it("an alert in force names the tier and the station", () => {
    const p = officialPart([ews({ status: 2, name: "บ้านหัวโคก" })], NOW);
    expect(p.level).toBe("alert");
    expect(p.th).toContain("อต. ประกาศเตือน 1 สถานี");
    expect(p.th).toContain("ระดับเตรียมพร้อม");
    expect(p.th).toContain("บ้านหัวโคก");
  });

  it("a critical alert is critical", () => {
    expect(officialPart([ews({ status: 3 })], NOW).level).toBe("critical");
    expect(officialPart([ews({ status: 1 })], NOW).level).toBe("watch");
  });

  it("nothing declared says so, and says how close the water is to DWR's own level", () => {
    const p = officialPart([ews()], NOW);
    expect(p.level).toBe("good");
    expect(p.th).toContain("ไม่มีประกาศเตือนจาก อต.");
    expect(p.th).toContain("เหลือ 1.06 ม.");
  });

  it("a station at DWR's own alert level is an alert even with no alert declared", () => {
    const p = officialPart([ews({ waterLevel: 4.2, alertMax: 4 })], NOW);
    expect(p.level).toBe("alert");
    // The fact that earns the chip comes first; the absence of a
    // declaration is the qualifier after it. Printing "no DWR alert"
    // first, under a heading that says "DWR warning", is a contradiction
    // on the page's most prominent line.
    expect(p.th.indexOf("ถึง/เกินเกณฑ์")).toBeGreaterThanOrEqual(0);
    expect(p.th.indexOf("ถึง/เกินเกณฑ์")).toBeLessThan(p.th.indexOf("ยังไม่มีประกาศเตือน"));
  });

  it("the official heading never contradicts its own sentence", () => {
    const declared = officialPart([ews({ status: 2 })], NOW);
    const notDeclared = officialPart([ews({ waterLevel: 4.2, alertMax: 4 })], NOW);
    // "DWR warning" as a heading in front of "no DWR warning" reads as a
    // contradiction; the heading has to be true in both branches.
    expect(declared.titleTh).toBe(notDeclared.titleTh);
    expect(notDeclared.titleTh).not.toContain("ประกาศเตือน");
  });

  it("a stale station does not lead the comparison", () => {
    const p = officialPart([
      ews({ id: "old", name: "บ้านบางตะเภา", waterLevel: 3.7, alertMax: 4, observedAt: minutesAgo(60 * 24 * 25), stale: true }),
      ews({ id: "fresh", name: "บ้านนางเอื้อย" }),
    ], NOW);
    expect(p.th).toContain("บ้านนางเอื้อย");
    expect(p.th).not.toContain("บ้านบางตะเภา");
  });

  it("a stale station never leads the evidence list", () => {
    // The stale station is closer to DWR's own threshold, so sorting by
    // margin alone puts it first. The reader's first line of evidence has
    // to be a reading from today; the silent one follows, marked.
    const p = officialPart([
      ews({ id: "old", name: "บ้านบางตะเภา", waterLevel: 3.9, alertMax: 4, observedAt: minutesAgo(60 * 24 * 25), stale: true }),
      ews({ id: "fresh", name: "บ้านนางเอื้อย" }),
    ], NOW);
    expect(p.evidence[0]).toContain("บ้านนางเอื้อย");
    expect(p.evidence[0]).not.toContain("ล้าสมัย");
    const staleLine = p.evidence.find(e => e.includes("บ้านบางตะเภา"));
    expect(staleLine).toBeDefined();
    expect(staleLine).toContain("ล้าสมัย");
    expect(p.evidence.indexOf(staleLine!)).toBeGreaterThan(0);
  });
});

describe("the rain part", () => {
  it("no rain data is not evidence that rain has stopped", () => {
    const p = rainPart([], NOW);
    expect(p.level).toBe("unknown");
    expect(p.th).toContain("ไม่ใช่หลักฐานว่าฝนไม่ตก");
  });

  it("TMD's own bands: 35 mm is heavy, 90 mm is very heavy", () => {
    const heavy = rainPart([{ id: "r1", name: "ลานสกา", amphoe: "ลานสกา", rain24h: 40, observedAt: minutesAgo(30) }], NOW);
    expect(heavy.level).toBe("watch");
    const very = rainPart([{ id: "r1", name: "ลานสกา", amphoe: "ลานสกา", rain24h: 120, observedAt: minutesAgo(30) }], NOW);
    expect(very.level).toBe("alert");
  });

  it("the wettest station is named with its amount", () => {
    const p = rainPart([
      { id: "a", name: "ท่าศาลา", amphoe: "ท่าศาลา", rain24h: 10, observedAt: minutesAgo(30) },
      { id: "b", name: "ลานสกา", amphoe: "ลานสกา", rain24h: 88, observedAt: minutesAgo(30) },
    ], NOW);
    expect(p.th).toContain("ลานสกา");
    expect(p.th).toContain("88.0 มม.");
  });
});

describe("the forecast part", () => {
  const point = { key: "ridge", nameTh: "เขาหลวง", rain24hMm: 120, peakAt: null };

  it("a stale model says so rather than serving yesterday's numbers", () => {
    const p = forecastPart([point], minutesAgo(7 * 60), NOW);
    expect(p.level).toBe("unknown");
    expect(p.th).toContain("ล้าหลัง");
  });

  it("a model is labelled as a model, not as a measurement", () => {
    const p = forecastPart([point], minutesAgo(20), NOW);
    expect(p.kind).toBe("model");
    expect(p.th).toContain("แบบจำลอง");
    expect(p.th).toContain("120 มม.");
  });
});

describe("the answer", () => {
  it("names the worst signal", () => {
    const answer = buildDeskAnswer([
      part({ key: "a", level: "watch", titleTh: "ฝน" }),
      part({ key: "b", level: "critical", titleTh: "ระดับน้ำ" }),
    ]);
    expect(answer.level).toBe("critical");
    expect(answer.th).toContain("ระดับน้ำ");
    expect(answer.th).toContain("และอีก 1 สัญญาณ");
  });

  it("never prints a heading that its own sentence contradicts", () => {
    // The answer prints the worst part's heading in front of its sentence.
    // "DWR warning: no DWR warning from DWR" is a contradiction on the
    // most prominent line of the page, so the heading has to be one that
    // is true whether or not the authority declared anything.
    const answer = buildDeskAnswer([officialPart([ews({ waterLevel: 4.2, alertMax: 4 })], NOW)]);
    expect(answer.th).not.toContain("ประกาศเตือน อต.:");
    expect(answer.th).toContain("สถานะเตือน อต.:");
    expect(answer.th).not.toMatch(/ประกาศเตือน อต\.:\s*ไม่มีประกาศเตือน/);
  });

  it("no signal plus a missing source is an incomplete answer, never an all-clear", () => {
    const answer = buildDeskAnswer([part({ level: "good" }), part({ key: "b", level: "unknown" })]);
    expect(answer.level).toBe("unknown");
    expect(answer.th).toContain("ยังตอบไม่ครบ");
    expect(answer.th).not.toContain("ไม่พบสัญญาณน้ำท่วมจากทุกแหล่ง");
  });

  it("nothing signalling and nothing missing still refuses to certify safety", () => {
    const answer = buildDeskAnswer([part({ level: "good" })]);
    expect(answer.level).toBe("good");
    expect(answer.th).toContain("ไม่ใช่การรับประกันความปลอดภัย");
  });

  it("incomplete coverage counts as missing, even when the level is fine", () => {
    const answer = buildDeskAnswer([part({ level: "good", coverageIncomplete: true })]);
    expect(answer.missing).toBe(1);
    expect(answer.level).toBe("unknown");
  });
});

describe("the news is most important first", () => {
  const story = (over: Partial<IntelligenceItem> & { id: string }): IntelligenceItem => ({
    title: "ข่าวทดสอบ", summary: "", source: "ทดสอบ", sourceUrl: "https://example.test",
    publishedAt: minutesAgo(30), tags: [], score: 50, kind: "news", imageUrl: undefined,
    lat: null, lng: null, placeName: null, ...over,
  });

  it("the source name is dropped from the headline — it is shown on its own line", () => {
    expect(deskHeadline("ฝนหนักที่ปากพนัง - www.topnews.co.th", "www.topnews.co.th")).toBe("ฝนหนักที่ปากพนัง");
    // A title that merely ends in a dash is left alone.
    expect(deskHeadline("น้ำท่วม - ปากพนัง", "www.topnews.co.th")).toBe("น้ำท่วม - ปากพนัง");
  });

  it("this morning beats an older story with a higher feed score", () => {
    const ranked = rankDeskNews([
      story({ id: "old", title: "Nakhon Si Thammarat wins an award", publishedAt: minutesAgo(60 * 20), score: 95, tags: ["HO"] }),
      story({ id: "new", title: "ฝนตกหนักที่ปากพนัง", publishedAt: minutesAgo(60), score: 50, tags: ["FL"] }),
    ], NOW);
    expect(ranked[0].item.id).toBe("new");
  });

  it("a flood story in a named place outranks a national story", () => {
    const ranked = rankDeskNews([
      story({ id: "national", title: "Some national story about a prize ceremony", publishedAt: minutesAgo(60), score: 90, tags: ["HO"] }),
      story({ id: "local", title: "น้ำท่วมที่ตลาดกลาง", publishedAt: minutesAgo(120), tags: ["FL"], placeName: "Talat Klang" }),
    ], NOW);
    expect(ranked[0].item.id).toBe("local");
    expect(ranked[0].whyTh).toBe("เรื่องน้ำท่วม");
  });

  it("a story older than a day and a half is not in the morning espresso", () => {
    const ranked = rankDeskNews([story({ id: "stale", publishedAt: minutesAgo(60 * 50) })], NOW);
    expect(ranked).toHaveLength(0);
  });

  it("a non-Thai headline is marked as such, so it can be translated", () => {
    const ranked = rankDeskNews([story({ id: "en", title: "Heavy rain floods Nakhon Si Thammarat" })], NOW);
    expect(ranked[0].language).toBe("en");
  });
});

describe("the translation is key-free and it is checked", () => {
  it("reads the translated segments out of the endpoint's shape", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([[["น้ำท่วมต่อเนื่อง 16 จังหวัด", "Floods persist", null, null, 3]]]), { status: 200 }),
    );
    await expect(translateOne("Floods persist in 16 provinces")).resolves.toBe("น้ำท่วมต่อเนื่อง 16 จังหวัด");
    vi.restoreAllMocks();
  });

  it("a reply with no Thai in it is a failure, not a translation", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([[["Floods persist in 16 provinces", "Floods persist", null, null, 3]]]), { status: 200 }),
    );
    await expect(translateOne("Floods persist in 16 provinces")).resolves.toBeNull();
    vi.restoreAllMocks();
  });

  it("a reply that is not the expected shape yields nothing, and nothing breaks", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "nope" }), { status: 200 }),
    );
    await expect(translateOne("Floods persist in 16 provinces")).resolves.toBeNull();
    vi.restoreAllMocks();
  });

  it("a failed request is a failure, not a broken headline", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("rate limited", { status: 429 }));
    await expect(translateOne("Floods persist in 16 provinces")).resolves.toBeNull();
    vi.restoreAllMocks();
  });

  it("a translation that grew into a paragraph is refused — the desk wants a headline", async () => {
    const long = "น้ำท่วม".repeat(60);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([[[long, "x", null, null, 3]]]), { status: 200 }),
    );
    await expect(translateOne("Floods persist in 16 provinces")).resolves.toBeNull();
    vi.restoreAllMocks();
  });

  it("the Thai check itself", () => {
    expect(hasThai("Floods persist in 16 provinces")).toBe(false);
    expect(hasThai("น้ำท่วมต่อเนื่อง 16 จังหวัด")).toBe(true);
  });
});
