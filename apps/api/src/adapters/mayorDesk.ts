/**
 * The mayor's desk — one screen, most important first.
 *
 * The desk answers "what is the situation, and what does he need to know
 * today". It is not the flood briefing (/flood-ops), which is the full
 * evidence: tables, camera comparison and the copy-paste record for the
 * file. The desk is the espresso — the answer first, then the parts that
 * make it, then the day's news in plain Thai.
 *
 * The rules come from the Chiang Mai operations war room
 * (cnx.nonarkara.org), which owns the same cockpit doctrine:
 *
 *   • The answer names the worst signal. If there is no signal and any part
 *     is missing, the answer says it is incomplete — it never says "all
 *     clear" by omission.
 *   • Every part keeps its own provenance and age. Nothing is merged into
 *     one "flood" number, because a river gauge and a forecast model do not
 *     answer the same question.
 *   • A part that failed to load, or answered "unavailable", is a line that
 *     says so, with its reason. It is never dropped and never painted calm.
 *   • "Below threshold" is never green. A green chip reads as an all-clear,
 *     and nothing on a flood desk can certify one.
 *
 * The one thing this desk does that the briefing does not: it translates.
 * A story filed in English reaches the mayor as a plain-Thai headline, with
 * the original kept underneath so the reader can check it. A translation
 * that fails leaves the original headline in place and says so — a missing
 * translation is never a missing story.
 */

import {
  detectNewsLanguage,
  isNstNewsText,
  type DeskLevel,
  type DeskNewsItem,
  type DeskNewsLanguage,
  type DeskPart,
  type IntelligenceItem,
  type MayorDesk,
  type NormalizedFeed,
} from "@nst/shared";
import { cachedWithStale } from "../lib/cache.js";
import { fetchFloodOperations } from "./floodOperations.js";
import { fetchEwsStations } from "./dwrEws.js";
import { fetchNews } from "./news.js";

const HOUR = 3_600_000;
/** The product's own current-observation line (OPERATIONAL_OBSERVATION_MAX_MIN). */
const CURRENT_MS = 120 * 60_000;

// ─── The parts ───────────────────────────────────────────────────────────

const RIVER: Omit<DeskPart, "level" | "th" | "en" | "evidence" | "observedAt" | "coverageIncomplete"> = {
  key: "river",
  kind: "measured",
  titleTh: "ระดับน้ำที่สถานีวัด",
  titleEn: "River levels at gauges",
  sourceTh: "HII ThaiWater ผ่าน FloodDash",
  sourceEn: "HII ThaiWater via FloodDash",
  staleAfterMs: 2 * HOUR,
};

const OFFICIAL: Omit<DeskPart, "level" | "th" | "en" | "evidence" | "observedAt" | "coverageIncomplete"> = {
  key: "official",
  kind: "official",
  // "DWR alert status", not "DWR warning". The heading is printed in front of
  // this part's own sentence on the desk's first line, and when the
  // authority has declared nothing that sentence says so — "DWR warning: no
  // DWR warning" is a contradiction on the most prominent line of the
  // page, and it was the title, not the sentence, that was wrong.
  titleTh: "สถานะเตือน อต.",
  titleEn: "DWR alert status",
  sourceTh: "กรมทรัพย์ทรัพย์ธรรมชาติ — ระบบเตือนภัยชุมชน",
  sourceEn: "Department of Water Resources — community early warning",
  staleAfterMs: 2 * HOUR,
};

const RAIN: Omit<DeskPart, "level" | "th" | "en" | "evidence" | "observedAt" | "coverageIncomplete"> = {
  key: "rain",
  kind: "measured",
  titleTh: "ฝนที่วัดได้ 24 ชม.",
  titleEn: "Measured rain, 24 h",
  sourceTh: "HII ThaiWater ผ่าน FloodDash",
  sourceEn: "HII ThaiWater via FloodDash",
  staleAfterMs: 2 * HOUR,
};

const FORECAST: Omit<DeskPart, "level" | "th" | "en" | "evidence" | "observedAt" | "coverageIncomplete"> = {
  key: "forecast",
  kind: "model",
  titleTh: "พยากรณ์ฝน 24 ชม.",
  titleEn: "Rain forecast, 24 h",
  sourceTh: "Open-Meteo (แบบจำลอง)",
  sourceEn: "Open-Meteo (model)",
  staleAfterMs: 6 * HOUR,
};

/** TMD's own rain bands: 35 mm in 24 h is "heavy", 90 mm is "very heavy". */
const RAIN_HEAVY = 35;
const RAIN_VERY_HEAVY = 90;

/** Fixed decimals: a distance to the bank reads "0.10 m", not "0.1 m". */
const fmt = (n: number, digits = 1): string => n.toFixed(digits);

function unavailable(
  meta: Omit<DeskPart, "level" | "th" | "en" | "evidence" | "observedAt" | "coverageIncomplete">,
  th: string,
  en: string,
): DeskPart {
  return { ...meta, level: "unknown", th, en, evidence: [], observedAt: null };
}

/** Metres of rise still available before the bank, from the HII bank datum. */
export function freeboardM(gauge: { diffFromBank: number | null }): number | null {
  return gauge.diffFromBank != null ? -gauge.diffFromBank : null;
}

/**
 * How close a gauge is to the bank, in the product's own review bands:
 * at or over the bank is critical, inside 30 cm is the near-bank review
 * line, and 60 cm is the early watch.
 */
export function riverLevel(freeboard: number | null): DeskLevel {
  if (freeboard == null) return "unknown";
  if (freeboard <= 0) return "critical";
  if (freeboard <= 0.3) return "alert";
  if (freeboard <= 0.6) return "watch";
  return "good";
}

export function riverPart(
  gauges: Array<{ id: string; name: string; stationCode?: string | null; diffFromBank: number | null; trend: string; observedAt: string }>,
  now: number,
): DeskPart {
  if (!gauges.length) {
    return unavailable(RIVER, "ไม่มีข้อมูลสถานีระดับน้ำ — ไม่ใช่หลักฐานว่าแม่น้ำปกติ", "No river-gauge data — not evidence that the rivers are normal.");
  }
  const current = gauges.filter(g => {
    const t = Date.parse(g.observedAt);
    return Number.isFinite(t) && t <= now + 5 * 60_000 && now - t <= CURRENT_MS;
  });
  if (!current.length) {
    return unavailable(RIVER, "ไม่มีค่าระดับน้ำภายใน 2 ชม. — สภาพน้ำปัจจุบันยังไม่ทราบ", "No gauge reading within 2 h — current river conditions are unknown.");
  }
  const graded = current
    .map(g => ({ g, freeboard: freeboardM(g) }))
    .filter(x => x.freeboard != null)
    .sort((a, b) => (a.freeboard as number) - (b.freeboard as number));
  const ungraded = current.length - graded.length;
  const coverage = `${graded.length}/${current.length} สถานีปัจจุบันมีเกณฑ์ระยะถึงตลิ่ง`;
  const coverageEn = `${graded.length}/${current.length} current gauges carry a bank datum`;
  const ungradedNote = ungraded ? ` · อีก ${ungraded} สถานีไม่มีเกณฑ์ จึงประเมินไม่ได้` : "";
  const ungradedNoteEn = ungraded ? ` · ${ungraded} gauge(s) have no bank datum and cannot be graded` : "";
  if (!graded.length) {
    return { ...RIVER, level: "unknown", coverageIncomplete: true, th: `${coverage}${ungradedNote} — ประเมินไม่ได้`, en: `${coverageEn}${ungradedNoteEn} — cannot be graded.`, evidence: [], observedAt: current[0].observedAt };
  }
  const top = graded[0];
  const near = graded.filter(x => x.freeboard! <= 0.3);
  const name = `${top.g.name}${top.g.stationCode ? ` (${top.g.stationCode})` : ""}`;
  const level = riverLevel(top.freeboard);
  const trend = top.g.trend === "rising" ? "กำลังขึ้น" : top.g.trend === "falling" ? "กำลังลด" : "ทรงตัว";
  const distance = top.freeboard! <= 0
    ? `เหนือ/ถึงตลิ่ง ${fmt(-top.freeboard!, 2)} ม.`
    : `เหลือถึงตลิ่ง ${fmt(top.freeboard!, 2)} ม.`;
  // The wording has to agree with the chip. A part chipped "watch" while its
  // line says "nothing near the bank" is the reader being told two things
  // that cannot both be true.
  const lead = near.length
    ? `${near.length} สถานีถึง/ใกล้ตลิ่ง — ${name} ${distance}`
    : level === "watch"
      ? `ยังไม่ถึงเกณฑ์ 30 ซม. แต่ใกล้ที่สุด ${name} ${distance} — เฝ้าระวัง`
      : `ไม่มีสถานีใกล้ตลิ่ง · ใกล้ที่สุด ${name} ${distance}`;
  return {
    ...RIVER,
    level,
    coverageIncomplete: ungraded > 0,
    th: `${lead} · ${trend} · ${coverage}${ungradedNote}`,
    evidence: graded.slice(0, 3).map(x =>
      `${x.g.name}${x.g.stationCode ? ` (${x.g.stationCode})` : ""} — ${x.freeboard! <= 0 ? `เหนือ/ถึงตลิ่ง ${fmt(-x.freeboard!, 2)} ม.` : `เหลือถึงตลิ่ง ${fmt(x.freeboard!, 2)} ม.`} · ${x.g.trend === "rising" ? "กำลังขึ้น" : x.g.trend === "falling" ? "กำลังลด" : "ทรงตัว"}`),
    en: `${near.length ? `${near.length} gauge(s) at/near the bank — ` : level === "watch" ? "Inside 30 cm of the bank is not reached, but closest " : "No gauge near the bank · closest "}${name} ${top.freeboard! <= 0 ? `${fmt(-top.freeboard!, 2)} m above bank` : `${fmt(top.freeboard!, 2)} m below bank`} · ${coverageEn}${ungradedNoteEn}`,
    observedAt: top.g.observedAt,
  };
}

/**
 * The official layer: the authority's own alert tier, and the water's
 * distance from the authority's own per-station alert level.
 */
export function officialPart(
  stations: Array<{ id: string; name: string; amphoe: string; type: string; status: number; waterLevel: number | null; alertMax: number | null; observedAt: string; stale: boolean }>,
  now: number,
): DeskPart {
  if (!stations.length) {
    return unavailable(OFFICIAL, "ยังยืนยันสถานะเตือน อต. ไม่ได้ — แหล่งข้อมูลไม่ตอบ (ไม่ใช่การไม่มีประกาศ)", "DWR warning state cannot be confirmed — the source did not answer (this is not the same as no warning being in force).");
  }
  const alerting = stations.filter(s => s.status >= 1);
  if (alerting.length) {
    const top = alerting[0];
    const tier = top.status === 3 ? "วิกฤติ" : top.status === 2 ? "เตรียมพร้อม" : "เฝ้าระวัง";
    const level: DeskLevel = top.status === 3 ? "critical" : top.status === 2 ? "alert" : "watch";
    return {
      ...OFFICIAL,
      level,
      th: `อต. ประกาศเตือน ${alerting.length} สถานี — ระดับ${tier} · ${top.name} (${top.amphoe})`,
      evidence: alerting.slice(0, 3).map(a => `${a.name} (${a.amphoe}) — ระดับ${a.status === 3 ? "วิกฤติ" : a.status === 2 ? "เตรียมพร้อม" : "เฝ้าระวัง"}`),
      en: `DWR has declared an alert on ${alerting.length} station(s) — tier ${tier} · ${top.name} (${top.amphoe})`,
      observedAt: top.observedAt,
    };
  }
  // No alert in force. The next useful question is how close the water is
  // to the level at which DWR would raise one.
  const rows = stations
    .filter(s => s.type === "water" && s.alertMax != null && s.waterLevel != null)
    .map(s => ({ s, margin: (s.alertMax as number) - (s.waterLevel as number) }))
    .sort((a, b) => a.margin - b.margin);
  const fresh = rows.filter(r => {
    const t = Date.parse(r.s.observedAt);
    return !r.s.stale && Number.isFinite(t) && t <= now + 5 * 60_000 && now - t <= CURRENT_MS;
  });
  const closest = (fresh[0] ?? rows[0])?.s;
  const margin = closest && closest.alertMax != null && closest.waterLevel != null
    ? (closest.alertMax as number) - (closest.waterLevel as number)
    : null;
  const level: DeskLevel = margin == null ? "unknown" : margin <= 0 ? "alert" : margin <= 0.5 ? "watch" : "good";
  const measured = fresh.length;
  const total = rows.length;
  const coverage = total ? ` · ${measured}/${total} สถานีที่มีเกณฑ์รายงานภายใน 2 ชม.` : "";
  // The evidence list leads with the stations whose reading is current. A
  // station 27 days silent can be the closest to the threshold and must
  // still not come first: the reader's first line of evidence has to be a
  // reading from today. The silent ones follow, marked.
  const silent = rows.filter(r => !fresh.includes(r));
  const evidence = [...fresh, ...silent].slice(0, 6);
  // The sentence leads with the fact that earns the chip. When the water is
  // at or over DWR's own alert level, that is the worst fact on the page
  // and it comes first; the fact that DWR has declared nothing comes
  // after it, as a qualifier — never before it, which read as a
  // contradiction.
  const line = closest && margin != null
    ? margin <= 0
      ? `น้ำถึง/เกินเกณฑ์เตือนของ อต. ที่ ${closest.name} (${closest.amphoe}) — ยังไม่มีประกาศเตือนจาก อต.${coverage}`
      : `ใกล้เกณฑ์เตือนของ อต. ที่สุด ${closest.name} (${closest.amphoe}) เหลือ ${fmt(margin, 2)} ม. — ไม่มีประกาศเตือนจาก อต.${coverage}`
    : `ไม่มีประกาศเตือนจาก อต. · ไม่มีสถานีที่มีเกณฑ์ของ อต. ให้เทียบ${coverage}`;
  return {
    ...OFFICIAL,
    level,
    coverageIncomplete: measured < total,
    th: line,
    // Six stations, not three: the compartment has the room, and the
    // stations closest to DWR's own threshold are the evidence the mayor
    // needs. Three left a measured hole in the middle of the bento.
    evidence: evidence.map(r =>
      `${r.s.name} (${r.s.amphoe}) — ${r.margin <= 0 ? `ถึง/เกินเกณฑ์ ${fmt(Math.abs(r.margin), 2)} ม.` : `เหลือ ${fmt(r.margin, 2)} ม.`}${r.s.stale ? " · ล้าสมัย" : ""}`),
    en: closest && margin != null
      ? margin <= 0
        ? `Water is at or over DWR's own alert level at ${closest.name} (${closest.amphoe}) — no DWR alert has been declared${coverage}`
        : `Closest to DWR's own alert level: ${closest.name} (${closest.amphoe}), ${fmt(margin, 2)} m to go — no DWR alert in force${coverage}`
      : `No DWR alert in force · no station publishes a DWR alert level to compare against${coverage}`,
    observedAt: closest?.observedAt ?? null,
  };
}

export function rainPart(
  stations: Array<{ id: string; name: string; amphoe: string; rain24h: number | null; observedAt: string }>,
  now: number,
): DeskPart {
  if (!stations.length) {
    return unavailable(RAIN, "ไม่มีข้อมูลฝนที่วัดได้ — ไม่ใช่หลักฐานว่าฝนไม่ตก", "No measured rain — not evidence that rain has stopped.");
  }
  const current = stations.filter(s => {
    const t = Date.parse(s.observedAt);
    return Number.isFinite(t) && t <= now + 5 * 60_000 && now - t <= CURRENT_MS;
  });
  if (!current.length) {
    return unavailable(RAIN, "ไม่มีค่าฝนภายใน 2 ชม. — ฝนตกอยู่หรือไม่ยังไม่ทราบ", "No rain reading within 2 h — whether it is raining is unknown.");
  }
  const withRain = current.filter(s => s.rain24h != null && s.rain24h >= 0);
  if (!withRain.length) {
    return unavailable(RAIN, "สถานีฝนรายงานแต่ไม่มีค่าสะสม 24 ชม. — ปริมาณฝนยังไม่ทราบ", "Rain stations reported but no 24 h total — the amount is unknown.");
  }
  const wettest = [...withRain].sort((a, b) => (b.rain24h as number) - (a.rain24h as number))[0];
  const veryHeavy = withRain.filter(s => (s.rain24h as number) >= RAIN_VERY_HEAVY).length;
  const heavy = withRain.filter(s => (s.rain24h as number) >= RAIN_HEAVY).length;
  const level: DeskLevel = veryHeavy ? "alert" : heavy ? "watch" : "good";
  return {
    ...RAIN,
    level,
    evidence: [...withRain].sort((a, b) => (b.rain24h as number) - (a.rain24h as number)).slice(0, 3)
      .map(r => `${r.name} (${r.amphoe}) — ${fmt(r.rain24h as number)} มม./24 ชม.`),
    th: `มากสุด ${fmt(wettest.rain24h as number)} มม./24 ชม. ที่ ${wettest.name} (${wettest.amphoe}) · ฝนหนัก ${heavy} สถานี${veryHeavy ? ` (หนักมาก ${veryHeavy})` : ""} · ${withRain.length}/${current.length} สถานีรายงาน`,
    en: `Wettest ${fmt(wettest.rain24h as number)} mm/24 h at ${wettest.name} (${wettest.amphoe}) · heavy rain at ${heavy} station(s)${veryHeavy ? ` (very heavy ${veryHeavy})` : ""} · ${withRain.length}/${current.length} reporting`,
    observedAt: wettest.observedAt,
  };
}

export function forecastPart(
  points: Array<{ key: string; nameTh: string; rain24hMm: number | null; peakAt: string | null }>,
  fetchedAt: string | null,
  now: number,
): DeskPart {
  if (!points.length || !fetchedAt) {
    return unavailable(FORECAST, "ยังไม่มีแบบจำลองพยากรณ์ฝน — ไม่ใช่การพยากรณ์ว่าฝนไม่ตก", "No rain forecast yet — not a dry forecast.");
  }
  const t = Date.parse(fetchedAt);
  if (!Number.isFinite(t) || t > now + 5 * 60_000 || now - t > 6 * HOUR) {
    return unavailable(FORECAST, "แบบจำลองพยากรณ์ล้าหลัง/ขาด — อย่าใช้ตัวเลขเดิมเป็นพยากรณ์ปัจจุบัน", "The forecast model is stale or missing — do not use the old numbers as a current forecast.");
  }
  const usable = points.filter(p => p.rain24hMm != null && p.rain24hMm >= 0);
  if (!usable.length) {
    return unavailable(FORECAST, "แบบจำลองไม่มีค่าฝน 24 ชม. ที่ใช้ได้", "The model has no usable 24 h rain values.");
  }
  const wettest = [...usable].sort((a, b) => (b.rain24hMm as number) - (a.rain24hMm as number))[0];
  const level: DeskLevel = (wettest.rain24hMm as number) >= RAIN_VERY_HEAVY ? "alert" : (wettest.rain24hMm as number) >= RAIN_HEAVY ? "watch" : "good";
  return {
    ...FORECAST,
    level,
    evidence: [...usable].sort((a, b) => (b.rain24hMm as number) - (a.rain24hMm as number)).slice(0, 3)
      .map(p => `${p.nameTh} — ${fmt(p.rain24hMm as number, 0)} มม./24 ชม.`),
    th: `คาดมากสุด ${fmt(wettest.rain24hMm as number, 0)} มม./24 ชม. ที่ ${wettest.nameTh} — แบบจำลอง ไม่ใช่ฝนที่วัดและไม่ใช่การพยากรณ์น้ำท่วมรายถนน`,
    en: `Forecast up to ${fmt(wettest.rain24hMm as number, 0)} mm/24 h at ${wettest.nameTh} — a model, not measured rain and not a street flood forecast`,
    observedAt: fetchedAt,
  };
}

// ─── The answer ──────────────────────────────────────────────────────────

export interface DeskAnswer {
  level: DeskLevel;
  th: string;
  en: string;
  missing: number;
}

export function buildDeskAnswer(parts: DeskPart[]): DeskAnswer {
  const missing = parts.filter(p => p.level === "unknown" || p.coverageIncomplete).length;
  const signals = parts.filter(p => p.level !== "unknown" && p.level !== "good")
    .sort((a, b) => levelRank(b.level) - levelRank(a.level));
  if (signals.length) {
    const top = signals[0];
    const others = signals.length - 1;
    return {
      level: top.level,
      th: `${top.titleTh}: ${top.th}${others ? ` · และอีก ${others} สัญญาณ` : ""}`,
      en: `${top.titleEn}: ${top.en}${others ? ` · and ${others} more signal${others > 1 ? "s" : ""}` : ""}`,
      missing,
    };
  }
  if (missing) {
    return {
      level: "unknown",
      th: `ยังตอบไม่ครบ — ${missing} แหล่งข้อมูลไม่พร้อมหรือครอบคลุมไม่เต็ม ส่วนที่มีไม่พบสัญญาณ ซึ่งไม่ใช่การยืนยันว่าปลอดภัย`,
      en: `Incomplete — ${missing} source(s) unavailable or incomplete. What did answer shows no signal, which is not confirmation of safety.`,
      missing,
    };
  }
  return {
    level: "good",
    th: "ไม่พบสัญญาณน้ำท่วมจากทุกแหล่งขณะนี้ — ไม่ใช่การรับประกันความปลอดภัย",
    en: "No flood signal from any source right now — not a guarantee of safety.",
    missing,
  };
}

const levelRank = (level: DeskLevel): number =>
  ({ good: 0, unknown: 1, watch: 2, alert: 3, critical: 4 })[level];

// ─── The news ────────────────────────────────────────────────────────────

/** How long a story stays relevant to "this morning". */
const NEWS_FRESH_MS = 36 * HOUR;

/** Operational tags first: a mayor's morning is not a festival list. */
const TAG_WEIGHT: Record<string, number> = {
  FL: 30, EM: 24, SEC: 18, IN: 12, PU: 8, PO: 6, FU: 0, HO: 0, FE: 0,
};

export interface RankedNews {
  item: IntelligenceItem;
  rank: number;
  language: DeskNewsLanguage;
  whyTh: string;
  whyEn: string;
  /** The headline without the trailing " - source" the feed appends. The
   *  source is shown on its own line; repeating it inside the headline
   *  wraps the line and says the same thing twice. */
  headline: string;
}

/** "Headline - source" → "Headline". The feed's own source name, dropped. */
export function deskHeadline(title: string, source: string): string {
  const suffix = ` - ${source}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length).trim() : title;
}

/**
 * Most important first, for a mayor reading at 7 a.m.
 *
 * Recency dominates: the espresso is of the day, and a three-day-old story
 * with a higher feed score does not belong ahead of this morning's. After
 * recency comes what the story is about — a flood or an incident beats a
 * national story about a ceremony.
 *
 * The feed's own score is used only as a small tie-breaker. It already mixes
 * trust with locality, and counting locality again on top of it let a
 * ceremony outrank a flood: a story that merely mentioned the province was
 * scoring twice for the same reason.
 */
export function rankDeskNews(items: IntelligenceItem[], now: number): RankedNews[] {
  const ranked = items.map(item => {
    const published = Date.parse(item.publishedAt);
    const ageMs = Number.isFinite(published) ? now - published : Number.POSITIVE_INFINITY;
    let rank = 0;
    if (ageMs <= 3 * HOUR) rank += 40;
    else if (ageMs <= 8 * HOUR) rank += 30;
    else if (ageMs <= 24 * HOUR) rank += 16;
    else if (ageMs <= 48 * HOUR) rank += 6;
    for (const tag of item.tags) rank += TAG_WEIGHT[tag] ?? 0;
    if (item.placeName) rank += 18;
    if (isNstNewsText(`${item.title} ${item.summary}`)) rank += 8;
    rank += Math.min(6, (item.score / 100) * 6);
    const language = detectNewsLanguage(item.title);
    const headline = deskHeadline(item.title, item.source);
    return { item, rank, language, headline, whyTh: whyTh(item, language), whyEn: whyEn(item) };
  });
  return ranked
    .filter(r => {
      const published = Date.parse(r.item.publishedAt);
      return Number.isFinite(published) && now - published <= NEWS_FRESH_MS;
    })
    .sort((a, b) => b.rank - a.rank || b.item.publishedAt.localeCompare(a.item.publishedAt));
}

function whyTh(item: IntelligenceItem, language: DeskNewsLanguage): string {
  if (item.tags.includes("FL")) return "เรื่องน้ำท่วม";
  if (item.tags.includes("EM")) return "เหตุฉุกเฉิน";
  if (item.tags.includes("SEC")) return "เรื่องความมั่นคง";
  if (item.tags.includes("IN")) return "เรื่องบริการประชาชน";
  if (item.placeName) return `พาด ${item.placeName}`;
  if (isNstNewsText(`${item.title} ${item.summary}`)) return "เรื่องจังหวัดนครศรีธรรมราช";
  if (language !== "th") return "ข่าวต่างประเทศ";
  return "ข่าวทั่วประเทศ";
}

function whyEn(item: IntelligenceItem): string {
  if (item.tags.includes("FL")) return "Flooding";
  if (item.tags.includes("EM")) return "Incident";
  if (item.tags.includes("SEC")) return "Security";
  if (item.tags.includes("IN")) return "Public services";
  if (item.placeName) return `In ${item.placeName}`;
  if (isNstNewsText(`${item.title} ${item.summary}`)) return "Nakhon Si Thammarat";
  return "National";
}

// ─── Translation ─────────────────────────────────────────────────────────

/**
 * The headlines, in plain Thai.
 *
 * The translator is the key-free public endpoint, not the model. Measured
 * on 2026-10-24: the owner's Gemini key is on the free tier's 20-requests-
 * a-day limit, shared across five products, and a desk that wanted a
 * translation call an hour would exhaust that quota by itself — so the desk
 * would show "not translated" for most of the day. The key-free endpoint
 * needs no key and has no quota, and on the live headlines it produced
 * exactly the plain-Thai headlines the desk needs:
 *
 *   "Floods persist in 16 provinces, two districts of Bangkok"
 *     → "น้ำท่วมต่อเนื่อง 16 จังหวัด 2 เขต กทม"
 *   "PM urges southern provinces to prepare for floodwaters in 3-4 days"
 *     → "นายกฯ วอนจังหวัดภาคใต้เตรียมรับน้ำท่วมใน 3-4 วัน"
 *
 * A failure here is not a failure of the desk: the original headline stays
 * and says it was not translated. A missing translation is never a missing
 * story.
 *
 * ── Why there is more than one provider now ─────────────────────────────
 * Measured on 2026-10-26: the **deployed Worker translated nothing** — 7 of
 * 8 headlines came back untranslated — while the *same code on this host*
 * translated every one of them in 0.1 s. The endpoint answers 200 to a
 * plain `curl` from this machine and to a request with no User-Agent at all,
 * so the code was never the problem: **Cloudflare's egress cannot reach that
 * endpoint.** A single provider that silently returned nothing turned the
 * owner's requirement — "headlines in other languages translated for him" —
 * into a page of English.
 *
 * So the desk now walks a **chain** of key-free providers and says which one
 * answered. A failure with no name is a failure nobody can act on.
 */
const TRANSLATE_ENDPOINT = "https://translate.googleapis.com/translate_a/single";
const MYMEMORY_ENDPOINT = "https://api.mymemory.translated.net/get";
const TRANSLATE_TIMEOUT_MS = 8_000;

/** One headline per request, cached by its text — a headline is translated
 *  once, not once per desk refresh. */
const translationCache = new Map<string, string>();
const TRANSLATION_CACHE_MAX = 500;

/** Why each provider last failed, per isolate. The reason has to be nameable:
 *  "the translation did not happen" is not something anyone can fix. */
const providerFailures = new Map<string, string>();

/**
 * A provider that failed hard is skipped for a while.
 *
 * The chain is walked for every headline, so one dead endpoint must not cost
 * every headline its timeout — with three providers and an 8 s budget each, a
 * single dead provider would push the desk past the request deadline. Only a
 * *hard* failure trips this (the endpoint answered with an error, or did not
 * answer at all). A reply that simply carried no Thai is a content problem,
 * not a dead provider, and must not take the provider out of the chain.
 */
const providerDownUntil = new Map<string, number>();
const PROVIDER_COOLDOWN_MS = 10 * 60_000;

function markProviderDown(provider: string, reason: string): void {
  providerFailures.set(provider, reason);
  providerDownUntil.set(provider, Date.now() + PROVIDER_COOLDOWN_MS);
}

function providerIsDown(provider: string): boolean {
  return (providerDownUntil.get(provider) ?? 0) > Date.now();
}

/**
 * Forget the per-isolate provider state: the breaker, the last failure
 * reasons and the translation cache.
 *
 * The state is per-isolate on purpose — it is what stops a dead endpoint
 * costing every headline its timeout — and that makes it shared between the
 * headlines of one desk build. A test (or a cold start) needs it gone.
 */
export function resetTranslateProviders(): void {
  providerDownUntil.clear();
  providerFailures.clear();
  translationCache.clear();
}

/** Does this look like Thai? A translation with no Thai in it is a failure,
 *  not a translation. */
export const hasThai = (s: string): boolean => /[฀-๿]/.test(s);

/** Decode the HTML entities a translation service may hand back. */
function decodeEntities(s: string): string {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

/** MyMemory needs an explicit source language; the desk only ever meets
 *  English, Chinese and Thai. Anything else is treated as English, which is
 *  what the detector says it is. */
function myMemoryPair(language: string): string {
  return language === "zh" ? "zh-CN|th" : "en|th";
}

async function translateViaGoogle(text: string, signal: AbortSignal): Promise<string | null> {
  const url = `${TRANSLATE_ENDPOINT}?client=gtx&sl=auto&tl=th&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    markProviderDown("google", `HTTP ${res.status}`);
    return null;
  }
  const json = (await res.json()) as unknown;
  const segments = Array.isArray(json) ? json[0] : null;
  if (!Array.isArray(segments)) {
    providerFailures.set("google", "unexpected response shape");
    return null;
  }
  const out = segments
    .map(seg => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : ""))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  if (!out || !hasThai(out)) {
    providerFailures.set("google", out ? "no Thai in the reply" : "empty reply");
    return null;
  }
  providerFailures.delete("google");
  return out;
}

async function translateViaMyMemory(text: string, language: string, signal: AbortSignal): Promise<string | null> {
  const url = `${MYMEMORY_ENDPOINT}?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(myMemoryPair(language))}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    markProviderDown("mymemory", `HTTP ${res.status}`);
    return null;
  }
  const json = (await res.json()) as { responseData?: { translatedText?: string }; responseStatus?: number; responseDetails?: string };
  const status = json.responseStatus;
  if (typeof status === "number" && status !== 200) {
    providerFailures.set("mymemory", json.responseDetails || `status ${status}`);
    return null;
  }
  const raw = json.responseData?.translatedText;
  if (!raw) {
    providerFailures.set("mymemory", "no translation in the reply");
    return null;
  }
  const out = decodeEntities(raw).replace(/\s+/g, " ").trim();
  if (!out || !hasThai(out)) {
    providerFailures.set("mymemory", out ? "no Thai in the reply" : "empty reply");
    return null;
  }
  providerFailures.delete("mymemory");
  return out;
}

/**
 * Cloudflare's own translation model — the first-party path.
 *
 * Measured on 2026-10-26: the deployed Worker could not reach the public
 * translate endpoint at all (HTTP 429 — Google rate-limits Cloudflare's
 * shared egress), and the owner's requirement ("headlines in other
 * languages translated for him") was failing in production while the code
 * looked perfectly correct. A third-party endpoint's reachability is not
 * something this product can control; **Cloudflare's own edge model is**.
 *
 * The binding is optional: a deployment without `[ai]` simply skips this
 * provider, and the chain continues.
 */
const WORKERS_AI_MODEL = "@cf/meta/m2m100-1.2b";

/** How long the model may take before the headline is left untranslated.
 *  A model call that hangs must not hang the desk. */
const WORKERS_AI_TIMEOUT_MS = 15_000;

/** The Workers AI binding, structurally typed so the package needs no
 *  dependency on the Cloudflare type packages. */
export interface AiBinding {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

/** The model names its languages in words. It is not given the same names
 *  twice: the first pair is the documented one, the second is the code. */
const AI_LANGUAGE_NAMES: Record<string, string[]> = {
  en: ["english", "en"],
  zh: ["chinese", "zh-cn", "zh"],
};
const AI_TARGET_NAMES = ["thai", "th"];

/** Pull the translation out of whatever shape the model answered with, and
 *  the reason out of whatever shape the refusal came in. */
function readAiReply(raw: unknown): { text: string; error: string | null } {
  if (typeof raw === "string") return { text: raw.trim(), error: null };
  if (!raw || typeof raw !== "object") return { text: "", error: "the model answered with nothing" };
  const reply = raw as {
    result?: unknown;
    success?: boolean;
    errors?: Array<{ code?: number; message?: string }>;
    messages?: Array<{ code?: number; message?: string }>;
  };
  const result = reply.result;
  if (typeof result === "string") return { text: result.trim(), error: null };
  if (result && typeof result === "object") {
    const inner = result as { text?: unknown; answer?: unknown; translation?: unknown };
    for (const value of [inner.text, inner.answer, inner.translation]) {
      if (typeof value === "string" && value.trim()) return { text: value.trim(), error: null };
    }
  }
  const firstError = reply.errors?.[0] ?? reply.messages?.[0];
  const error = firstError?.message
    ? `${firstError.message}${firstError.code ? ` (${firstError.code})` : ""}`
    : reply.success === false ? "the model refused the request" : "no translation in the reply";
  return { text: "", error };
}

async function translateViaWorkersAi(text: string, language: string, ai: AiBinding): Promise<string | null> {
  const sources = AI_LANGUAGE_NAMES[language] ?? AI_LANGUAGE_NAMES.en;
  let lastError = "the model did not answer";
  for (const source of sources) {
    for (const target of AI_TARGET_NAMES) {
      let raw: unknown;
      try {
        raw = await Promise.race([
          ai.run(WORKERS_AI_MODEL, { text, source_lang: source, target_lang: target }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), WORKERS_AI_TIMEOUT_MS)),
        ]);
      } catch (err) {
        lastError = err instanceof Error ? err.message : "the model call failed";
        markProviderDown("workers-ai", lastError);
        return null;
      }
      if (raw === null) {
        lastError = `the model took longer than ${WORKERS_AI_TIMEOUT_MS / 1000} s`;
        break;
      }
      const { text: out, error } = readAiReply(raw);
      if (!out) {
        lastError = error ?? "no translation in the reply";
        // A refusal about the language names is worth one more try; any
        // other refusal is the same refusal every time.
        if (!/language|lang|target|source|unsupported|not found/i.test(lastError)) {
          providerFailures.set("workers-ai", lastError);
          return null;
        }
        continue;
      }
      const clean = out.replace(/\s+/g, " ").trim();
      if (!hasThai(clean)) {
        providerFailures.set("workers-ai", "no Thai in the reply");
        return null;
      }
      providerFailures.delete("workers-ai");
      return clean;
    }
  }
  providerFailures.set("workers-ai", lastError);
  return null;
}

/**
 * Translate one headline, walking the provider chain until one answers.
 *
 * The Thai check and the length check apply to every provider: a reply with
 * no Thai in it is a failure, not a translation, and a translation that grew
 * into a paragraph is a paragraph, not a headline.
 *
 * The reason comes back with the answer. A failure with no name is a failure
 * nobody can act on.
 */
export async function translateOneDetailed(
  text: string,
  timeoutMs = TRANSLATE_TIMEOUT_MS,
  language = "en",
  ai?: AiBinding,
): Promise<{ text: string | null; reason: string | null }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const reasons: string[] = [];
  try {
    // The order is measured, not preferred: Google's plain Thai is the best,
    // Cloudflare's own model is the one the Worker can always reach, and
    // MyMemory is the last resort. A provider that is known to be down is
    // skipped rather than retried for every headline.
    const chain = ai
      ? (["google", "workers-ai", "mymemory"] as const)
      : (["google", "mymemory"] as const);
    for (const provider of chain) {
      if (providerIsDown(provider)) {
        reasons.push(`${provider}: ${providerFailures.get(provider) ?? "unavailable"} (skipped)`);
        continue;
      }
      const out = provider === "google"
        ? await translateViaGoogle(text, ctrl.signal)
        : provider === "workers-ai"
          ? await translateViaWorkersAi(text, language, ai!)
          : await translateViaMyMemory(text, language, ctrl.signal);
      if (!out) {
        const why = providerFailures.get(provider);
        reasons.push(`${provider}: ${why ?? "no reply"}`);
        continue;
      }
      if (out.length > Math.max(80, text.length * 2)) {
        providerFailures.set(provider, "the reply grew into a paragraph");
        reasons.push(`${provider}: the reply grew into a paragraph`);
        continue;
      }
      return { text: out, reason: null };
    }
    return { text: null, reason: reasons.join(" · ") };
  } catch {
    reasons.push("the request failed");
    return { text: null, reason: reasons.join(" · ") };
  } finally {
    clearTimeout(timer);
  }
}

export async function translateOne(
  text: string,
  timeoutMs = TRANSLATE_TIMEOUT_MS,
  language = "en",
  ai?: AiBinding,
): Promise<string | null> {
  return (await translateOneDetailed(text, timeoutMs, language, ai)).text;
}

/**
 * The line that says why a headline is still in English.
 *
 * Measured on 2026-10-26: the deployed Worker translated nothing and said
 * nothing about why — a page of English with no explanation. The headline
 * stays; the reason is what the reader is owed.
 */
export function translationNote(untranslated: number, reasons: string[]): string | null {
  if (untranslated <= 0) return null;
  return `แปลอัตโนมัติไม่สำเร็จ ${untranslated} พาดหัว — ${reasons[0] ?? "แหล่งข้อมูลแปลไม่ตอบ"}`;
}

/**
 * Translate the headlines that need it.
 *
 * The language travels with the text: the second provider needs an explicit
 * source language, and "en" would be a guess.
 *
 * The reasons come back too — one line, deduplicated: "why the headline is
 * still in English" is the same question for every failed headline.
 */
export async function translateHeadlines(
  headlines: Array<{ text: string; language?: string }> | string[],
  ai?: AiBinding,
): Promise<{ translated: Map<string, string>; reasons: string[] }> {
  const out = new Map<string, string>();
  const reasons: string[] = [];
  await Promise.all(headlines.map(async item => {
    const h = typeof item === "string" ? item : item.text;
    const language = typeof item === "string" ? "en" : item.language ?? "en";
    const cached = translationCache.get(h);
    if (cached) {
      out.set(h, cached);
      return;
    }
    const result = await translateOneDetailed(h, TRANSLATE_TIMEOUT_MS, language, ai);
    if (result.text) {
      if (translationCache.size >= TRANSLATION_CACHE_MAX) translationCache.clear();
      translationCache.set(h, result.text);
      out.set(h, result.text);
    } else if (result.reason && !reasons.includes(result.reason)) {
      reasons.push(result.reason);
    }
  }));
  return { translated: out, reasons };
}

// ─── The adapter ─────────────────────────────────────────────────────────

export interface MayorDeskEnv {
  /** Unused today: the desk's translation is key-free. Kept so the route can
   *  pass the environment through if a model is ever wanted here. */
  GEMINI_API_KEY?: string;
  /** Cloudflare's own translation model, when the deployment binds one. This
   *  is the path the Worker can always reach. */
  AI?: AiBinding;
}

/**
 * How many headlines the desk carries.
 *
 * Five left the news compartment 193px of empty box at 1440px — a bordered
 * region with no task in it, which is exactly what the spatial-hallucination
 * law forbids. Eight is what the compartment holds, still ranked most
 * important first: the espresso is the ordering, not the length.
 */
const DESK_NEWS_LIMIT = 8;

export async function fetchMayorDesk(env: MayorDeskEnv = {}): Promise<NormalizedFeed<MayorDesk>> {
  return cachedWithStale("mayor-desk", 60, async () => {
    const now = Date.now();
    const [ops, ews, news] = await Promise.allSettled([
      fetchFloodOperations(),
      fetchEwsStations(),
      fetchNews(),
    ]);

    const gaps: string[] = [];
    const opsFeature = ops.status === "fulfilled" ? ops.value.features[0] : undefined;
    if (ops.status === "rejected" || !opsFeature) gaps.push("Flood operations synthesis unavailable");

    const river = riverPart(opsFeature?.gauges ?? [], now);
    const official = officialPart(ews.status === "fulfilled" ? ews.value.features : [], now);
    const rain = rainPart(opsFeature?.rain ?? [], now);
    const forecast = forecastPart(opsFeature?.weather ?? [], opsFeature?.weatherFetchedAt ?? null, now);
    const parts = [river, official, rain, forecast];

    const newsItems = news.status === "fulfilled" ? news.value.features : [];
    const ranked = rankDeskNews(newsItems, now).slice(0, DESK_NEWS_LIMIT);
    const toTranslate = ranked.filter(r => r.language !== "th");
    const { translated, reasons } = await translateHeadlines(
      toTranslate.map(r => ({ text: r.headline, language: r.language })),
      env.AI,
    );

    const deskNews: DeskNewsItem[] = ranked.map(r => {
      const th = translated.get(r.headline);
      return {
        id: r.item.id,
        titleTh: th ?? r.headline,
        originalTitle: r.headline,
        language: r.language,
        translated: typeof th === "string" && th.length > 0,
        source: r.item.source,
        url: r.item.sourceUrl,
        publishedAt: r.item.publishedAt,
        placeName: r.item.placeName,
        whyTh: r.whyTh,
        whyEn: r.whyEn,
      };
    });

    const answer = buildDeskAnswer(parts);
    if (ews.status === "rejected") gaps.push("DWR EWS unavailable");
    if (news.status === "rejected") gaps.push("News feed unavailable");
    if (!newsItems.length) gaps.push("No news stories in the last 36 h");
    const untranslated = toTranslate.filter(r => !translated.has(r.headline)).length;
    const note = translationNote(untranslated, reasons);
    const feature: MayorDesk = {
      generatedAt: new Date(now).toISOString(),
      level: answer.level,
      answerTh: answer.th,
      answerEn: answer.en,
      parts,
      news: deskNews,
      notice: null,
      missing: answer.missing,
      gaps,
      translationIncomplete: untranslated > 0,
      translationNote: note,
    };

    return {
      features: [feature],
      meta: {
        source: "HII via FloodDash · DWR EWS · Open-Meteo · Google News",
        fetchedAt: feature.generatedAt,
        ageMinutes: 0,
        fallbackTier: "scenario",
        note: "Operational synthesis for the mayor's desk — not an official warning and not a calibrated inundation prediction",
      },
    };
  }, 900, true);
}
