import type { ArchivePoint, ArchiveSeries, ArchiveSnapshot } from "@nst/shared";

/**
 * Archive / time-machine. The Node daemon appends feed snapshots to
 * var/archive.jsonl over time; reading groups them into per-metric series so the
 * platform can show how the city's signals move week over week — the system
 * "learning" its own history. On Workers (no fs) reads return an empty live
 * series with a note; the static atlas remains the baseline.
 */

const ARCHIVE_FILE = "var/archive.jsonl";

function isNode(): boolean {
  return typeof process !== "undefined" && !!process.versions?.node;
}

const METRIC_LABELS: Record<string, { label: string; unit?: string }> = {
  "aqi.pm25": { label: "PM2.5", unit: "µg/m³" },
  "weather.temp": { label: "Temperature", unit: "°C" },
  "flood.dam.outflow": { label: "Bang Lang Dam outflow", unit: "m³/s" },
  "flood.gauge.max": { label: "Worst river gauge level", unit: "" },
  "news.total": { label: "News items (24h)", unit: "" },
  "news.sec": { label: "Security-tagged news", unit: "" },
  "incidents.city": { label: "Citizen reports", unit: "" },
};

/** Append a snapshot (best-effort; never throws into the caller). */
export async function recordSnapshot(points: ArchivePoint[]): Promise<void> {
  if (!isNode() || points.length === 0) return;
  try {
    const fs = await import("node:fs/promises");
    const lines = points.map((p) => JSON.stringify(p)).join("\n") + "\n";
    await fs.appendFile(ARCHIVE_FILE, lines, "utf8");
  } catch {
    // best-effort archive — never block the daemon
  }
}

async function readPoints(): Promise<ArchivePoint[]> {
  if (!isNode()) return [];
  try {
    const fs = await import("node:fs/promises");
    const raw = await fs.readFile(ARCHIVE_FILE, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((l) => { try { return JSON.parse(l) as ArchivePoint; } catch { return null; } })
      .filter((p): p is ArchivePoint => p !== null);
  } catch {
    return [];
  }
}

export async function readArchive(metricFilter?: string[]): Promise<ArchiveSnapshot> {
  const points = await readPoints();
  const byMetric = new Map<string, ArchivePoint[]>();
  const tsSet = new Set<string>();
  for (const p of points) {
    if (metricFilter && !metricFilter.includes(p.metric)) continue;
    if (!byMetric.has(p.metric)) byMetric.set(p.metric, []);
    byMetric.get(p.metric)!.push(p);
    tsSet.add(p.ts);
  }

  const series: ArchiveSeries[] = [...byMetric.entries()].map(([metric, pts]) => {
    pts.sort((a, b) => a.ts.localeCompare(b.ts));
    const meta = METRIC_LABELS[metric] ?? { label: metric };
    return { metric, label: meta.label, unit: meta.unit, points: pts };
  });

  const all = [...tsSet].sort();
  return {
    series,
    snapshots: all.length,
    oldest: all[0] ?? null,
    newest: all[all.length - 1] ?? null,
    meta: {
      source: "yala-archive",
      fetchedAt: new Date(0).toISOString(),
      ageMinutes: 0,
      fallbackTier: all.length > 0 ? "live" : "reference",
      note: all.length > 0
        ? `${all.length} snapshots archived since ${all[0]}.`
        : "No history yet — the Node daemon records a snapshot on each refresh cycle; check back as it accumulates.",
    },
  };
}

/**
 * Capture a snapshot of the current live signals. Called by the daemon on an
 * interval. Each provider is a best-effort async () => points.
 */
export async function captureSnapshot(
  providers: Array<() => Promise<ArchivePoint[]>>,
  nowIso: string,
): Promise<number> {
  const settled = await Promise.allSettled(providers.map((p) => p()));
  const points: ArchivePoint[] = [];
  for (const r of settled) if (r.status === "fulfilled") points.push(...r.value.map((p) => ({ ...p, ts: nowIso })));
  await recordSnapshot(points);
  return points.length;
}
