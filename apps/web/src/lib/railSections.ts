/**
 * Which rail sections a lens shows, and which start open.
 *
 * The rail used to carry 24 sections in every lens (five open at once). A lens
 * is a question — "is the city flooding?", "how is traffic?" — so the rail now
 * shows only the panels that answer it, with at most three open by default.
 * Sections absent from a lens are not rendered at all (no hidden fetch cost
 * beyond the feeds App already polls).
 */
import type { LensId } from "../map/presets";

export type RailSectionKey =
  // left rail
  | "situation-digest"
  | "executive-brief"
  | "provincial-kpis"
  | "tourism-visitors"
  | "local-catalog"
  | "municipal-ops"
  | "municipal-brief"
  | "sensor-situation"
  | "weather"
  | "air-quality"
  | "sensor-signals"
  | "level-watch"
  | "live-cascade"
  | "flood-story"
  | "top-stations"
  | "water-balance"
  | "water-network"
  | "flood-brief"
  | "flood-posture"
  | "flood-risk-villages"
  | "damage-hotspots"
  | "upstream-watershed"
  | "southern-flood-intel"
  | "flood-command"
  | "flood-analysis"
  | "earth-alpha"
  | "water-panel"
  | "flights-panel"
  | "predictive-panel"
  | "device-checkin"
  | "speed-test"
  // right rail
  | "right-cctv"
  | "right-trends"
  | "right-news";

interface RailSectionRule {
  lenses: LensId[] | "all";
  openIn: LensId[];
}

const ALL = "all" as const;

export const RAIL_SECTIONS: Record<RailSectionKey, RailSectionRule> = {
  "situation-digest": { lenses: ["intelligence"], openIn: ["intelligence"] },
  "executive-brief": { lenses: ["executive"], openIn: ["executive"] },
  "provincial-kpis": { lenses: ["executive"], openIn: [] },
  "tourism-visitors": { lenses: ["executive"], openIn: [] },
  "local-catalog": { lenses: ["executive", "intelligence"], openIn: [] },
  "municipal-ops": { lenses: ["operations", "mobility"], openIn: ["operations"] },
  "municipal-brief": { lenses: ["operations", "executive"], openIn: [] },
  "sensor-situation": { lenses: ["operations", "flood", "environment", "safety", "vibes"], openIn: ["operations", "flood", "vibes"] },
  weather: { lenses: ALL, openIn: ["environment", "vibes"] },
  "air-quality": { lenses: ["operations", "environment"], openIn: ["environment"] },
  "sensor-signals": { lenses: ["operations", "flood", "safety", "intelligence"], openIn: [] },
  // The exceedance report — the one panel that answers "is water above the
  // allowed level anywhere, and can I look?". Opens by default on FLOOD.
  "level-watch": { lenses: ["flood", "safety", "environment"], openIn: ["flood"] },
  // Former on-map overlays (they floated over the map; the shell allows only
  // map controls there). Collapsed by default — the map + LEVEL WATCH carry
  // the operational picture; these are the explainers.
  "live-cascade": { lenses: ["flood", "environment", "intelligence"], openIn: [] },
  "flood-story": { lenses: ["flood", "environment", "intelligence"], openIn: [] },
  // Visible on FLOOD / ENV / INT but not auto-opened — preserves the
  // ≤3 open-sections rule for each lens; users expand when they want it.
  "top-stations": { lenses: ["flood", "environment", "intelligence"], openIn: [] },
  "water-balance": { lenses: ["flood"], openIn: ["flood"] },
  "water-network": { lenses: ["flood", "safety", "executive", "environment"], openIn: ["safety", "executive"] },
  "flood-brief": { lenses: ["flood", "safety", "executive"], openIn: [] },
  "flood-posture": { lenses: ["flood", "safety", "executive"], openIn: ["safety"] },
  "flood-risk-villages": { lenses: ["flood", "safety"], openIn: [] },
  "damage-hotspots": { lenses: ["operations", "mobility"], openIn: [] },
  "upstream-watershed": { lenses: ["flood"], openIn: [] },
  "southern-flood-intel": { lenses: ["flood", "intelligence"], openIn: [] },
  "flood-command": { lenses: ["flood"], openIn: [] },
  "flood-analysis": { lenses: ["flood", "intelligence"], openIn: [] },
  "earth-alpha": { lenses: ["earth", "environment"], openIn: ["earth"] },
  "water-panel": { lenses: ["flood", "environment"], openIn: [] },
  "flights-panel": { lenses: ["mobility"], openIn: ["mobility"] },
  "predictive-panel": { lenses: ["intelligence"], openIn: ["intelligence"] },
  "device-checkin": { lenses: ["operations"], openIn: [] },
  "speed-test": { lenses: ["operations"], openIn: [] },
  "right-cctv": { lenses: ALL, openIn: ["mobility", "safety", "flood"] },
  "right-trends": { lenses: ["executive", "intelligence"], openIn: [] },
  "right-news": { lenses: ALL, openIn: ["operations", "mobility", "executive", "intelligence", "earth", "environment", "vibes"] },
};

export function sectionVisible(key: RailSectionKey, lens: LensId): boolean {
  const { lenses } = RAIL_SECTIONS[key];
  return lenses === ALL || lenses.includes(lens);
}

export function sectionDefaultOpen(key: RailSectionKey, lens: LensId): boolean {
  return RAIL_SECTIONS[key].openIn.includes(lens);
}

export const RIGHT_RAIL_KEYS: RailSectionKey[] = ["right-cctv", "right-trends", "right-news"];
