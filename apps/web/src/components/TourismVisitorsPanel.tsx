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
    <span
      className={`tourism-yoy mono ${up ? "tourism-yoy--up" : "tourism-yoy--down"}`}
      aria-label={`${up ? "increase" : "decrease"} of ${abs}% year-over-year`}
    >
      {up ? "▲" : "▼"} {abs}%
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
      <section className="tourism-panel" aria-busy="true">
        <PanelHeader
          title="TOURISM VISITORS"
          source="data.go.th/tourism"
          fallbackTier={fallbackTier}
        />
        <div className="skeleton" style={{ height: 24, marginTop: 8 }} />
        <div className="skeleton" style={{ height: 16, marginTop: 6 }} />
        <div className="skeleton" style={{ height: 16, marginTop: 4 }} />
      </section>
    );
  }

  if (records.length === 0) return null;

  const maxVisitors = peakYear?.visitors ?? records[0]!.visitors;

  return (
    <section className="tourism-panel">
      <PanelHeader
        title="TOURISM VISITORS"
        ageMinutes={ageMinutes ?? undefined}
        fallbackTier={fallbackTier}
        source="data.go.th/tourism"
      />

      {latest && (
        <div className="tourism-hero" aria-label={`Latest year: ${latest.yearBE}, ${fmtVisitors(latest.visitors)} visitors`}>
          <div className="tourism-hero-count mono">
            {fmtVisitors(latest.visitors)}
          </div>
          <div className="tourism-hero-label">
            <span className="eyebrow">VISITORS · {latest.yearBE}</span>
            {latest.yoyPct != null && <YoyBadge pct={latest.yoyPct} />}
          </div>
        </div>
      )}

      {/* Bar chart — horizontal bars, newest year at top, COVID years dimmed */}
      <div className="tourism-chart" role="img" aria-label="Annual visitor bar chart">
        {records.map((r) => {
          const barPct = maxVisitors > 0 ? (r.visitors / maxVisitors) * 100 : 0;
          const isCovid = COVID_YEARS_BE.has(r.yearBE);
          const isPeak = r.yearBE === PEAK_YEAR_BE;
          const isLatest = r === latest;
          return (
            <div
              key={r.yearBE}
              className={`tourism-row${isCovid ? " tourism-row--covid" : ""}${isPeak && !isLatest ? " tourism-row--peak" : ""}`}
            >
              <span className="tourism-year mono" aria-hidden="true">
                {r.yearBE}
              </span>
              <div className="tourism-bar-track" aria-hidden="true">
                <div
                  className={`tourism-bar${isPeak && !isLatest ? " tourism-bar--peak" : ""}${isLatest ? " tourism-bar--latest" : ""}`}
                  style={{ width: `${barPct.toFixed(1)}%` }}
                />
              </div>
              <span className="tourism-val mono">
                {fmtVisitors(r.visitors)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Annotations */}
      {peakYear && peakYear.yearBE !== latest?.yearBE && (
        <div className="tourism-note">
          Peak: {peakYear.yearBE} · {fmtVisitors(peakYear.visitors)} visitors
        </div>
      )}
      {(records.some((r) => COVID_YEARS_BE.has(r.yearBE))) && (
        <div className="tourism-note tourism-note--covid">
          <span className="eyebrow">▼ COVID impact</span>
          <span className="mono"> 2563–2564 dip visible</span>
        </div>
      )}
      <div className="tourism-note">
        <span className="eyebrow">SOURCE</span>
        <span className="mono"> สทกจ.นศ · data.go.th</span>
      </div>
    </section>
  );
}
