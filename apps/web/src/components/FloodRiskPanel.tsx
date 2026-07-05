/**
 * FloodRiskPanel — village-level flood risk classification for NST province.
 *
 * Source: data.go.th CKAN — พื้นที่เสี่ยงอุทกภัย จังหวัดนครศรีธรรมราช
 * Resource: 13809f57-218d-4eb8-bbf0-03db21b4de8d
 *
 * Shows:
 *   • High-risk village count + breakdown by risk level (สูง / ปานกลาง / ต่ำ / ไม่มีความเสี่ยง)
 *   • Per-district risk distribution (choropleth-style mini-table)
 *   • Risk-type flags: น้ำท่วมขัง / น้ำล้นตลิ่ง / น้ำป่าท่วมฉับพลัน
 */

import { useMemo } from "react";
import type { FallbackTier, FloodRiskVillage } from "@nst/shared";
import { PanelHeader } from "./PanelHeader";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RiskCount {
  label: string;
  count: number;
  color: string;
  textColor: string;
}

interface DistrictRisk {
  district: string;
  สูง: number;
  ปานกลาง: number;
  ต่ำ: number;
  ไม่มีความเสี่ยง: number;
  total: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<string, string> = {
  สูง: "var(--bad)",
  ปานกลาง: "var(--warn)",
  ต่ำ: "var(--data)",
  ไม่มีความเสี่ยง: "var(--good)",
};

const RISK_TEXT_COLORS: Record<string, string> = {
  สูง: "var(--ink)",
  ปานกลาง: "var(--ink)",
  ต่ำ: "var(--ink)",
  ไม่มีความเสี่ยง: "var(--ink)",
};

const RISK_ORDER = ["สูง", "ปานกลาง", "ต่ำ", "ไม่มีความเสี่ยง"] as const;

// ─── Sub-components ──────────────────────────────────────────────────────────

function RiskChip({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div
        style={{
          background: color,
          borderRadius: 6,
          padding: "4px 8px",
          minWidth: 44,
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "0.85rem", fontFamily: "var(--font-mono)", fontWeight: 700, color: "white" }}>
          {count.toLocaleString()}
        </span>
      </div>
      <span style={{ fontSize: "0.55rem", color: "var(--ink-low)", textAlign: "center", maxWidth: 50 }}>
        {label}
      </span>
    </div>
  );
}

function RiskTypeFlag({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 6px",
        borderRadius: 4,
        background: active ? "var(--bad)" : "var(--ground-soft)",
        opacity: active ? 1 : 0.35,
      }}
    >
      <span style={{ fontSize: "0.6rem", fontFamily: "var(--font-mono)", color: active ? "white" : "var(--ink-low)" }}>
        {label}
      </span>
    </div>
  );
}

function DistrictRow({ d, maxTotal }: { d: DistrictRisk; maxTotal: number }) {
  const pct = maxTotal > 0 ? (d.สูง / maxTotal) * 100 : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "5px 0", borderBottom: "1px solid var(--rule)" }}>
      <div className="spread" style={{ alignItems: "center" }}>
        <span style={{ fontSize: "var(--size-eyebrow)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {d.district}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--ink)" }}>
          {d.total.toLocaleString()} หมู่บ้าน
        </span>
      </div>
      {/* Mini stacked bar */}
      <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", gap: 1 }}>
        {RISK_ORDER.map((level) => {
          const n = d[level];
          const p = d.total > 0 ? (n / d.total) * 100 : 0;
          return p > 0 ? (
            <div
              key={level}
              style={{ width: `${p}%`, background: RISK_COLORS[level] }}
              title={`${level}: ${n}`}
            />
          ) : null;
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  villages: FloodRiskVillage[];
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier | "loading";
}

export function FloodRiskPanel({ villages, ageMinutes, fallbackTier }: Props) {
  const stats = useMemo(() => {
    const counts: Record<string, number> = { สูง: 0, ปานกลาง: 0, ต่ำ: 0, ไม่มีความเสี่ยง: 0 };
    villages.forEach((v) => { if (v.riskLevel in counts) counts[v.riskLevel]++; });

    const total = villages.length;

    // Per-district aggregation
    const byDistrict = new Map<string, DistrictRisk>();
    villages.forEach((v) => {
      if (!v.district) return;
      if (!byDistrict.has(v.district)) {
        byDistrict.set(v.district, { district: v.district, สูง: 0, ปานกลาง: 0, ต่ำ: 0, ไม่มีความเสี่ยง: 0, total: 0 });
      }
      const d = byDistrict.get(v.district)!;
      if (v.riskLevel && v.riskLevel in counts) d[v.riskLevel]++;
      d.total++;
    });

    const districtList: DistrictRisk[] = Array.from(byDistrict.values())
      .sort((a, b) => b.สูง - a.สูง || b.total - a.total);

    const maxTotal = districtList[0]?.total ?? 1;

    // Risk-type totals
    const typeFlags = {
      น้ำท่วมขัง: villages.filter((v) => v.standingWater).length,
      น้ำล้นตลิ่ง: villages.filter((v) => v.riverOverflow).length,
      น้ำป่าท่วมฉับพลัน: villages.filter((v) => v.flashFlood).length,
    };

    // Top high-risk villages
    const highRiskVillages = villages
      .filter((v) => v.riskLevel === "สูง")
      .slice(0, 8);

    const latestYear = villages.reduce((y, v) => Math.max(y, v.year), 0);
    const latestMonth = villages
      .filter((v) => v.year === latestYear)
      .map((v) => v.month)[0] ?? "";

    return { counts, total, districtList, maxTotal, typeFlags, highRiskVillages, latestYear, latestMonth };
  }, [villages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 0 8px" }}>
      <PanelHeader
        title="FLOOD RISK VILLAGES"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier === "loading" ? undefined : fallbackTier}
        source="data.go.th"
      />

      {villages.length === 0 ? (
        <span style={{ fontSize: "0.75rem", color: "var(--ink-low)", padding: "8px 0" }}>
          No data available
        </span>
      ) : (
        <>
          {/* Summary + risk chips */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="spread">
              <span style={{ fontSize: "0.65rem", color: "var(--ink-low)" }}>
                {stats.total.toLocaleString()} villages · ปี {stats.latestYear}{stats.latestMonth ? ` · ${stats.latestMonth}` : ""}
              </span>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {RISK_ORDER.map((level) => (
                <RiskChip
                  key={level}
                  label={level}
                  count={stats.counts[level]}
                  color={RISK_COLORS[level]}
                />
              ))}
            </div>
          </div>

          {/* Risk-type flags */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {Object.entries(stats.typeFlags).map(([label, count]) => (
              <RiskTypeFlag
                key={label}
                active={count > 0}
                label={`${label} ${count > 0 ? count : ""}`}
              />
            ))}
          </div>

          {/* High-risk village list */}
          {stats.highRiskVillages.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="eyebrow" style={{ fontSize: "0.55rem", color: "var(--ink-low)", marginBottom: 2 }}>
                HIGH-RISK VILLAGES (TOP {stats.highRiskVillages.length})
              </span>
              {stats.highRiskVillages.map((v) => (
                <div key={`${v.district}-${v.subdistrict}-${v.villageNumber}`} style={{ display: "flex", gap: 6, alignItems: "center", padding: "2px 0" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--bad)", minWidth: 12 }}>
                    ●
                  </span>
                  <span style={{ fontSize: "0.7rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {v.subdistrict} ({v.district}) · หมู่ {v.villageNumber}
                  </span>
                  <span style={{ fontSize: "0.6rem", color: "var(--ink-low)" }}>
                    {[
                      v.standingWater ? "น้ำขัง" : null,
                      v.riverOverflow ? "ล้นตลิ่ง" : null,
                      v.flashFlood ? "ป่าท่วม" : null,
                    ].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* District distribution */}
          {stats.districtList.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="eyebrow" style={{ fontSize: "0.55rem", color: "var(--ink-low)", marginBottom: 4 }}>
                DISTRICT DISTRIBUTION
              </span>
              {stats.districtList.slice(0, 12).map((d) => (
                <DistrictRow key={d.district} d={d} maxTotal={stats.maxTotal} />
              ))}
              {stats.districtList.length > 12 && (
                <span style={{ fontSize: "0.65rem", color: "var(--ink-low)", textAlign: "center", paddingTop: 4 }}>
                  +{stats.districtList.length - 12} more districts
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
