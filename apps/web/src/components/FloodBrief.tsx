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

interface Props {
  gauges: FloodGauge[];
  waterGauges?: WaterGauge[];
  dam: DamStatus | null;
  precip: PrecipNowcast | null;
  floodRiskFeatures: Array<Feature<Polygon | MultiPolygon, Record<string, unknown>>> | null;
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
}

const GAUGE_STATUS_COLOR: Record<FloodGauge["status"], string> = {
  normal: "var(--good)",
  watch: "var(--warn)",
  warning: "var(--warn)",
  flood: "var(--bad)",
  unknown: "var(--text-3)",
};

const GAUGE_RANK: Record<FloodGauge["status"], number> = {
  normal: 0,
  watch: 1,
  warning: 2,
  flood: 3,
  unknown: -1,
};

const DAM_STATUS_COLOR: Record<DamStatus["status"], string> = {
  low: "var(--data)",
  normal: "var(--good)",
  high: "var(--warn)",
  spilling: "var(--bad)",
  unknown: "var(--text-3)",
};

const INTENSITY_COLOR: Record<PrecipNowcast["intensity"], string> = {
  dry: "var(--good)",
  light: "var(--data)",
  moderate: "var(--warn)",
  heavy: "var(--bad)",
};

function fmt(n: number | null | undefined, digits = 1, unit = ""): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(digits)}${unit}`;
}

// situation_level 1-5 from ThaiWater → FloodGauge status
const SIT_TO_STATUS: Record<number, FloodGauge["status"]> = {
  5: "flood", 4: "warning", 3: "normal", 2: "watch", 1: "watch",
};

const SIT_COLOR: Record<number, string> = {
  5: "var(--bad)", 4: "var(--warn)", 3: "var(--good)", 2: "var(--data)", 1: "var(--data)",
};

const SIT_LABEL: Record<number, string> = {
  5: "น้ำล้นตลิ่ง FLOOD", 4: "น้ำมาก HIGH", 3: "ปกติ NORMAL", 2: "น้ำน้อย LOW", 1: "ภัยแล้ง DROUGHT",
};

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

  return (
    <div className="col flood-brief">
      <PanelHeader
        title="FLOOD BRIEF // PAK PHANANG / THA DEE"
        source={useThaiWater ? "thaiwater.hii · open-meteo" : "open-meteo gloFAS"}
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
      />

      {/* River gauge status — ThaiWater real telemetry preferred */}
      <div className="flood-row" style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">RIVER GAUGE</div>
          {useThaiWater && worstThaiWater ? (
            <>
              <div className="mono" style={{ color: SIT_COLOR[worstThaiWater.situationLevel], fontSize: "0.9rem" }}>
                {SIT_LABEL[worstThaiWater.situationLevel]}
              </div>
              <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
                {worstThaiWater.name.replace(/^สถานีโทรมาตร\s*/u, "")}
                {worstThaiWater.levelMsl != null ? ` · ${worstThaiWater.levelMsl.toFixed(2)} m MSL` : ""}
                {worstThaiWater.warningMsl != null ? ` / warn ${worstThaiWater.warningMsl.toFixed(1)}` : ""}
              </div>
            </>
          ) : worstGauge ? (
            <>
              <div className="mono" style={{ color: GAUGE_STATUS_COLOR[worstGauge.status], fontSize: "0.9rem" }}>
                {worstGauge.status.toUpperCase()}
              </div>
              <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
                {worstGauge.name} · {fmt(worstGauge.levelM, 2, " m")}
              </div>
            </>
          ) : (
            <div className="mono eyebrow" style={{ color: "var(--text-3)" }}>no gauge feed</div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">GAUGES</div>
          <div className="mono" style={{ fontSize: "0.9rem" }}>
            {useThaiWater ? waterGauges.length : gauges.length || "—"}
          </div>
          <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
            {useThaiWater
              ? `${waterGauges.filter((g) => g.situationLevel >= 4).length} above warning`
              : `${gauges.filter((g) => g.status === "warning" || g.status === "flood").length} above warning`}
          </div>
        </div>
      </div>

      {/* Khao Luang runoff */}
      <div className="flood-row" style={{ display: "flex", gap: 12, marginTop: 10 }}>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">KHAO LUANG RUNOFF</div>
          <div className="mono" style={{ color: dam ? DAM_STATUS_COLOR[dam.status] : "var(--text-3)", fontSize: "0.9rem" }}>
            {dam ? dam.status.toUpperCase() : "—"}
          </div>
          <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
            storage {fmt(dam?.storagePct, 0, "%")}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">OUTFLOW</div>
          <div className="mono" style={{ fontSize: "0.9rem" }}>{fmt(dam?.outflowCms, 0, " m³/s")}</div>
          <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
            rising outflow precedes city flooding
          </div>
        </div>
      </div>

      {/* Rainfall nowcast */}
      <div className="flood-row" style={{ display: "flex", gap: 12, marginTop: 10 }}>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">RAIN NOW</div>
          <div
            className="mono"
            style={{ color: precip ? INTENSITY_COLOR[precip.intensity] : "var(--text-3)", fontSize: "0.9rem" }}
          >
            {fmt(precip?.nowMm, 1, " mm")}
          </div>
          <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
            {precip ? precip.intensity.toUpperCase() : "—"}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">NEXT 2H</div>
          <div className="mono" style={{ fontSize: "0.9rem" }}>{fmt(precip?.total2hMm, 1, " mm")}</div>
          <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
            {precip?.minutesToSignificant != null ? `rain in ~${precip.minutesToSignificant} min` : "no rain forecast"}
          </div>
        </div>
      </div>

      {/* Household exposure — city headline, basin total as context */}
      {cityHouseholds != null && (
        <div style={{ marginTop: 10 }}>
          <div className="eyebrow">FLOOD-RISK EXPOSURE · CITY</div>
          <div className="mono" style={{ fontSize: "1.0rem", color: "var(--warn)" }}>
            ~{cityHouseholds.toLocaleString()} households
          </div>
          <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
            Old Town / city low-lying zone · reference
          </div>
          {provinceHouseholds != null && (
            <div className="eyebrow mono" style={{ color: "var(--text-3)", marginTop: 4 }}>
              ~{provinceHouseholds.toLocaleString()} across {floodRiskFeatures?.length ?? 0} NST basin zones (provincial)
            </div>
          )}
        </div>
      )}

      <div className="eyebrow mono" style={{ color: "var(--text-3)", marginTop: 8 }}>
        {useThaiWater
          ? `HII ThaiWater · ${waterGauges.length} stations · PAK PHANANG / THA DEE basin`
          : "Open-Meteo GloFAS discharge proxy · PAK PHANANG / THA DEE"
        }{" "}— flood is NST's headline risk
      </div>
    </div>
  );
}
