import type { SourceMeta } from "./types.js";
/**
 * The mayor's desk — one screen, most important first.
 *
 * The desk is the morning read: the answer, the parts that make it, the
 * day's news in plain Thai, and the notice that is in force. It is not the
 * flood briefing (/flood-ops), which is the full evidence: tables, camera
 * comparison and the copy-paste record. The desk answers "what is the
 * situation and what does he need to know today" in one screen; the
 * briefing answers "show me the evidence" as long as he needs it.
 *
 * The shape of the answer is borrowed from the Chiang Mai operations war
 * room (cnx.nonarkara.org), which owns the same rules: the worst signal
 * names the headline, every part keeps its own provenance and age, and a
 * part that could not be read is a line that says so — never a calm line,
 * never a dropped line.
 */

/**
 * The severity ramp. Frozen in meaning:
 *   good     — nothing is signalling, and that is still not a guarantee
 *   watch    — worth watching
 *   alert    — act
 *   critical — act now
 *   unknown  — could not be established. A true neutral: no data can never
 *              look like good.
 */
export type DeskLevel = "good" | "watch" | "alert" | "critical" | "unknown";

/**
 * What kind of thing a part is. The reader is told, because a measurement
 * and a model do not carry the same weight and the page must not blur them.
 */
export type DeskKind = "measured" | "official" | "report" | "model";

export interface DeskPart {
  key: string;
  level: DeskLevel;
  kind: DeskKind;
  titleTh: string;
  titleEn: string;
  /** The one line that says what this part shows. */
  th: string;
  en: string;
  /** The evidence under the claim — the stations or places that produced it,
   *  most relevant first. A compartment that has room must hold content,
   *  not padding. */
  evidence: string[];
  sourceTh: string;
  sourceEn: string;
  /** When the thing was observed. Null when the part could not be read. */
  observedAt: string | null;
  /** How old it may be before it is marked stale. */
  staleAfterMs: number;
  /** True when the part answered but could not cover everything it should. */
  coverageIncomplete?: boolean;
  /** True when the authority has DECLARED this — an alert in force, not our
   *  own reading of a threshold. A declaration outranks our measurement at
   *  the same level: it is the authority's own call about its own station. */
  headlineTh?: string;
  declared?: boolean;
  sourceFetchedAt?: string;
  sourceTier?: SourceMeta["fallbackTier"];
  sourceNote?: string;

}

export type DeskNewsLanguage = "th" | "en" | "zh" | "other";

export interface DeskNewsItem {
  id: string;
  /** The headline in plain Thai — the translated one when the source is not
   *  Thai, the source's own otherwise. */
  titleTh: string;
  /** The source headline, in its own language. Shown under the Thai one so
   *  the reader can check it, and so an untranslated headline is never
   *  silently presented as translated. */
  originalTitle: string;
  language: DeskNewsLanguage;
  translated: boolean;
  source: string;
  url: string;
  publishedAt: string;
  /** A named place inside the city, when the story mentions one. */
  placeName: string | null;
  /** Why this story is in the desk — one short phrase, never a score. */
  whyTh: string;
  whyEn: string;
}

export interface DeskNotice {
  titleTh: string;
  titleEn: string;
  issuedAt: string;
  /** When the notice must be re-read. Past this it is history. */
  recheckAt: string;
  /** True once the recheck time has passed. The notice is then shown as
   *  reference, never as the warning in force. */
  expired: boolean;
  sourceTh: string;
  url: string;
}

export interface MayorDesk {
  generatedAt: string;
  /** The level of the worst part. */
  level: DeskLevel;
  /** The headline: one sentence naming the worst signal, or saying the
   *  answer is incomplete. */
  answerTh: string;
  answerEn: string;
  /** One line per part, in the order the mayor reads them. */
  parts: DeskPart[];
  /** The day's stories, most important first. */
  news: DeskNewsItem[];
  notice: DeskNotice | null;
  /** How many parts could not be read or could not cover everything. */
  missing: number;
  /** Sources that could not be read, named. Never a dropped line. */
  gaps: string[];
  /** True when a non-Thai headline could not be translated, so the reader
   *  knows the Thai line above it is missing rather than the story. */
  translationIncomplete: boolean;
  /** Why the translation did not happen, in one line, when it did not. A
   *  missing measurement is written as missing — never as a calm line. */
  translationNote?: string | null;
}

export const DESK_LEVEL_RANK: Record<DeskLevel, number> = {
  good: 0,
  unknown: 1,
  watch: 2,
  alert: 3,
  critical: 4,
};

export function worstDeskLevel(levels: DeskLevel[]): DeskLevel {
  return levels.reduce<DeskLevel>(
    (worst, level) => (DESK_LEVEL_RANK[level] > DESK_LEVEL_RANK[worst] ? level : worst),
    "good",
  );
}

export interface DeskAnswer {
  level: DeskLevel;
  th: string;
  en: string;
  missing: number;
}

export function buildDeskAnswer(parts: DeskPart[]): DeskAnswer {
  const missing = parts.filter(p => p.level === "unknown" || p.coverageIncomplete).length;
  // The worst signal names the answer. Within one level, a DECLARED alert
  // wins: the authority's own call about its own station outranks our
  // reading of a threshold at another one. Measured on 2026-10-26, with
  // DWR's alert in force at บ้านบางจันสี, the answer led with the nearest
  // gauge — the declaration was the second signal.
  const signals = parts.filter(p => p.level !== "unknown" && p.level !== "good")
    .sort((a, b) => DESK_LEVEL_RANK[b.level] - DESK_LEVEL_RANK[a.level] || Number(b.declared ?? false) - Number(a.declared ?? false));
  if (signals.length) {
    const top = signals[0];
    const others = signals.length - 1;
    return {
      level: top.level,
      th: `${top.titleTh}: ${top.headlineTh ?? top.th}${others ? ` · และอีก ${others} สัญญาณ` : ""}`,
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


/** A retained browser/API snapshot cannot continue to claim a current answer. */
export function ageMayorDesk(desk: MayorDesk, now: number): MayorDesk {
  const generatedAge = now - Date.parse(desk.generatedAt);
  const stalled = !Number.isFinite(generatedAge) || generatedAge < -300_000 || generatedAge > 300_000;
  const parts = desk.parts.map(part => {
    const observedAge = now - Date.parse(part.observedAt ?? "");
    const sourceAge = part.sourceFetchedAt ? now - Date.parse(part.sourceFetchedAt) : 0;
    const invalid = stalled || !Number.isFinite(observedAge) || observedAge < -300_000 || observedAge > part.staleAfterMs
      || !Number.isFinite(sourceAge) || sourceAge < -300_000 || sourceAge > 7200_000
      || part.sourceTier === "unavailable" || part.sourceTier === "scenario";
    if (!invalid || part.level === "unknown") {
      if (part.sourceTier === "live" && sourceAge > 60_000) return {...part, sourceTier:"cache" as const, coverageIncomplete:true};
      return part;
    }
    return {...part, level:"unknown" as const, headlineTh:undefined, declared:false, coverageIncomplete:true,
      th:`ยังยืนยันข้อมูลปัจจุบันไม่ได้ — ข้อมูลเดิม: ${part.th}`,
      en:`Current conditions unconfirmed — previous evidence: ${part.en}`};
  });
  const answer = buildDeskAnswer(parts);
  return {...desk, parts, level:answer.level, answerTh:answer.th, answerEn:answer.en, missing:answer.missing};
}

export function mayorDeskAction(desk: MayorDesk): string {
  if (desk.level === "critical" || desk.level === "alert") return "ประสานเวรป้องกันและบรรเทาสาธารณภัยทันที ตรวจยืนยันสถานีที่เตือนกับทีมภาคสนาม และตรวจคำสั่งจากหน่วยงานเจ้าของพื้นที่";
  if (desk.missing || desk.level === "unknown") return "ยืนยันข้อมูลที่ขาดกับเวรและทีมภาคสนาม ตรวจประกาศล่าสุด — ข้อมูลไม่ครบไม่ใช่การยืนยันว่าปลอดภัย";
  return "ให้เวรติดตามสถานีและประกาศล่าสุดต่อเนื่อง ยืนยันพื้นที่เสี่ยงกับทีมภาคสนาม — ระดับสถานีไม่ยืนยันสภาพทุกถนน";
}

export function mayorDeskText(desk: MayorDesk, now: number): string {
  const current = ageMayorDesk(desk, now);
  const date = (value: string) => new Date(value).toLocaleString("th-TH", {timeZone:"Asia/Bangkok",hour12:false});
  return ["บันทึกสรุปสำหรับนายกฯ — เทศบาลนครนครศรีธรรมราช",`บันทึก ${date(new Date(now).toISOString())} · ประมวลผล ${date(current.generatedAt)}`,
    "ไม่ใช่ประกาศราชการหรือคำสั่งอพยพ",current.answerTh,`ตรวจสอบต่อ: ${mayorDeskAction(current)}`,
    ...current.parts.map(part => `${part.titleTh}: ${part.th}\nแหล่งข้อมูล: ${part.sourceTh} · วัด/อ้างอิง ${part.observedAt ? date(part.observedAt) : "ไม่มีเวลา"}${part.sourceTier && part.sourceTier !== "live" ? ` · ${part.sourceTier} (ไม่ใช่ข้อมูลสด)` : ""}`),
    ...current.gaps, "หลักฐานและประกาศล่าสุด: https://nst.nonarkara.org/flood-ops", "สรุป: https://nst.nonarkara.org/mayor-desk"].join("\n\n");
}
