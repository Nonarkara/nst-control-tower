/**
 * DamageHotspotPanel — road restoration budget hotspots by district.
 *
 * Shows district-level aggregated flood-damage restoration spending from the
 * DPM datastore (data.go.th). Each row is a district ranked by total budget,
 * with a horizontal bar proportional to spending and summary stats.
 */

import type { DamageHotspotSummary, FallbackTier } from "@nst/shared";
import { PanelHeader } from "./PanelHeader";

interface Props {
  data: DamageHotspotSummary[];
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
}

const TOP_N = 10;

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtM(v: number): string {
  if (v >= 1_000_000) return `฿${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `฿${(v / 1_000).toFixed(0)}K`;
  return `฿${v.toLocaleString()}`;
}

function fmtTotal(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  return `${(v / 1_000).toFixed(0)}K`;
}

// ─── Panel ───────────────────────────────────────────────────────────────────

export function DamageHotspotPanel({ data, ageMinutes, fallbackTier }: Props) {
  const topDistricts = data.slice(0, TOP_N);
  const maxBudget = topDistricts[0]?.totalBudgetBaht ?? 0;
  const totalBudget = data.reduce((s, d) => s + d.totalBudgetBaht, 0);
  const totalRecords = data.reduce((s, d) => s + d.recordCount, 0);

  return (
    <section className="panel" aria-label="Road restoration">
      <PanelHeader
        title="ROAD RESTORATION"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="datago.dpm_01"
      />

      {/* Summary row */}
      {data.length > 0 && (
        <dl className="flood-stats">
          <div className="flood-stat">
            <dt className="flood-label">Total</dt>
            <dd className="flood-value num">฿{fmtTotal(totalBudget)}</dd>
          </div>
          <div className="flood-stat">
            <dt className="flood-label">Records</dt>
            <dd className="flood-value num">{totalRecords.toLocaleString()}</dd>
          </div>
          <div className="flood-stat">
            <dt className="flood-label">Districts</dt>
            <dd className="flood-value num">{data.length}</dd>
          </div>
        </dl>
      )}

      {/* District table */}
      {topDistricts.length === 0 ? (
        <p className="flood-empty">No data available</p>
      ) : (
        <div className="flood-table-wrap">
          <table className="flood-table">
            <caption className="visually-hidden">Restoration budget by district, highest first</caption>
            <thead>
              <tr>
                <th scope="col" className="is-rank">#</th>
                <th scope="col">District</th>
                <th scope="col" className="is-num">Budget</th>
                <th scope="col" className="is-num">Records</th>
                <th scope="col" className="is-num">Year</th>
              </tr>
            </thead>
            <tbody>
              {topDistricts.map((d, i) => {
                const pct = maxBudget > 0 ? Math.min((d.totalBudgetBaht / maxBudget) * 100, 100) : 0;
                return (
                  <tr key={d.district}>
                    <td className="is-rank num">{i + 1}</td>
                    <th scope="row">
                      <div className="damage-district">
                        <span lang="th">{d.district}</span>
                        <div className="flood-bar" aria-hidden="true">
                          <div className="flood-bar__fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </th>
                    <td className="is-num num">{fmtM(d.totalBudgetBaht)}</td>
                    <td className="is-num num">{d.recordCount}</td>
                    <td className="is-num num">{d.latestYear}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* "more" hint */}
      {data.length > TOP_N && (
        <p className="flood-meta">+{data.length - TOP_N} more districts</p>
      )}
    </section>
  );
}
