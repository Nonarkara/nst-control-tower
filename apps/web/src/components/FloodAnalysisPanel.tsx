/**
 * FloodAnalysisPanel — national flood risk analysis for the FLOOD lens.
 *
 * Shows:
 *  • Historical rainfall analysis (Open-Meteo Archive, last 10 years)
 *    — annual totals, monthly normals, wet/dry season breakdown
 *  • UNOSAT 2021 Thailand flood population exposure summary
 *    — national totals, top 10 most-affected provinces
 *  • Flood cause breakdown (HII/DPM literature synthesis)
 *
 * All data is live/reference as available; degrades gracefully.
 */

import { useMemo } from "react";
import type {
  FallbackTier,
  HistoricalRainfallRecord,
  NationalFloodProneFeed,
  UnositRecord,
  UnositProvincialSummary,
} from "@nst/shared";
import { PanelHeader } from "./PanelHeader";
import { STATUS, type StatusLevel } from "../lib/status";

// ─── Flood cause breakdown (HII/DPM synthesis) ──────────────────────────────

interface FloodCause {
  cause: string;
  causeTh: string;
  pct: number;
}

const FLOOD_CAUSES: FloodCause[] = [
  { cause: "Southwest monsoon rainfall", causeTh: "ฝนมรสุมตะวันตกเฉียงใต้", pct: 45 },
  { cause: "Tropical storms / cyclones", causeTh: "พายุหมุนเขตร้อน", pct: 25 },
  { cause: "Upstream watershed runoff", causeTh: "น้ำป่าจากลุ่มน้ำตอนบน", pct: 15 },
  { cause: "Gulf storm surge", causeTh: "คลื่นพายุจากอ่าวไทย", pct: 10 },
  { cause: "Urban drainage failure", causeTh: "ระบบระบายน้ำเสียหาย", pct: 5 },
];

const MONTH_LABELS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MONTH_LABELS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtN(v: number | null | undefined, decimals = 1, suffix = ""): string {
  if (v == null) return "—";
  return `${v.toLocaleString("en", { maximumFractionDigits: decimals })}${suffix}`;
}

function BarChart({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flood-bar" aria-hidden="true">
      <div className="flood-bar__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Mean tambon severity score → status. */
function severityStatus(s: UnositProvincialSummary): StatusLevel {
  const score = s.severityScore / Math.max(s.tambonCount, 1);
  if (score >= 3.5) return "critical";
  if (score >= 2.5) return "warning";
  if (score >= 1.5) return "watch";
  return "normal";
}

/** Thai risk-class label (สูง / ปานกลาง / ต่ำ) → status. */
function riskLabelStatus(label: string): StatusLevel {
  if (label.includes("สูง")) return "critical";
  if (label.includes("ปาน")) return "warning";
  return "normal";
}

function SeverityBadge({ severity }: { severity: UnositProvincialSummary }) {
  const st = STATUS[severityStatus(severity)];
  return (
    <span className="flood-status flood-status--quiet" style={{ color: st.color }}>
      <span aria-hidden="true">{st.glyph}</span>
      <span className="num">{severity.tambonCount}</span> <span lang="th">ตำบล</span>
      <span className="visually-hidden">, severity {st.en}</span>
    </span>
  );
}

function RiskList({ entries, unit }: { entries: [string, number][]; unit?: string }) {
  return (
    <ul className="flood-analysis-risk">
      {entries.map(([label, count]) => {
        const st = STATUS[riskLabelStatus(label)];
        return (
          <li key={label}>
            <span aria-hidden="true" style={{ color: st.color }}>{st.glyph}</span>
            <span lang="th">{label}</span>
            <span className="num">
              ({count.toLocaleString()}{unit ? <> <span lang="th">{unit}</span></> : null})
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  rainfall: HistoricalRainfallRecord | null;
  rainfallAge: number | null;
  rainfallFallback: FallbackTier | "loading" | null;
  floodProne: NationalFloodProneFeed | null;
  unosat: UnositRecord | null;
  unosatAge: number | null;
  unosatFallback: FallbackTier | "loading" | null;
}

export function FloodAnalysisPanel({
  rainfall,
  rainfallAge,
  rainfallFallback,
  floodProne,
  unosat,
  unosatAge,
  unosatFallback,
}: Props) {
  // Annual rainfall chart data
  const annualSummaries = useMemo(() => {
    return rainfall?.annualSummaries ?? [];
  }, [rainfall]);

  const maxAnnualTotal = useMemo(() => {
    return Math.max(...annualSummaries.map((a) => a.totalMm), 1);
  }, [annualSummaries]);

  const maxDailyAllTime = useMemo(() => {
    if (!annualSummaries.length) return null;
    let best: { val: number; year: number } | null = null;
    for (const a of annualSummaries) {
      if (a.maxDailyMm != null && (best === null || a.maxDailyMm > best.val)) {
        best = { val: a.maxDailyMm, year: a.year };
      }
    }
    return best;
  }, [annualSummaries]);

  // Monthly normals (first available year with all months)
  const monthlyNormals = useMemo(() => {
    return rainfall?.monthlyNormals ?? [];
  }, [rainfall]);

  const maxMonthlyAvg = useMemo(() => {
    return Math.max(...monthlyNormals.map((m) => m.avgMm ?? 0), 1);
  }, [monthlyNormals]);

  // UNOSAT top provinces
  const topProvinces = useMemo(() => {
    return unosat?.national.topProvinces.slice(0, 8) ?? [];
  }, [unosat]);

  // Flood-prone national summary
  const floodProneSummary = useMemo(() => {
    const fp = floodProne?.floodProne;
    const hii = floodProne?.hiiRisk;
    if (!fp && !hii) return null;
    return { fp, hii };
  }, [floodProne]);

  const rainfallSource = "open-meteo-archive";
  const unosatSource = "UNOSAT Thailand 2021";

  // PanelHeader's fallbackTier prop only understands FallbackTier — "loading" is a
  // local pseudo-state for this panel's own render logic, not a real source health tier.
  const panelFallbackTier = (t: FallbackTier | "loading" | null): FallbackTier | undefined =>
    t === "loading" || t == null ? undefined : t;

  const stats = [
    { label: "Period", value: rainfall ? `${rainfall.startYear}–${rainfall.endYear}` : "—" },
    { label: "All-time max", value: maxDailyAllTime ? `${Math.round(maxDailyAllTime.val)} mm` : "—", note: maxDailyAllTime ? `(${maxDailyAllTime.year})` : "" },
    { label: "Wet season", value: rainfall?.wetSeasonAvgMm != null ? `${Math.round(rainfall.wetSeasonAvgMm * 10) / 10} mm/d` : "—", note: "May–Oct avg" },
    { label: "Dry season", value: rainfall?.drySeasonAvgMm != null ? `${Math.round(rainfall.drySeasonAvgMm * 10) / 10} mm/d` : "—", note: "Nov–Apr avg" },
  ];

  return (
    <div className="panel flood-analysis">
      {/* ── Historical Rainfall ─────────────────────────────────────────── */}
      <section className="flood-section" aria-label="Historical rainfall">
        <PanelHeader
          title="HISTORICAL RAINFALL · OPEN-METEO"
          ageMinutes={rainfallAge}
          fallbackTier={panelFallbackTier(rainfallFallback)}
          source={rainfallSource}
        />

        {annualSummaries.length > 0 ? (
          <>
            <div className="flood-table-wrap">
              <table className="flood-table">
                <caption className="flood-label">Annual totals (mm)</caption>
                <thead>
                  <tr>
                    <th scope="col">Year</th>
                    <th scope="col"><span className="visually-hidden">Relative total</span></th>
                    <th scope="col" className="is-num">mm</th>
                  </tr>
                </thead>
                <tbody>
                  {annualSummaries.slice(-10).map((a) => {
                    const isMax = a.totalMm === maxAnnualTotal;
                    return (
                      <tr key={a.year}>
                        <th scope="row" className="num">{a.year}</th>
                        <td className="flood-analysis-bar-cell">
                          <BarChart value={a.totalMm} max={maxAnnualTotal} />
                        </td>
                        <td className={`is-num num${isMax ? " flood-analysis-max" : ""}`}>
                          {Math.round(a.totalMm)}
                          {isMax && <> <span aria-hidden="true">▲</span><span className="visually-hidden"> wettest year</span></>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <dl className="flood-stats">
              {stats.map((s) => (
                <div key={s.label} className="flood-stat">
                  <dt className="flood-label">{s.label}</dt>
                  <dd className="flood-value num">{s.value}</dd>
                  {s.note && <dd className="flood-meta">{s.note}</dd>}
                </div>
              ))}
            </dl>

            <div className="flood-section">
              <p className="flood-label">Monthly averages (mm)</p>
              <ol className="flood-analysis-months">
                {monthlyNormals.slice(0, 12).map((m) => {
                  const pct = maxMonthlyAvg > 0 ? ((m.avgMm ?? 0) / maxMonthlyAvg) * 100 : 0;
                  const isWet = m.month >= 5 && m.month <= 10;
                  return (
                    <li key={m.month} className="flood-analysis-month">
                      <span className="flood-analysis-month__label" lang="th" aria-hidden="true">
                        {MONTH_LABELS_TH[m.month - 1]}
                      </span>
                      <span className="visually-hidden">{MONTH_LABELS_EN[m.month - 1]}{isWet ? " (wet season)" : ""}: </span>
                      <span className="flood-analysis-month__track" aria-hidden="true">
                        <span
                          className={`flood-analysis-month__bar${isWet ? " is-wet" : ""}`}
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        />
                      </span>
                      <span className="num">{m.avgMm != null ? Math.round(m.avgMm) : "—"}</span>
                    </li>
                  );
                })}
              </ol>
              <ul className="flood-legend" aria-label="Month bar key">
                <li><span className="swatch flood-analysis-swatch--wet" aria-hidden="true" /> Wet season (May–Oct)</li>
                <li><span className="swatch flood-analysis-swatch--dry" aria-hidden="true" /> Dry season</li>
              </ul>
            </div>
          </>
        ) : (
          <p className="flood-empty">No rainfall data available</p>
        )}
      </section>

      {/* ── UNOSAT 2021 Exposure ────────────────────────────────────────── */}
      {unosat && (
        <section className="flood-section" aria-label="UNOSAT 2021 population exposure">
          <PanelHeader
            title="UNOSAT 2021 POPULATION EXPOSURE"
            ageMinutes={unosatAge}
            fallbackTier={panelFallbackTier(unosatFallback)}
            source={unosatSource}
          />
          <dl className="flood-stats">
            {[
              { label: "Pop. exposed", value: fmtN(unosat.national.totalPopExposed, 0, "") },
              { label: "Flooded km²", value: fmtN(unosat.national.totalFloodedKm2, 1, " km²") },
              { label: "HHs affected", value: fmtN(unosat.national.totalHouseholds, 0, "") },
            ].map((s) => (
              <div key={s.label} className="flood-stat">
                <dt className="flood-label">{s.label}</dt>
                <dd className="flood-value flood-value--lg num">{s.value}</dd>
              </div>
            ))}
          </dl>

          <div className="flood-table-wrap">
            <table className="flood-table">
              <caption className="flood-label">Top affected provinces</caption>
              <thead>
                <tr>
                  <th scope="col" className="is-rank">#</th>
                  <th scope="col">Province</th>
                  <th scope="col" className="is-num">Exposed</th>
                </tr>
              </thead>
              <tbody>
                {topProvinces.map((p, i) => (
                  <tr key={p.provCode}>
                    <td className="is-rank num">{i + 1}</td>
                    <th scope="row">
                      <div className="flood-item">
                        <span className="flood-row-head">
                          <span><span lang="th">{p.provT}</span> / {p.provE}</span>
                          <SeverityBadge severity={p} />
                        </span>
                        <BarChart value={p.totalPopExposed} max={topProvinces[0]?.totalPopExposed ?? 1} />
                      </div>
                    </th>
                    <td className="is-num num">{p.totalPopExposed.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="flood-footnote">
            UNOSAT Thailand 2021 SW Monsoon · {unosat.national.eventStartDate} – {unosat.national.eventEndDate}
          </p>
        </section>
      )}

      {/* ── Flood Cause Breakdown ──────────────────────────────────────── */}
      <section className="flood-section" aria-label="Flood cause analysis">
        <PanelHeader title="FLOOD CAUSE ANALYSIS" source="HII/DPM synthesis" />
        <p className="flood-meta">
          Primary drivers of flood events in Nakhon Si Thammarat (literature synthesis)
        </p>
        <ul className="flood-list">
          {FLOOD_CAUSES.map((c) => (
            <li key={c.cause} className="flood-analysis-cause">
              <div className="flood-row-head">
                <span>
                  <span className="flood-analysis-cause__name">{c.cause}</span>
                  <span className="flood-analysis-cause__th" lang="th">{c.causeTh}</span>
                </span>
                <span className="flood-figure num">{c.pct}%</span>
              </div>
              <BarChart value={c.pct} max={100} />
            </li>
          ))}
        </ul>
        <p className="flood-footnote">
          Sources: HII MMS flood survey 2025 · DDPM situation reports · UNOSAT Thailand 2021 · Thai Meteorological Department
        </p>
      </section>

      {/* ── National Flood-Prone Summary ───────────────────────────────── */}
      {floodProneSummary && (
        <section className="flood-section" aria-label="National flood-prone areas">
          <PanelHeader
            title="NATIONAL FLOOD-PRONE AREAS"
            source="data.go.th + HII 17-yr"
          />
          {floodProneSummary.fp && (
            <div className="flood-section">
              <p className="flood-label">data.go.th provincial flood-prone ({floodProneSummary.fp.totalRecords} records)</p>
              <RiskList entries={Object.entries(floodProneSummary.fp.byRiskLevel)} />
            </div>
          )}
          {floodProneSummary.hii && (
            <div className="flood-section">
              <p className="flood-label">
                HII 17-year tambon risk ({floodProneSummary.hii.totalTambonRecords.toLocaleString()} <span lang="th">ตำบล</span>)
              </p>
              <RiskList entries={Object.entries(floodProneSummary.hii.byRisk)} unit="ตำบล" />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
