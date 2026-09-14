/**
 * FloodBrief — the headline-risk panel for the FLOOD lens.
 *
 * Shows:
 *  • Pak Phanang River / canal gauge status (worst-case status drives the colour)
 *  • Khao Luang runoff storage % + outflow (rising outflow precedes city flooding)
 *  • Rainfall nowcast (next 2 h) from the precip feed
 *  • Flood-risk household exposure summed from the hand-authored polygons
 *
 * All data is live where a feed exists; the household figure is reference
 * (hand-authored). Degrades gracefully when feeds are unavailable.
 */

import { useMemo } from "react";
import type { Feature, Polygon, MultiPolygon } from "geojson";
import type { FloodGauge, DamStatus, PrecipNowcast, WaterGauge, FallbackTier } from "@nst/shared";
import { PanelHeader } from "./PanelHeader";
import { situationStatus } from "../lib/water";
import { STATUS, type StatusLevel } from "../lib/status";

interface Props {
  gauges: FloodGauge[];
  waterGauges?: WaterGauge[];
  dam: DamStatus | null;
  precip: PrecipNowcast | null;
  floodRiskFeatures: Array<Feature<Polygon | MultiPolygon, Record<string, unknown>>> | null;
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
}

const GAUGE_STATUS: Record<FloodGauge["status"], StatusLevel> = {
  normal: "normal",
  watch: "watch",
  warning: "warning",
  flood: "critical",
  unknown: "unknown",
};

const GAUGE_RANK: Record<FloodGauge["status"], number> = {
  normal: 0,
  watch: 1,
  warning: 2,
  flood: 3,
  unknown: -1,
};

const DAM_STATUS: Record<DamStatus["status"], StatusLevel> = {
  low: "normal",
  normal: "normal",
  high: "warning",
  spilling: "critical",
  unknown: "unknown",
};

const INTENSITY_STATUS: Record<PrecipNowcast["intensity"], StatusLevel> = {
  dry: "normal",
  light: "watch",
  moderate: "warning",
  heavy: "critical",
};

const SIT_LABEL: Record<number, { th: string; en: string }> = {
  5: { th: "น้ำล้นตลิ่ง", en: "FLOOD" },
  4: { th: "น้ำมาก", en: "HIGH" },
  3: { th: "ปกติ", en: "NORMAL" },
  2: { th: "น้ำน้อย", en: "LOW" },
  1: { th: "ภัยแล้ง", en: "DROUGHT" },
};

function fmt(n: number | null | undefined, digits = 1, unit = ""): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(digits)}${unit}`;
}

/** Headline figure in a status colour, with the level's glyph beside it. */
function StatusValue({ level, children }: { level: StatusLevel; children: React.ReactNode }) {
  const st = STATUS[level];
  return (
    <span className="flood-status" style={{ color: st.color }}>
      <span aria-hidden="true">{st.glyph}</span>
      {children}
    </span>
  );
}

export function FloodBrief({ gauges, waterGauges = [], dam, precip, floodRiskFeatures, ageMinutes, fallbackTier }: Props) {
  // Use ThaiWater gauges (real telemetry) when available; fall back to GloFAS gauges
  const useThaiWater = waterGauges.length > 0;

  const worstGauge = useMemo(() => {
    if (!gauges.length) return null;
    return [...gauges].sort((a, b) => GAUGE_RANK[b.status] - GAUGE_RANK[a.status])[0];
  }, [gauges]);

  const worstThaiWater = useMemo(() => {
    if (!waterGauges.length) return null;
    return [...waterGauges].sort((a, b) => b.situationLevel - a.situationLevel)[0];
  }, [waterGauges]);

  // Split city-municipality exposure from the province-wide basin total. Summing
  // all 5 basin zones (~225k households) and showing it as "the city" is an
  // impossibility a 102k-population municipality's mayor catches instantly — so the
  // headline is the Old Town / city low-lying zone, with the basin total below it.
  const { cityHouseholds, provinceHouseholds } = useMemo(() => {
    if (!floodRiskFeatures?.length) return { cityHouseholds: null, provinceHouseholds: null };
    const hh = (f: typeof floodRiskFeatures[number]) => {
      const h = Number(f.properties?.households ?? 0);
      return Number.isFinite(h) ? h : 0;
    };
    const cityFeature = floodRiskFeatures.find((f) => f.properties?.id === "old-town-city-sink");
    return {
      cityHouseholds: cityFeature ? hh(cityFeature) : null,
      provinceHouseholds: floodRiskFeatures.reduce((sum, f) => sum + hh(f), 0),
    };
  }, [floodRiskFeatures]);

  const sit = worstThaiWater ? SIT_LABEL[worstThaiWater.situationLevel] : null;

  return (
    <section className="panel" aria-label="Flood brief">
      <PanelHeader
        title="FLOOD BRIEF // PAK PHANANG / THA DEE"
        source={useThaiWater ? "thaiwater.hii · open-meteo" : "open-meteo gloFAS"}
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
      />

      <dl className="flood-stats flood-stats--2">
        {/* River gauge status — ThaiWater real telemetry preferred */}
        <div className="flood-stat">
          <dt className="flood-label">River gauge</dt>
          {useThaiWater && worstThaiWater ? (
            <>
              <dd className="flood-value">
                <StatusValue level={situationStatus(worstThaiWater.situationLevel)}>
                  {sit ? <><span lang="th">{sit.th}</span> {sit.en}</> : STATUS.unknown.en}
                </StatusValue>
              </dd>
              <dd className="flood-meta">
                <span lang="th">{worstThaiWater.name.replace(/^สถานีโทรมาตร\s*/u, "")}</span>
                {worstThaiWater.levelMsl != null ? ` · ${worstThaiWater.levelMsl.toFixed(2)} m MSL` : ""}
                {worstThaiWater.warningMsl != null ? ` / warn ${worstThaiWater.warningMsl.toFixed(1)}` : ""}
              </dd>
            </>
          ) : worstGauge ? (
            <>
              <dd className="flood-value">
                <StatusValue level={GAUGE_STATUS[worstGauge.status]}>{worstGauge.status.toUpperCase()}</StatusValue>
              </dd>
              <dd className="flood-meta">{worstGauge.name} · {fmt(worstGauge.levelM, 2, " m")}</dd>
            </>
          ) : (
            <dd className="flood-empty">no gauge feed</dd>
          )}
        </div>
        <div className="flood-stat">
          <dt className="flood-label">Gauges</dt>
          <dd className="flood-value num">{useThaiWater ? waterGauges.length : gauges.length || "—"}</dd>
          <dd className="flood-meta">
            {useThaiWater
              ? `${waterGauges.filter((g) => g.situationLevel >= 4).length} above warning`
              : `${gauges.filter((g) => g.status === "warning" || g.status === "flood").length} above warning`}
          </dd>
        </div>

        {/* Khao Luang runoff */}
        <div className="flood-stat">
          <dt className="flood-label">Khao Luang runoff</dt>
          <dd className="flood-value">
            {dam ? <StatusValue level={DAM_STATUS[dam.status]}>{dam.status.toUpperCase()}</StatusValue> : "—"}
          </dd>
          <dd className="flood-meta num">storage {fmt(dam?.storagePct, 0, "%")}</dd>
        </div>
        <div className="flood-stat">
          <dt className="flood-label">Outflow</dt>
          <dd className="flood-value num">{fmt(dam?.outflowCms, 0, " m³/s")}</dd>
          <dd className="flood-meta">rising outflow precedes city flooding</dd>
        </div>

        {/* Rainfall nowcast */}
        <div className="flood-stat">
          <dt className="flood-label">Rain now</dt>
          <dd className="flood-value num">
            {precip
              ? <StatusValue level={INTENSITY_STATUS[precip.intensity]}>{fmt(precip.nowMm, 1, " mm")}</StatusValue>
              : fmt(null)}
          </dd>
          <dd className="flood-meta">{precip ? precip.intensity.toUpperCase() : "—"}</dd>
        </div>
        <div className="flood-stat">
          <dt className="flood-label">Next 2h</dt>
          <dd className="flood-value num">{fmt(precip?.total2hMm, 1, " mm")}</dd>
          <dd className="flood-meta">
            {precip?.minutesToSignificant != null ? `rain in ~${precip.minutesToSignificant} min` : "no rain forecast"}
          </dd>
        </div>
      </dl>

      {/* Household exposure — city headline, basin total as context */}
      {cityHouseholds != null && (
        <dl className="flood-stats">
          <div className="flood-stat">
            <dt className="flood-label">Flood-risk exposure · city</dt>
            <dd className="flood-value flood-value--lg num">~{cityHouseholds.toLocaleString()} households</dd>
            <dd className="flood-meta">Old Town / city low-lying zone · reference</dd>
            {provinceHouseholds != null && (
              <dd className="flood-meta">
                ~{provinceHouseholds.toLocaleString()} across {floodRiskFeatures?.length ?? 0} NST basin zones (provincial)
              </dd>
            )}
          </div>
        </dl>
      )}

      <p className="flood-footnote">
        {useThaiWater
          ? `HII ThaiWater · ${waterGauges.length} stations · PAK PHANANG / THA DEE basin`
          : "Open-Meteo GloFAS discharge proxy · PAK PHANANG / THA DEE"
        }{" "}— flood is NST's headline risk
      </p>
    </section>
  );
}
