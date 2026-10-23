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
