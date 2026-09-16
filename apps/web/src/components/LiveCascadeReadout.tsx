/**
 * LiveCascadeReadout — a small floating panel that surfaces the on-map water
 * ecosystem in tabular form. Each cascade station gets a row showing:
 *
 *   Mountain / station name · live water level · trend glyph · ETA to city
 *
 * The footer names the math (Haversine × channel sinuosity / celerity) so a
 * reader sees what the calculation is built on, not just the answer.
 *
 * Pure presentation — receives the watershed summaries from App.tsx and
 * looks up the lead-time + basin-band for each one. No fetching, no map
 * coupling: it could be moved into a side rail tomorrow.
 */

import type { FallbackTier } from "@nst/shared";
import { STATUS, statusRgba, type StatusLevel } from "../lib/status";
import {
  WATERSHED_ZONES,
  CELERITY_MIN_MS,
  CELERITY_MAX_MS,
  CHANNEL_SINUOSITY,
  leadTimeToCity,
  type ZoneSummary,
} from "../lib/watershed";

interface Props {
  /** Live cascade summaries (the same ones that drive watershedNodesLayer). */
  summaries: ZoneSummary[];
  fallbackTier?: FallbackTier;
  /** Optional opaque className for positioning inside the rail / map overlay. */
  className?: string;
}

interface CascadeRow {
  key: string;
  /** Top of cascade — Khao Luang runoff proxy (no live level, m³/s reading
   *  instead). */
  label: string;
  subtitle: string;
  kind: "source" | "station" | "city";
  level: string;
  trend: string;
  eta: string;
  etaDetail: string;
  status: StatusLevel;
}

function basinBandToLevel(b: "ok" | "tight" | "overflow" | "unknown" | undefined): StatusLevel {
  if (b === "overflow") return "critical";
  if (b === "tight") return "warning";
  if (b === "ok") return "normal";
  return "unknown";
}

/** Promote the GloFAS/source-side status to a verb the panel can use.
 *  HII situation_level vocabulary: 1=drought · 2=low · 3=normal · 4=high · 5=overbank.
 *  An explicit "flood" ZoneStatus (the gauge flagging an active flood wave)
 *  escalates to critical regardless of situation_level — the model reads
 *  "flood" as worst, overbank is just high. */
function sourceStatus(summaries: ZoneSummary[]): StatusLevel {
  const hasFlood = summaries.some((s) => s.status === "flood");
  if (hasFlood) return "critical";
  const worst = summaries.reduce<number>((n, s) => Math.max(n, s.situation ?? 0), 0);
  if (worst >= 5) return "warning";
  if (worst >= 4) return "warning";
  if (worst >= 3) return "normal";
  return "normal";
}

function trendGlyph(rising: boolean): string {
  return rising ? "▲" : "·";
}

function fmtLevel(level: number | null): string {
  return level != null && Number.isFinite(level) ? `${level.toFixed(2)} m` : "—";
}

export function LiveCascadeReadout({ summaries, fallbackTier, className }: Props) {
  // Build the cascade in upstream→downstream order using WATERSHED_ZONES
  // (stable ordering) — `summaries` is the live data source for each row.
  const cascade: { zone: (typeof WATERSHED_ZONES)[number]; summary: ZoneSummary | undefined }[] =
    WATERSHED_ZONES
      .filter((z) => z.basinId === "city_tha_dee" || z.isCity)
      .map((z) => ({ zone: z, summary: summaries.find((s) => s.zone.key === z.key) }));

  const sourceRow: CascadeRow = {
    key: "khao-luang",
    label: "Khao Luang",
    subtitle: "ต้นน้ำ",
    kind: "source",
    level: "GloFAS proxy",
    trend: "—",
    eta: `${CELERITY_MIN_MS.toFixed(1)}–${CELERITY_MAX_MS.toFixed(1)} m/s`,
    etaDetail: "Celerity band",
    status: sourceStatus(summaries),
  };

  const rows: CascadeRow[] = [sourceRow];
  for (const { zone, summary } of cascade) {
    if (zone.key === "thung-song") continue;
    const lt = leadTimeToCity(zone.key);
    const eta =
      lt == null
        ? "—"
        : `${(lt.minH + lt.maxH) / 2 < 10 ? lt.minH.toFixed(1) + "–" + lt.maxH.toFixed(1) : Math.round(((lt.minH + lt.maxH) / 2) * 10) / 10 + ""} h`;
    const etaDetail = lt == null ? "" : `ETA · ${lt.channelKm.toFixed(1)} km · ${CHANNEL_SINUOSITY}× sinuosity`;
    // Map ZoneStatus vocabulary (the actual zone status) to StatusLevel.
    // (basinBand lives on a separate basinBalance ledger which we don't
    // have here; the zone status itself is already the best single summary.)
    const status: StatusLevel =
      summary?.status === "flood" ? "critical"
      : summary?.status === "high" ? "warning"
      : summary?.status === "watch" ? "watch"
      : "normal";
    rows.push({
      key: zone.key,
      label: `${zone.en} · ${zone.th}`,
      subtitle: zone.role,
      kind: zone.isCity ? "city" : "station",
      level: fmtLevel(summary?.levelMsl ?? null),
      trend: trendGlyph(summary?.rising ?? false),
      eta,
      etaDetail,
      status,
    });
  }

  return (
    <aside
      className={className ?? "lcr"}
      aria-label="Live cascade — Khao Luang through NST city to Pak Phanang"
    >
      <header className="lcr__head">
        <div>
          <p className="lcr__title">LIVE CASCADE</p>
          <p className="lcr__sub">
            <span lang="th">น้ำไหลสด · ต้นน้ำ → ปลายน้ำ</span>
          </p>
        </div>
        <span className={`lcr__tier lcr__tier--${fallbackTier ?? "unknown"}`}>
          {fallbackTier === "live"
            ? "LIVE"
            : fallbackTier === "cache" || fallbackTier === "database"
              ? "CACHED"
              : fallbackTier === "scenario"
                ? "SCENARIO"
                : "—"}
        </span>
      </header>

      <ol className="lcr__list">
        {rows.map((r, i) => {
          const colour = statusRgba(r.status, 230);
          return (
            <li key={r.key} className="lcr__row" data-kind={r.kind}>
              <div className="lcr__dot" style={{ background: `rgb(${colour[0]},${colour[1]},${colour[2]})` }} aria-hidden="true" />
              {i < rows.length - 1 && <span className="lcr__thread" aria-hidden="true" />}
              <div className="lcr__main">
                <p className="lcr__label">{r.label}</p>
                <p className="lcr__subtitle">{r.subtitle}</p>
              </div>
              <div className="lcr__reading">
                <span className="lcr__level num">{r.level}</span>
                <span className="lcr__trend" aria-hidden="true">{r.trend}</span>
              </div>
              <div className="lcr__eta">
                <p className="lcr__eta-time num">{r.kind === "source" ? r.eta : r.eta}</p>
                {r.etaDetail && <p className="lcr__eta-detail">{r.etaDetail}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="lcr__foot">
        <p className="lcr__math">
          <span lang="th">คำนวณ</span> · <code>haversine × {CHANNEL_SINUOSITY} ÷ celerity {CELERITY_MIN_MS}–{CELERITY_MAX_MS} m/s</code>
        </p>
        <p className="lcr__note">
          First-order flood-wave travel time. Not a hydraulic routing result.
        </p>
      </footer>
    </aside>
  );
}

// Re-exported for unit tests so the per-row derivation has direct coverage.
export { basinBandToLevel, sourceStatus, trendGlyph as cascadeTrendGlyph };
// `basinBandToLevel` is currently unused inside the component — kept
// exported because downstream panels in this codebase may want to map the
// FloodDash water-balance ledger's band vocabulary onto the same vocabulary
// the readout uses. Don't remove without auditing siblings.

// STATUS is re-exported indirectly through the StatusLevel vocabulary already
// used above — kept as a single non-tree-shake guard against future refactors
// that prune the import.
void STATUS;
