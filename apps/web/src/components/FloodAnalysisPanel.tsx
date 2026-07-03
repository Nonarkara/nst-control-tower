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
import { fmtAge } from "@nst/shared";

// ─── Flood cause breakdown (HII/DPM synthesis) ──────────────────────────────

interface FloodCause {
  cause: string;
  causeTh: string;
  pct: number;
  color: string;
}

const FLOOD_CAUSES: FloodCause[] = [
  { cause: "Southwest monsoon rainfall", causeTh: "ฝนมรสุมตะวันตกเฉียงใต้", pct: 45, color: "var(--ink-mid)" },
  { cause: "Tropical storms / cyclones", causeTh: "พายุหมุนเขตร้อน", pct: 25, color: "var(--bad)" },
  { cause: "Upstream watershed runoff", causeTh: "น้ำป่าจากลุ่มน้ำตอนบน", pct: 15, color: "var(--warn)" },
  { cause: "Gulf storm surge", causeTh: "คลื่นพายุจากอ่าวไทย", pct: 10, color: "var(--data)" },
  { cause: "Urban drainage failure", causeTh: "ระบบระบายน้ำเสียหาย", pct: 5,  color: "var(--ground-2)" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtN(v: number | null | undefined, decimals = 1, suffix = ""): string {
  if (v == null) return "—";
  return `${v.toLocaleString("en", { maximumFractionDigits: decimals })}${suffix}`;
}

function BarChart({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ width: "100%", height: 6, background: "var(--rule)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.3s" }} />
    </div>
  );
}

function SeverityBadge({ severity }: { severity: UnositProvincialSummary }) {
  const score = severity.severityScore / Math.max(severity.tambonCount, 1);
  const color =
    score >= 3.5 ? "var(--bad)" :
    score >= 2.5 ? "var(--warn)" :
    score >= 1.5 ? "var(--data)" :
    "var(--good)";
  return (
    <span style={{
      display: "inline-block",
      padding: "1px 6px",
      borderRadius: 4,
      fontSize: "0.65rem",
      fontFamily: "var(--font-mono)",
      color,
      border: `1px solid ${color}`,
      marginLeft: 4,
    }}>
      {severity.tambonCount} ตำบล
    </span>
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

  const MONTH_LABELS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const MONTH_LABELS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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

  const rainfallSource = rainfallFallback === "unavailable" ? "open-meteo-archive" : "open-meteo-archive";
  const unosatSource = "UNOSAT Thailand 2021";

  // PanelHeader's fallbackTier prop only understands FallbackTier — "loading" is a
  // local pseudo-state for this panel's own render logic, not a real source health tier.
  const panelFallbackTier = (t: FallbackTier | "loading" | null): FallbackTier | undefined =>
    t === "loading" || t == null ? undefined : t;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ── Historical Rainfall ─────────────────────────────────────────── */}
      <div>
        <PanelHeader
          title="HISTORICAL RAINFALL · OPEN-METEO"
          ageMinutes={rainfallAge}
          fallbackTier={panelFallbackTier(rainfallFallback)}
          source={rainfallSource}
        />

        {annualSummaries.length > 0 ? (
          <>
            {/* Annual totals bar chart */}
            <div style={{ marginBottom: 10 }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>ANNUAL TOTALS (mm)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {annualSummaries.slice(-10).map((a) => {
                  const isMax = a.totalMm === maxAnnualTotal;
                  return (
                    <div key={a.year} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="mono" style={{ width: 32, fontSize: "0.65rem", color: "var(--ink-mid)" }}>
                        {a.year}
                      </div>
                      <div style={{ flex: 1 }}>
                        <BarChart
                          value={a.totalMm}
                          max={maxAnnualTotal}
                          color={isMax ? "var(--bad)" : "var(--data)"}
                        />
                      </div>
                      <div className="mono" style={{ width: 52, fontSize: "0.65rem", textAlign: "right", color: isMax ? "var(--bad)" : "var(--ink)" }}>
                        {Math.round(a.totalMm)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key stats row */}
            <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              {[
                { label: "PERIOD", value: rainfall ? `${rainfall.startYear}–${rainfall.endYear}` : "—" },
                { label: "ALL-TIME MAX", value: maxDailyAllTime ? `${Math.round(maxDailyAllTime.val)} mm` : "—", note: maxDailyAllTime ? `(${maxDailyAllTime.year})` : "" },
                { label: "WET SEASON", value: rainfall?.wetSeasonAvgMm != null ? `${Math.round(rainfall.wetSeasonAvgMm * 10) / 10} mm/d` : "—", note: "May–Oct avg" },
                { label: "DRY SEASON", value: rainfall?.drySeasonAvgMm != null ? `${Math.round(rainfall.drySeasonAvgMm * 10) / 10} mm/d` : "—", note: "Nov–Apr avg" },
              ].map((s) => (
                <div key={s.label} style={{ flex: 1 }}>
                  <div className="eyebrow">{s.label}</div>
                  <div className="mono" style={{ fontSize: "0.72rem", color: "var(--ink)" }}>{s.value}</div>
                  {s.note && <div className="mono" style={{ fontSize: "0.6rem", color: "var(--ink-low)" }}>{s.note}</div>}
                </div>
              ))}
            </div>

            {/* Monthly normals */}
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>MONTHLY AVERAGES (mm)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 2 }}>
                {monthlyNormals.slice(0, 12).map((m) => {
                  const pct = maxMonthlyAvg > 0 ? ((m.avgMm ?? 0) / maxMonthlyAvg) * 100 : 0;
                  const isWet = m.month >= 5 && m.month <= 10;
                  return (
                    <div key={m.month} style={{ textAlign: "center", padding: "2px 1px" }}>
                      <div className="mono" style={{ fontSize: "0.55rem", color: "var(--ink-low)" }}>{MONTH_LABELS_TH[m.month - 1]}</div>
                      <div style={{ height: 18, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                        <div
                          style={{
                            width: 10,
                            height: `${Math.max(pct, 4)}%`,
                            background: isWet ? "var(--data)" : "var(--rule)",
                            borderRadius: "2px 2px 0 0",
                          }}
                        />
                      </div>
                      <div className="mono" style={{ fontSize: "0.55rem", color: "var(--ink)" }}>
                        {m.avgMm != null ? Math.round(m.avgMm) : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="mono" style={{ color: "var(--text-3)", fontSize: "0.8rem" }}>
            No rainfall data available
          </div>
        )}
      </div>

      {/* ── UNOSAT 2021 Exposure ────────────────────────────────────────── */}
      {unosat && (
        <div>
          <PanelHeader
            title="UNOSAT 2021 POPULATION EXPOSURE"
            ageMinutes={unosatAge}
            fallbackTier={panelFallbackTier(unosatFallback)}
            source={unosatSource}
          />
          {/* National summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            {[
              { label: "POP. EXPOSED", value: fmtN(unosat.national.totalPopExposed, 0, "") },
              { label: "FLOODED KM²", value: fmtN(unosat.national.totalFloodedKm2, 1, " km²") },
              { label: "HHs AFFECTED", value: fmtN(unosat.national.totalHouseholds, 0, "") },
            ].map((s) => (
              <div key={s.label}>
                <div className="eyebrow">{s.label}</div>
                <div className="mono" style={{ fontSize: "0.85rem", color: "var(--bad)", fontWeight: 600 }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Top affected provinces */}
          <div className="eyebrow" style={{ marginBottom: 4 }}>TOP AFFECTED PROVINCES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {topProvinces.map((p, i) => (
              <div key={p.provCode} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div className="mono" style={{ width: 14, fontSize: "0.6rem", color: "var(--ink-low)", textAlign: "right" }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink)" }}>
                      {p.provT} / {p.provE}
                    </span>
                    <SeverityBadge severity={p} />
                  </div>
                  <BarChart
                    value={p.totalPopExposed}
                    max={topProvinces[0]?.totalPopExposed ?? 1}
                    color={i === 0 ? "var(--bad)" : i < 3 ? "var(--warn)" : "var(--data)"}
                  />
                </div>
                <div className="mono" style={{ fontSize: "0.65rem", color: "var(--ink-mid)", width: 60, textAlign: "right" }}>
                  {p.totalPopExposed.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="mono" style={{ fontSize: "0.6rem", color: "var(--ink-low)", marginTop: 6 }}>
            UNOSAT Thailand 2021 SW Monsoon · {unosat.national.eventStartDate} – {unosat.national.eventEndDate}
          </div>
        </div>
      )}

      {/* ── Flood Cause Breakdown ──────────────────────────────────────── */}
      <div>
        <PanelHeader title="FLOOD CAUSE ANALYSIS" source="HII/DPM synthesis" />
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          Primary drivers of flood events in Nakhon Si Thammarat (literature synthesis)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {FLOOD_CAUSES.map((c) => (
            <div key={c.cause}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <div>
                  <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink)" }}>{c.cause}</span>
                  <span className="mono" style={{ fontSize: "0.65rem", color: "var(--ink-low)", marginLeft: 6 }}>{c.causeTh}</span>
                </div>
                <span className="mono" style={{ fontSize: "0.72rem", color: c.color, fontWeight: 600 }}>
                  {c.pct}%
                </span>
              </div>
              <BarChart value={c.pct} max={100} color={c.color} />
            </div>
          ))}
        </div>
        <div className="mono" style={{ fontSize: "0.6rem", color: "var(--ink-low)", marginTop: 8 }}>
          Sources: HII MMS flood survey 2025 · DDPM situation reports · UNOSAT Thailand 2021 · Thai Meteorological Department
        </div>
      </div>

      {/* ── National Flood-Prone Summary ───────────────────────────────── */}
      {floodProneSummary && (
        <div>
          <PanelHeader
            title="NATIONAL FLOOD-PRONE AREAS"
            source="data.go.th + HII 17-yr"
          />
          {floodProneSummary.fp && (
            <div style={{ marginBottom: 8 }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>data.go.th PROVINCIAL FLOOD-PRONE ({floodProneSummary.fp.totalRecords} records)</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(floodProneSummary.fp.byRiskLevel).map(([label, count]) => {
                  const color =
                    label.includes("สูง") ? "var(--bad)" :
                    label.includes("ปาน") ? "var(--warn)" :
                    "var(--good)";
                  return (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                      <span className="mono" style={{ fontSize: "0.7rem", color: "var(--ink)" }}>{label}</span>
                      <span className="mono" style={{ fontSize: "0.7rem", color: "var(--ink-mid)" }}>({count})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {floodProneSummary.hii && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>
                HII 17-YEAR TAMBON RISK ({floodProneSummary.hii.totalTambonRecords.toLocaleString()} ตำบล)
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(floodProneSummary.hii.byRisk).map(([label, count]) => {
                  const color =
                    label.includes("สูง") ? "var(--bad)" :
                    label.includes("ปาน") ? "var(--warn)" :
                    "var(--good)";
                  return (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                      <span className="mono" style={{ fontSize: "0.7rem", color: "var(--ink)" }}>{label}</span>
                      <span className="mono" style={{ fontSize: "0.7rem", color: "var(--ink-mid)" }}>({count.toLocaleString()} ตำบล)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
