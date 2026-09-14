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
import { STATUS, type StatusLevel } from "../lib/status";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DistrictRisk {
  district: string;
  สูง: number;
  ปานกลาง: number;
  ต่ำ: number;
  ไม่มีความเสี่ยง: number;
  total: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RISK_ORDER = ["สูง", "ปานกลาง", "ต่ำ", "ไม่มีความเสี่ยง"] as const;
type RiskLevel = (typeof RISK_ORDER)[number];

/** Thai risk class → shared status vocabulary + English gloss. */
const RISK_STATUS: Record<RiskLevel, { level: StatusLevel; en: string }> = {
  สูง: { level: "critical", en: "High" },
  ปานกลาง: { level: "warning", en: "Medium" },
  ต่ำ: { level: "watch", en: "Low" },
  ไม่มีความเสี่ยง: { level: "normal", en: "None" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function RiskChip({ level, count }: { level: RiskLevel; count: number }) {
  const st = STATUS[RISK_STATUS[level].level];
  return (
    <div className="flood-risk-chip" style={{ borderTopColor: st.color }}>
      <dt className="flood-risk-chip__label">
        <span aria-hidden="true" style={{ color: st.color }}>{st.glyph}</span>
        <span lang="th">{level}</span>
        <span className="visually-hidden"> ({RISK_STATUS[level].en} risk)</span>
      </dt>
      <dd className="flood-risk-chip__count num">{count.toLocaleString()}</dd>
    </div>
  );
}

function DistrictRow({ d }: { d: DistrictRisk }) {
  const summary = RISK_ORDER.map((level) => `${RISK_STATUS[level].en} ${d[level]}`).join(", ");
  return (
    <li className="flood-risk-district">
      <div className="flood-row-head">
        <span className="flood-name" lang="th">{d.district}</span>
        <span className="flood-figure num">
          {d.total.toLocaleString()} <span lang="th">หมู่บ้าน</span>
        </span>
      </div>
      {/* Mini stacked bar — segment order and the chips above are the key */}
      <div className="flood-risk-stack" role="img" aria-label={`Villages by risk: ${summary}`}>
        {RISK_ORDER.map((level) => {
          const n = d[level];
          const p = d.total > 0 ? (n / d.total) * 100 : 0;
          return p > 0 ? (
            <span
              key={level}
              style={{ width: `${p}%`, background: STATUS[RISK_STATUS[level].level].color }}
              title={`${level}: ${n}`}
            />
          ) : null;
        })}
      </div>
    </li>
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

  const high = STATUS[RISK_STATUS["สูง"].level];

  return (
    <section className="panel" aria-label="Flood risk villages">
      <PanelHeader
        title="FLOOD RISK VILLAGES"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier === "loading" ? undefined : fallbackTier}
        source="data.go.th"
      />

      {villages.length === 0 ? (
        <p className="flood-empty">No data available</p>
      ) : (
        <>
          {/* Summary + risk chips */}
          <p className="flood-meta num">
            {stats.total.toLocaleString()} villages · <span lang="th">ปี</span> {stats.latestYear}
            {stats.latestMonth ? <> · <span lang="th">{stats.latestMonth}</span></> : ""}
          </p>
          <dl className="flood-risk-chips">
            {RISK_ORDER.map((level) => (
              <RiskChip key={level} level={level} count={stats.counts[level]} />
            ))}
          </dl>

          {/* Risk-type flags */}
          <ul className="flood-risk-flags" aria-label="Villages by flood type">
            {Object.entries(stats.typeFlags).map(([label, count]) => (
              <li key={label} className={`flood-risk-flag${count > 0 ? " is-active" : ""}`}>
                <span lang="th">{label}</span> <span className="num">{count > 0 ? count : ""}</span>
                {count === 0 && <span className="visually-hidden">none</span>}
              </li>
            ))}
          </ul>

          {/* High-risk village list */}
          {stats.highRiskVillages.length > 0 && (
            <div className="flood-section">
              <p className="flood-label">High-risk villages (top {stats.highRiskVillages.length})</p>
              <ul className="flood-list">
                {stats.highRiskVillages.map((v) => (
                  <li key={`${v.district}-${v.subdistrict}-${v.villageNumber}`} className="flood-risk-village">
                    <span aria-hidden="true" style={{ color: high.color }}>{high.glyph}</span>
                    <span className="flood-name" lang="th">
                      {v.subdistrict} ({v.district}) · หมู่ {v.villageNumber}
                    </span>
                    <span className="flood-meta" lang="th">
                      {[
                        v.standingWater ? "น้ำขัง" : null,
                        v.riverOverflow ? "ล้นตลิ่ง" : null,
                        v.flashFlood ? "ป่าท่วม" : null,
                      ].filter(Boolean).join(", ") || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* District distribution */}
          {stats.districtList.length > 0 && (
            <div className="flood-section">
              <p className="flood-label">District distribution</p>
              <ul className="flood-list">
                {stats.districtList.slice(0, 12).map((d) => (
                  <DistrictRow key={d.district} d={d} />
                ))}
              </ul>
              {stats.districtList.length > 12 && (
                <p className="flood-meta">+{stats.districtList.length - 12} more districts</p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
