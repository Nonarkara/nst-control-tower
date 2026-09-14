/**
 * TourismVisitorsPanel — annual visitor totals for Nakhon Si Thammarat province.
 *
 * Data: data.go.th CKAN — นักท่องเที่ยวจังหวัดนครศรีธรรมราช (สทกจ.)
 * Notes:
 *   - Annual headcount only — NO transport-mode breakdown in this dataset.
 *   - 2563-2564 shows the COVID dip; peak year is highlighted.
 */

import { useMemo } from "react";
import { PanelHeader } from "./PanelHeader";
import type { FallbackTier } from "@nst/shared";

/** Tourism year record as returned by /api/tourism-visitors */
export interface TourismFeedRecord {
  yearBE: number;
  visitors: number;
  unit: string;
  source: string;
  visitorsMillions: number;
  /** Year-over-year change in percentage points. null for the oldest year. */
  yoyPct: number | null;
}

interface Props {
  records: TourismFeedRecord[];
  loading: boolean;
  ageMinutes: number | null;
  fallbackTier?: FallbackTier;
}

const COVID_YEARS_BE = new Set([2563, 2564]);
const PEAK_YEAR_BE = 2561; // 3,883,400 visitors (pre-COVID peak)

function fmtVisitors(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function YoyBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  const abs = Math.abs(pct).toFixed(1);
  return (
    <span className="tour-yoy num">
      <span aria-hidden="true">{up ? "▲" : "▼"} </span>
      <span className="visually-hidden">{up ? "increase of" : "decrease of"} </span>
      {abs}%
      <span className="visually-hidden"> year-over-year</span>
    </span>
  );
}

export function TourismVisitorsPanel({ records, loading, ageMinutes, fallbackTier }: Props) {
  const latest = records[0] ?? null;
  const peakYear = useMemo(
    () => records.reduce((best, r) => (r.visitors > best.visitors ? r : best), records[0]!),
    [records],
  );

  if (loading && records.length === 0) {
    return (
      <section className="panel" aria-label="Tourism visitors" aria-busy="true">
        <PanelHeader
          title="TOURISM VISITORS"
          source="data.go.th/tourism"
          fallbackTier={fallbackTier}
        />
        <span className="skeleton pc-skeleton pc-skeleton--tall" />
        <span className="skeleton pc-skeleton" />
        <span className="skeleton pc-skeleton" />
      </section>
    );
  }

  if (records.length === 0) return null;

  const maxVisitors = peakYear?.visitors ?? records[0]!.visitors;

  return (
    <section className="panel" aria-label="Tourism visitors">
      <PanelHeader
        title="TOURISM VISITORS"
        ageMinutes={ageMinutes ?? undefined}
        fallbackTier={fallbackTier}
        source="data.go.th/tourism"
      />

      {latest && (
        <p className="stat-line">
          <span className="stat-line__value num">{fmtVisitors(latest.visitors)}</span>
          <span className="pc-label">VISITORS · {latest.yearBE}</span>
          {latest.yoyPct != null && <YoyBadge pct={latest.yoyPct} />}
        </p>
      )}

      {/* Bar chart — horizontal bars, newest year at top, COVID years muted */}
      <ol className="tour-chart" aria-label="Annual visitors by year (Buddhist Era)">
        {records.map((r) => {
          const barPct = maxVisitors > 0 ? (r.visitors / maxVisitors) * 100 : 0;
          const isCovid = COVID_YEARS_BE.has(r.yearBE);
          const isPeak = r.yearBE === PEAK_YEAR_BE;
          const isLatest = r === latest;
          const modifier = isLatest
            ? " tour-row--latest"
            : isPeak
              ? " tour-row--peak"
              : isCovid
                ? " tour-row--covid"
                : "";
          return (
            <li key={r.yearBE} className={`tour-row${modifier}`}>
              <span className="tour-row__year num">{r.yearBE}</span>
              <span className="pc-bar" aria-hidden="true">
                <span className="pc-bar__fill" style={{ width: `${barPct.toFixed(1)}%` }} />
              </span>
              <span className="tour-row__val num">
                {fmtVisitors(r.visitors)}
                {isPeak && !isLatest && <span className="visually-hidden"> (peak year)</span>}
                {isCovid && <span className="visually-hidden"> (COVID year)</span>}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Annotations */}
      {peakYear && peakYear.yearBE !== latest?.yearBE && (
        <p className="pc-meta">
          Peak: {peakYear.yearBE} · {fmtVisitors(peakYear.visitors)} visitors
        </p>
      )}
      {records.some((r) => COVID_YEARS_BE.has(r.yearBE)) && (
        <p className="pc-meta">
          <span aria-hidden="true">▼ </span>COVID impact · 2563–2564 dip visible
        </p>
      )}
      <p className="pc-meta">
        SOURCE · <span lang="th">สทกจ.นศ</span> · data.go.th
      </p>
    </section>
  );
}
