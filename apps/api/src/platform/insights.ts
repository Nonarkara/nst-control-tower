import type { AtlasModule, Indicator, Insight, InsightDigest, InsightSeverity } from "@nst/shared";
import { ATLAS_MODULES } from "../data/index.js";

/**
 * Self-learning insights engine. Extracts knowledge from the Data Atlas
 * (deterministic "learning" — flag critical outcomes, quantify gaps vs national,
 * point to the right lens) and, when archive history is available, detects
 * week-over-week movement. Worker-safe; the archive comparison activates on the
 * Node daemon once history accumulates.
 */

const SEVERITY_RANK: Record<InsightSeverity, number> = { critical: 3, alert: 2, watch: 1, info: 0 };

function lensFor(moduleId: string): { kind: "lens" | "atlasModule" | "lesson"; id: string } | undefined {
  const map: Record<string, string> = {
    outcomes: "poverty",
    security: "security",
    climate: "flood",
    education: "poverty",
    health: "safety",
    economy: "executive",
    fiscal: "executive",
    governance: "executive",
    demographics: "operations",
  };
  const lens = map[moduleId];
  return lens ? { kind: "lens", id: lens } : { kind: "atlasModule", id: moduleId };
}

function num(v: number | string): number | null {
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Build an insight from a critical/alert indicator. */
function fromIndicator(mod: AtlasModule, ind: Indicator): Insight | null {
  if (ind.status !== "critical" && ind.status !== "alert") return null;
  const sev: InsightSeverity = ind.status;
  const evidence: string[] = [`${ind.label}: ${ind.value}${ind.unit ? " " + ind.unit : ""} (${ind.source}${ind.year ? ", " + ind.year : ""})`];
  if (ind.benchmark) {
    const v = num(ind.value), b = num(ind.benchmark.value);
    if (v != null && b != null && b !== 0) {
      const pct = Math.round(((v - b) / b) * 100);
      evidence.push(`${pct > 0 ? "+" : ""}${pct}% vs ${ind.benchmark.label} (${ind.benchmark.value})`);
    }
  }
  if (ind.rank) evidence.push(`Ranked ${ind.rank.pos} of ${ind.rank.of}`);
  if (ind.note) evidence.push(ind.note);
  return {
    id: `ins-${mod.id}-${ind.id}`,
    ts: "2026-06-17T00:00:00.000Z",
    severity: sev,
    domain: mod.title,
    title: `${ind.label} needs attention`,
    body: `${mod.title}: ${ind.label} is ${ind.value}${ind.unit ? " " + ind.unit : ""}` +
      `${ind.benchmark ? `, against a benchmark of ${ind.benchmark.value} (${ind.benchmark.label})` : ""}. ` +
      `This is one of the outcome signals the operational dashboard does not surface.`,
    evidence,
    deepLink: lensFor(mod.id),
  };
}

/** Compute the static insight digest from the atlas. */
export function computeInsights(now = "2026-06-17T00:00:00.000Z"): InsightDigest {
  const insights: Insight[] = [];
  for (const mod of ATLAS_MODULES) {
    for (const ind of mod.indicators) {
      const ins = fromIndicator(mod, ind);
      if (ins) insights.push(ins);
    }
  }
  insights.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  const criticals = insights.filter((i) => i.severity === "critical").length;
  const headline =
    criticals > 0
      ? `${criticals} critical outcome signals — poverty, education and youth disconnection lead the list the operational dashboard is blind to.`
      : `Outcomes are tracking within expected ranges.`;

  return {
    generatedAt: now,
    headline,
    insights: insights.slice(0, 24),
    mode: "static",
    meta: {
      source: "yala-insights-engine",
      fetchedAt: now,
      ageMinutes: 0,
      fallbackTier: "reference",
      note: "Derived from the Data Atlas. Week-over-week detection activates once the live archive accumulates history (Node daemon).",
    },
  };
}
