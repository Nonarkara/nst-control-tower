/**
 * One status vocabulary for the whole dashboard — panels, chips and map layers.
 *
 * Every level carries a colour token (CSS), a map RGB tuple (deck.gl), a text
 * label in both languages and a glyph, so status is never conveyed by colour
 * alone (WCAG 1.4.1). Domain modules map their own scales onto these five
 * levels; they must not invent new status colours.
 */

export type StatusLevel = "normal" | "watch" | "warning" | "critical" | "unknown";

export interface StatusDef {
  en: string;
  th: string;
  /** CSS colour token for text, borders and swatches. */
  color: string;
  /** Map fill (deck.gl). Mid-luminance so it reads on dark and light basemaps
   *  when drawn with the standard dark outline. */
  rgb: [number, number, number];
  /** Shape redundancy for colour-blind and monochrome reading. */
  glyph: string;
  rank: number;
}

export const STATUS: Record<StatusLevel, StatusDef> = {
  normal: { en: "Normal", th: "ปกติ", color: "var(--good)", rgb: [46, 160, 94], glyph: "●", rank: 0 },
  watch: { en: "Watch", th: "เฝ้าระวัง", color: "var(--warn)", rgb: [240, 180, 41], glyph: "▲", rank: 1 },
  warning: { en: "Warning", th: "เตือนภัย", color: "var(--alert)", rgb: [245, 124, 0], glyph: "◆", rank: 2 },
  critical: { en: "Critical", th: "วิกฤต", color: "var(--bad)", rgb: [220, 38, 38], glyph: "■", rank: 3 },
  unknown: { en: "No data", th: "ไม่มีข้อมูล", color: "var(--ink-3)", rgb: [150, 150, 150], glyph: "○", rank: -1 },
};

export const STATUS_LEVELS: StatusLevel[] = ["normal", "watch", "warning", "critical", "unknown"];

/** Most severe level in a list; "unknown" only when nothing is known. */
export function worstStatus(levels: Iterable<StatusLevel>): StatusLevel {
  let worst: StatusLevel = "unknown";
  for (const l of levels) if (STATUS[l].rank > STATUS[worst].rank) worst = l;
  return worst;
}

/** Map RGBA for a level. */
export function statusRgba(level: StatusLevel, alpha = 235): [number, number, number, number] {
  const [r, g, b] = STATUS[level].rgb;
  return [r, g, b, alpha];
}

/** Data freshness shares the same colours: live = normal, stale = watch, offline = critical. */
export type Freshness = "live" | "stale" | "offline" | "loading";
export const FRESHNESS_STATUS: Record<Freshness, StatusLevel> = {
  live: "normal",
  stale: "watch",
  offline: "critical",
  loading: "unknown",
};
