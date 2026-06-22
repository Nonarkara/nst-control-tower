import type { SourceMeta } from "./types";

/**
 * Yala Knowledge Platform — the layer that complements the dashboard with
 * data search, an archive/time-machine, an education academy, an AI concierge
 * (retrieval-augmented), and a self-learning insights loop.
 *
 * Static content (academy, glossary, data dictionary, computed insights, a
 * static search index) is served everywhere (Worker + Node). The live,
 * stateful pieces (accumulating archive, live FTS, LLM concierge) are served by
 * the Mac Node daemon and degrade gracefully when it's offline.
 */

// ── Academy (education) ──────────────────────────────────────────────────────
export type AcademyTrack =
  | "deep-south"      // the conflict context, ethics of display
  | "data-literacy"   // how to read indicators, ranks, choropleths
  | "city-systems"    // the circular city, civic services, governance
  | "climate-flood"   // Pattani River, Bang Lang Dam, monsoon risk
  | "outcomes"        // poverty, education, health gaps
  | "platform";       // how to use this dashboard + platform

export type AcademyLevel = "intro" | "core" | "deep";

export interface AcademyLink {
  label: string;
  /** Deep-link target inside the app. */
  lens?: string;        // map lens id
  atlasModule?: string; // atlas module id
  sourceId?: string;    // atlas source id
  url?: string;         // external
}

export interface QuizItem {
  q: string;
  choices: string[];
  answer: number; // index into choices
  explain: string;
}

export interface AcademyLesson {
  id: string;
  track: AcademyTrack;
  order: number;
  title: string;
  titleTh?: string;
  summary: string;
  level: AcademyLevel;
  durationMin: number;
  /** Markdown body. */
  body: string;
  keyFacts: string[];
  links: AcademyLink[];
  quiz: QuizItem[];
}

// ── Glossary + data dictionary ───────────────────────────────────────────────
export interface GlossaryTerm {
  term: string;
  termTh?: string;
  /** Patani-Malay / Jawi rendering where relevant. */
  termYawi?: string;
  domain: string;
  definition: string;
  related?: string[];
}

export interface DataDictionaryEntry {
  indicatorId: string;
  label: string;
  module: string;
  whatItMeans: string;
  howMeasured: string;
  goodDirection: "up" | "down" | "neutral";
  source: string;
  caveats?: string;
}

// ── Unified search ───────────────────────────────────────────────────────────
export type SearchDocType =
  | "indicator" | "source" | "lesson" | "glossary" | "dataset" | "news" | "insight";

export interface SearchResult {
  id: string;
  type: SearchDocType;
  title: string;
  snippet: string;
  score: number;
  domain?: string;
  /** Where to go when the result is clicked. */
  deepLink?: { kind: "lens" | "atlasModule" | "lesson" | "source" | "url"; id: string };
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  /** "static" = TS index (Worker), "fts" = live SQLite FTS (Node daemon). */
  engine: "static" | "fts";
  meta: SourceMeta;
}

// ── Archive / time-machine ───────────────────────────────────────────────────
export interface ArchivePoint {
  ts: string;          // ISO timestamp of the snapshot
  metric: string;      // e.g. "aqi.pm25", "flood.dam.outflow", "news.sec.count"
  value: number;
  unit?: string;
  label?: string;
}

export interface ArchiveSeries {
  metric: string;
  label: string;
  unit?: string;
  points: ArchivePoint[];
}

export interface ArchiveSnapshot {
  series: ArchiveSeries[];
  /** How many distinct snapshot timestamps are stored. */
  snapshots: number;
  oldest: string | null;
  newest: string | null;
  meta: SourceMeta;
}

// ── Self-learning insights ───────────────────────────────────────────────────
export type InsightSeverity = "info" | "watch" | "alert" | "critical";

export interface Insight {
  id: string;
  ts: string;
  severity: InsightSeverity;
  domain: string;
  title: string;
  body: string;
  /** Supporting facts/citations. */
  evidence: string[];
  /** Suggested place to look. */
  deepLink?: { kind: "lens" | "atlasModule" | "lesson"; id: string };
}

export interface InsightDigest {
  generatedAt: string;
  headline: string;
  insights: Insight[];
  /** "live" once the archive has history to compare against. */
  mode: "static" | "live";
  meta: SourceMeta;
}

// ── AI concierge (retrieval-augmented) ───────────────────────────────────────
export interface ConciergeAnswer {
  question: string;
  answer: string;
  citations: SearchResult[];
  /** true when an LLM synthesized the answer; false = retrieval-only fallback. */
  usedLLM: boolean;
  meta: SourceMeta;
}
