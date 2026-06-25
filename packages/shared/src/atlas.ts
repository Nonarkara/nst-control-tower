import type { SourceMeta } from "./types";

/**
 * NST Data Atlas — the contract that turns the "Municipal Data Source Bible"
 * (200+ sources, ~145 hard outcome stats across 12 governance domains) into an
 * impressive, queryable visualization layer.
 *
 * The data layer (apps/api/src/data/<domain>.ts) emits declarative `AtlasModule`s
 * — KPI indicators + chart SPECS — and a generic set of SVG renderers
 * (apps/web/src/components/atlas) draws any of them. This keeps the viz
 * consistent and lets each domain be authored independently.
 */

export type Trend = "up" | "down" | "flat";

/** Direction that is "good" for an indicator, so the UI colours deltas correctly. */
export type GoodDirection = "up" | "down" | "neutral";

export type IndicatorStatus = "good" | "watch" | "alert" | "critical" | "neutral";

/** A single outcome KPI — the heart of the "outcome data" the real dashboard lacks. */
export interface Indicator {
  id: string;
  label: string;
  labelTh?: string;
  value: number | string;
  unit?: string;
  /** National (or peer) benchmark for context. */
  benchmark?: { label: string; value: number | string };
  /** Provincial/national rank, e.g. {pos:66, of:77}. */
  rank?: { pos: number; of: number };
  status?: IndicatorStatus;
  /** Year-over-year or vs-baseline change. */
  delta?: { value: number; unit?: string; trend: Trend };
  goodDirection?: GoodDirection;
  source: string;
  year?: number;
  note?: string;
}

export interface SeriesPoint {
  x: string | number;
  y: number;
}

export interface NamedValue {
  name: string;
  nameTh?: string;
  value: number;
  /** Optional explicit colour; renderers fall back to a categorical palette. */
  color?: string;
  note?: string;
}

export interface ChartSeries {
  name: string;
  color?: string;
  points: SeriesPoint[];
}

/**
 * A declarative chart spec. The generic renderer switches on `kind`, so adding
 * a domain never requires new React code — only data.
 */
export type AtlasChart =
  | { kind: "donut"; title: string; data: NamedValue[]; unit?: string; centerLabel?: string; note?: string }
  | { kind: "bar"; title: string; data: NamedValue[]; unit?: string; note?: string }
  | { kind: "hbar"; title: string; data: NamedValue[]; unit?: string; note?: string }
  | { kind: "line"; title: string; series: ChartSeries[]; unit?: string; note?: string }
  | { kind: "area"; title: string; series: ChartSeries[]; unit?: string; note?: string }
  | { kind: "pyramid"; title: string; bands: string[]; male: number[]; female: number[]; unit?: string; note?: string }
  | { kind: "radar"; title: string; axes: NamedValue[]; max?: number; note?: string }
  | { kind: "grouped-bar"; title: string; groups: Array<{ label: string; values: NamedValue[] }>; unit?: string; note?: string }
  | { kind: "timeline"; title: string; events: Array<{ date: string; label: string; value?: number; severity?: IndicatorStatus; note?: string }>; note?: string };

/** One governance domain rendered as a panel: KPI cards + chart specs. */
export interface AtlasModule {
  id: string;
  title: string;
  titleTh?: string;
  /** One-line framing of what this domain shows. */
  summary: string;
  /** Which dashboard lens / theme this belongs to. */
  accent?: "teal" | "gold" | "blue" | "red" | "green";
  indicators: Indicator[];
  charts: AtlasChart[];
  meta: SourceMeta;
}

/** Status of a catalogued data source, for the Source Catalog explorer. */
export type AtlasSourceStatus =
  | "integrated"     // already wired into our dashboard
  | "live-free"      // free + reachable, ready to wire
  | "registration"   // free but needs registration/MOU (GDX, DOPA…)
  | "scrape"         // no API; scrape/download
  | "planned";       // known but not yet reachable

export interface AtlasSource {
  id: string;
  name: string;
  domain: string;
  url?: string;
  auth: string;
  format: string;
  free: string;
  status: AtlasSourceStatus;
  /** City-specific note — what this source yields for NST. */
  note?: string;
}

/** The whole atlas in one payload (for the /api/atlas snapshot + SQLite seed). */
export interface AtlasSnapshot {
  modules: AtlasModule[];
  sources: AtlasSource[];
  generatedAt: string;
  meta: SourceMeta;
}

/** Module ids — keep in sync with apps/api/src/data/*. */
export const ATLAS_MODULE_IDS = [
  "demographics",
  "fiscal",
  "outcomes",
  "education",
  "health",
  "climate",
  "economy",
  "security",
  "governance",
  "infrastructure",
] as const;
export type AtlasModuleId = (typeof ATLAS_MODULE_IDS)[number];
