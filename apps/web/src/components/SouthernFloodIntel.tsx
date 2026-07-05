/**
 * SouthernFloodIntel — Flooddash analytics for southern Thailand.
 *
 * Ported from ~/Flooddash: province watch scores (live ThaiWater + Open-Meteo)
 * and GloFAS river cascade for Hat Yai, Tapi, Pattani, Tha Dee, Pak Phanang.
 * Complements NST-local FloodPosture with peninsula-wide situational awareness.
 */

import { useMemo } from "react";
import type {
  FallbackTier,
  SouthernFloodRiskFeed,
  SouthernRiverCascadeFeed,
  FloodWatchBand,
  RiverDischargeBand,
} from "@nst/shared";
import { PanelHeader } from "./PanelHeader";

interface Props {
  risk: SouthernFloodRiskFeed | null;
  rivers: SouthernRiverCascadeFeed | null;
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
}

const WATCH_COLOR: Record<FloodWatchBand, string> = {
  normal: "var(--good)",
  watch: "var(--data)",
  elevated: "var(--warn)",
  high: "var(--bad)",
};

const WATCH_LABEL: Record<FloodWatchBand, string> = {
  normal: "ปกติ NORMAL",
  watch: "เฝ้าระวัง WATCH",
  elevated: "เสี่ยงสูง ELEVATED",
  high: "วิกฤต CRITICAL",
};

const DISCHARGE_COLOR: Record<RiverDischargeBand, string> = {
  normal: "var(--good)",
  watch: "var(--data)",
  warning: "var(--warn)",
  emergency: "var(--bad)",
  unknown: "var(--ink-low)",
};

function fmtMm(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(0)} mm`;
}

function fmtCms(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(0)} m³/s`;
}

export function SouthernFloodIntel({ risk, rivers, ageMinutes, fallbackTier }: Props) {
  const topProvinces = useMemo(
    () => (risk?.provinces ?? []).filter((p) => p.band !== "normal").slice(0, 6),
    [risk],
  );

  const nstProvince = useMemo(
    () => (risk?.provinces ?? []).find((p) => p.provinceCode === "80"),
    [risk],
  );

  const risingReaches = useMemo(
    () => (rivers?.reaches ?? []).filter((r) => r.trend === "rising" || r.band === "emergency" || r.band === "warning"),
    [rivers],
  );

  const hasData = !!risk?.provinces.length || !!rivers?.reaches.length;
  const regionalBand = risk?.summary.regionalBand ?? "normal";

  return (
    <section className="panel-section" aria-label="Southern flood intelligence">
      <PanelHeader
        title="SOUTHERN FLOOD INTEL"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="flooddash-south-risk · flooddash-south-rivers"
      />

      {!hasData && (
        <p className="panel-empty">Southern analytics loading — ThaiWater + GloFAS</p>
      )}

      {hasData && (
        <>
          <div className="kpi-row" style={{ marginBottom: "0.75rem" }}>
            <div className="kpi-chip">
              <span className="kpi-label">ภาคใต้ REGION</span>
              <span className="kpi-value" style={{ color: WATCH_COLOR[regionalBand] }}>
                {WATCH_LABEL[regionalBand]}
              </span>
            </div>
            {nstProvince && (
              <div className="kpi-chip">
                <span className="kpi-label">นครศรี NST</span>
                <span className="kpi-value" style={{ color: WATCH_COLOR[nstProvince.band] }}>
                  {nstProvince.score} · {WATCH_LABEL[nstProvince.band]}
                </span>
              </div>
            )}
            {risk?.summary.worstRain && (
              <div className="kpi-chip">
                <span className="kpi-label">ฝนสูงสุด MAX RAIN</span>
                <span className="kpi-value">
                  {risk.summary.worstRain.provinceTh} {fmtMm(risk.summary.worstRain.mm)}
                </span>
              </div>
            )}
          </div>

          {topProvinces.length > 0 && (
            <div className="panel-block">
              <div className="eyebrow">Province watch ranking</div>
              <ul className="rank-list">
                {topProvinces.map((p) => (
                  <li key={p.provinceCode} className="rank-row">
                    <span className="rank-dot" style={{ background: WATCH_COLOR[p.band] }} />
                    <span className="rank-name">{p.provinceTh}</span>
                    <span className="rank-score">{p.score}</span>
                    <span className="rank-meta">
                      {p.maxRain24h != null ? fmtMm(p.maxRain24h) : "—"}
                      {p.stationsL5 > 0 ? ` · L5×${p.stationsL5}` : p.stationsL4 > 0 ? ` · L4×${p.stationsL4}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {rivers && rivers.reaches.length > 0 && (
            <div className="panel-block">
              <div className="eyebrow">Southern river discharge (GloFAS)</div>
              <ul className="rank-list">
                {(risingReaches.length > 0 ? risingReaches : rivers.reaches.slice(0, 4)).map((r) => (
                  <li key={r.id} className="rank-row">
                    <span className="rank-dot" style={{ background: DISCHARGE_COLOR[r.band] }} />
                    <span className="rank-name">{r.nameEn}</span>
                    <span className="rank-score">{fmtCms(r.discharge)}</span>
                    <span className="rank-meta">
                      {r.trend !== "unknown" ? r.trend : "—"}
                      {r.forecastPeak != null ? ` · peak ${fmtCms(r.forecastPeak)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="panel-note">
            Flooddash watch index — live observations + forecast heuristic, not an official evacuation order.
          </p>
        </>
      )}
    </section>
  );
}
