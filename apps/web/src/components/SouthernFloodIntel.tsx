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
import { STATUS } from "../lib/status";
import { StatusText, dischargeStatus, floodWatchStatus, statusStyle } from "../lib/cityStatus";

interface Props {
  risk: SouthernFloodRiskFeed | null;
  rivers: SouthernRiverCascadeFeed | null;
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
}

const WATCH_LABEL: Record<FloodWatchBand, { th: string; en: string }> = {
  normal: { th: "ปกติ", en: "NORMAL" },
  watch: { th: "เฝ้าระวัง", en: "WATCH" },
  elevated: { th: "เสี่ยงสูง", en: "ELEVATED" },
  high: { th: "วิกฤต", en: "CRITICAL" },
};

const DISCHARGE_LABEL: Record<RiverDischargeBand, string> = {
  normal: "normal",
  watch: "watch",
  warning: "warning",
  emergency: "emergency",
  unknown: "no data",
};

function fmtMm(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(0)} mm`;
}

function fmtCms(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(0)} m³/s`;
}

function WatchLabel({ band }: { band: FloodWatchBand }) {
  return (
    <StatusText level={floodWatchStatus(band)}>
      <span lang="th">{WATCH_LABEL[band].th}</span> {WATCH_LABEL[band].en}
    </StatusText>
  );
}

function RankGlyph({ level, label }: { level: ReturnType<typeof floodWatchStatus>; label: string }) {
  return (
    <span className="pc-glyph" style={statusStyle(level)}>
      <span aria-hidden="true">{STATUS[level].glyph}</span>
      <span className="visually-hidden">{label}</span>
    </span>
  );
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
    <section className="panel" aria-label="Southern flood intelligence" aria-busy={!hasData}>
      <PanelHeader
        title="SOUTHERN FLOOD INTEL"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="flooddash · dr.non"
      />

      {!hasData && <p className="note">Southern analytics loading — ThaiWater + GloFAS</p>}

      {hasData && (
        <>
          <dl className="pc-stats">
            <div>
              <dt><span lang="th">ภาคใต้</span> Region</dt>
              <dd><WatchLabel band={regionalBand} /></dd>
            </div>
            {nstProvince && (
              <div>
                <dt><span lang="th">นครศรี</span> NST</dt>
                <dd>
                  <span className="num">{nstProvince.score}</span>
                  <WatchLabel band={nstProvince.band} />
                </dd>
              </div>
            )}
            {risk?.summary.worstRain && (
              <div>
                <dt><span lang="th">ฝนสูงสุด</span> Max rain</dt>
                <dd>
                  <span className="num">{fmtMm(risk.summary.worstRain.mm)}</span>
                  <span className="pc-stats__sub" lang="th">{risk.summary.worstRain.provinceTh}</span>
                </dd>
              </div>
            )}
          </dl>

          {topProvinces.length > 0 && (
            <div className="pc-section">
              <h3 className="pc-label">Province watch ranking</h3>
              <ul className="pc-list">
                {topProvinces.map((p) => (
                  <li key={p.provinceCode} className="sfi-rank">
                    <RankGlyph level={floodWatchStatus(p.band)} label={`${WATCH_LABEL[p.band].en}: `} />
                    <span className="sfi-rank__name" lang="th">{p.provinceTh}</span>
                    <span className="sfi-rank__score num">{p.score}</span>
                    <span className="sfi-rank__meta num">
                      {WATCH_LABEL[p.band].en.toLowerCase()} · {p.maxRain24h != null ? fmtMm(p.maxRain24h) : "—"}
                      {p.stationsL5 > 0 ? ` · L5×${p.stationsL5}` : p.stationsL4 > 0 ? ` · L4×${p.stationsL4}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {rivers && rivers.reaches.length > 0 && (
            <div className="pc-section">
              <h3 className="pc-label">Southern river discharge (GloFAS)</h3>
              <ul className="pc-list">
                {(risingReaches.length > 0 ? risingReaches : rivers.reaches.slice(0, 4)).map((r) => (
                  <li key={r.id} className="sfi-rank">
                    <RankGlyph level={dischargeStatus(r.band)} label={`${DISCHARGE_LABEL[r.band]}: `} />
                    <span className="sfi-rank__name">{r.nameEn}</span>
                    <span className="sfi-rank__score num">{fmtCms(r.discharge)}</span>
                    <span className="sfi-rank__meta num">
                      {DISCHARGE_LABEL[r.band]} · {r.trend !== "unknown" ? r.trend : "—"}
                      {r.forecastPeak != null ? ` · peak ${fmtCms(r.forecastPeak)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="pc-meta">
            Flooddash watch index — live observations + forecast heuristic, not an official evacuation order.
          </p>
        </>
      )}
    </section>
  );
}
