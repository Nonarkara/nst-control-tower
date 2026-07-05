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

// ─── Bar ─────────────────────────────────────────────────────────────────────

function HBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{
      width: "100%",
      height: 4,
      background: "var(--rule)",
      borderRadius: 2,
      overflow: "hidden",
      flexShrink: 0,
    }}>
      <div style={{
        width: `${Math.min(pct, 100)}%`,
        height: "100%",
        background: color,
        borderRadius: 2,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function DistrictRow({ d, maxBudget, rank }: { d: DamageHotspotSummary; maxBudget: number; rank: number }) {
  const pct = maxBudget > 0 ? (d.totalBudgetBaht / maxBudget) * 100 : 0;
  const barColor =
    rank <= 2 ? "var(--bad)" :
    rank <= 5 ? "var(--warn)" :
    "var(--data)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "6px 0" }}>
      <div className="spread" style={{ alignItems: "center", gap: 6 }}>
        {/* Rank + district name */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, flex: "0 0 auto" }}>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            color: rank <= 2 ? "var(--bad)" : rank <= 5 ? "var(--warn)" : "var(--ink-low)",
            minWidth: 14,
          }}>
            {rank}
          </span>
          <span style={{
            fontSize: "var(--size-eyebrow)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {d.district}
          </span>
        </div>

        {/* Budget + bar */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <HBar pct={pct} color={barColor} />
        </div>

        {/* Budget value */}
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          color: "var(--ink)",
          flexShrink: 0,
          minWidth: 52,
          textAlign: "right",
        }}>
          {fmtM(d.totalBudgetBaht)}
        </span>
      </div>

      {/* Sub-row: record count + latest year */}
      <div className="spread" style={{ gap: 8 }}>
        <span style={{ fontSize: "0.65rem", color: "var(--ink-low)" }}>
          {d.recordCount} {d.recordCount === 1 ? "record" : "records"}
        </span>
        <span style={{ fontSize: "0.65rem", color: "var(--ink-low)" }}>
          ปี {d.latestYear}
        </span>
      </div>
    </div>
  );
}

// ─── Panel ───────────────────────────────────────────────────────────────────

export function DamageHotspotPanel({ data, ageMinutes, fallbackTier }: Props) {
  const topDistricts = data.slice(0, 10);
  const maxBudget = topDistricts[0]?.totalBudgetBaht ?? 0;
  const totalBudget = data.reduce((s, d) => s + d.totalBudgetBaht, 0);
  const totalRecords = data.reduce((s, d) => s + d.recordCount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 0 8px" }}>
      <PanelHeader
        title="ROAD RESTORATION"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="datago.dpm_01"
      />

      {/* Summary row */}
      {data.length > 0 && (
        <div style={{
          display: "flex",
          gap: 16,
          padding: "4px 0",
          borderBottom: "1px solid var(--rule)",
        }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.6rem", color: "var(--ink-low)", fontFamily: "var(--font-mono)" }}>
              TOTAL
            </span>
            <span style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)", color: "var(--ink)" }}>
              ฿{fmtTotal(totalBudget)}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.6rem", color: "var(--ink-low)", fontFamily: "var(--font-mono)" }}>
              RECORDS
            </span>
            <span style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)", color: "var(--ink)" }}>
              {totalRecords.toLocaleString()}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.6rem", color: "var(--ink-low)", fontFamily: "var(--font-mono)" }}>
              DISTRICTS
            </span>
            <span style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)", color: "var(--ink)" }}>
              {data.length}
            </span>
          </div>
        </div>
      )}

      {/* District rows */}
      {topDistricts.length === 0 ? (
        <span style={{ fontSize: "0.75rem", color: "var(--ink-low)", padding: "8px 0" }}>
          No data available
        </span>
      ) : (
        topDistricts.map((d, i) => (
          <DistrictRow
            key={d.district}
            d={d}
            maxBudget={maxBudget}
            rank={i + 1}
          />
        ))
      )}

      {/* "more" hint */}
      {data.length > 10 && (
        <span style={{ fontSize: "0.65rem", color: "var(--ink-low)", textAlign: "center" }}>
          +{data.length - 10} more districts
        </span>
      )}
    </div>
  );
}
