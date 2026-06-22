/**
 * FloodPosture — decision-support synthesis for the FLOOD lens.
 *
 * Most flood panels show raw data; municipalities say the gap is the step
 * *after* the data — "what do we DO?" (Cao et al. 2024, "Current status and
 * Challenges in Operating Flood Early Warning Systems at the local level in
 * Japan", IJDRR — the "decision-support gap"). This panel closes that gap by
 * fusing the live signals NST already collects into a single staged
 * municipal alert level and the action it warrants.
 *
 * Method, grounded in the Japan-ASEAN Flood Roundtable (SIWW, 15 Jun 2026):
 *  • 5-level alert ladder — the JMA evacuation scale (Levels 1-2 advisory,
 *    3 evacuate-vulnerable, 4 evacuation order, 5 emergency) cross-walked to
 *    JAXA "Today's Earth" return-period flood-risk levels.
 *  • Composite trigger — like Okazaki City's Yahagi River plan, the level is
 *    driven by BOTH observed river state AND forecast rainfall, not one alone.
 *  • Upland weighting — the actionable signal arrives upstream (Khao Luang)
 *    hours before the city floods (Iligan "Project Daloy" lesson).
 *  • Precautionary bias — ~76% of municipalities prioritise avoiding a missed
 *    event over a false alarm (Cao 2024); ties break upward.
 *
 * Everything is derived from live feeds (ThaiWater gauges, rainfall, runoff,
 * precip nowcast). It is decision *support* — not an official evacuation order.
 */

import { useMemo } from "react";
import type {
  WaterGauge,
  DamStatus,
  PrecipNowcast,
  RainfallStation,
  EwsStation,
  FallbackTier,
} from "@nst/shared";
import { PanelHeader } from "./PanelHeader";
import { LADDER, computePosture, leadSignal, SOIL_PRIMED, type Level } from "../lib/floodPosture";

interface Props {
  waterGauges: WaterGauge[];
  rainfall: RainfallStation[];
  ews?: EwsStation[];
  dam: DamStatus | null;
  precip: PrecipNowcast | null;
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
}

const EWS_STATUS: Record<0 | 1 | 2 | 3, { label: string; color: string }> = {
  0: { label: "เฝ้าระวังปกติ NORMAL", color: "var(--good)" },
  1: { label: "เฝ้าระวัง WATCH", color: "var(--data)" },
  2: { label: "เตรียมพร้อม PREPARE", color: "var(--warn)" },
  3: { label: "วิกฤติ CRITICAL", color: "var(--bad)" },
};

export function FloodPosture({ waterGauges, rainfall, ews = [], dam, precip, ageMinutes, fallbackTier }: Props) {
  const posture = useMemo(
    () => computePosture(waterGauges, rainfall, precip, ews),
    [waterGauges, rainfall, precip, ews],
  );

  // Top upland slopes by soil saturation — the flash-flood precursor.
  const topUpland = useMemo(
    () =>
      [...ews]
        .filter((s) => s.soilMoisture != null)
        .sort((a, b) => (b.soilMoisture ?? 0) - (a.soilMoisture ?? 0))
        .slice(0, 3),
    [ews],
  );

  const hasData = waterGauges.length > 0 || rainfall.length > 0 || ews.length > 0;
  const step = LADDER[posture.level];
  const lead = leadSignal(precip, posture.risingCount);
  const ewsStat = EWS_STATUS[posture.worstEwsStatus];

  return (
    <div className="col" style={{ gap: 8 }}>
      <PanelHeader
        title="FLOOD POSTURE // DECISION SUPPORT"
        source="synthesis · jma/jaxa ladder"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
      />

      {!hasData ? (
        <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
          Awaiting gauge + rainfall feeds to compute posture.
        </div>
      ) : (
        <>
          {/* Current level — the headline */}
          <div
            style={{
              border: `1px solid ${step.color}`,
              borderLeft: `3px solid ${step.color}`,
              padding: "8px 10px",
              background: "var(--bg-2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span className="mono" style={{ fontSize: "1.5rem", fontWeight: 700, color: step.color }}>
                L{posture.level}
              </span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span className="mono" style={{ fontSize: "0.86rem", color: step.color, fontWeight: 600 }}>
                  {step.th} · {step.en}
                </span>
                <span className="eyebrow mono" style={{ color: "var(--text-3)" }}>
                  {step.issuer}
                </span>
              </div>
            </div>
            <div style={{ fontSize: "var(--size-eyebrow)", color: "var(--text-2)", marginTop: 4, lineHeight: 1.4 }}>
              ▸ {step.action}
            </div>
          </div>

          {/* 5-step ladder strip */}
          <div style={{ display: "flex", gap: 3 }}>
            {([1, 2, 3, 4, 5] as Level[]).map((lv) => {
              const on = lv <= posture.level;
              const here = lv === posture.level;
              return (
                <div
                  key={lv}
                  title={`${LADDER[lv].en} — ${LADDER[lv].action}`}
                  style={{
                    flex: 1,
                    height: 6,
                    background: on ? LADDER[posture.level].color : "var(--line)",
                    opacity: on ? (here ? 1 : 0.55) : 0.3,
                    borderRadius: 1,
                  }}
                />
              );
            })}
          </div>

          {/* Drivers — why this level (precautionary transparency) */}
          <div>
            <div className="eyebrow">DRIVERS</div>
            <div style={{ fontSize: "var(--size-eyebrow)", color: "var(--text-2)", lineHeight: 1.5 }}>
              {posture.drivers.join(" · ")}
            </div>
          </div>

          {/* Signal grid */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div className="eyebrow">LEAD SIGNAL</div>
              <div className="mono" style={{ fontSize: "0.82rem" }}>{lead}</div>
              <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
                upland rain leads city by hours
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="eyebrow">RIVER STATE</div>
              <div className="mono" style={{ fontSize: "0.82rem" }}>
                {posture.overbankCount > 0
                  ? `${posture.overbankCount} overbank`
                  : posture.worstSit >= 4
                    ? "high water"
                    : "within banks"}
              </div>
              <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
                {posture.risingCount} rising · max {Math.round(posture.rain24hMax)} mm/24h
              </div>
            </div>
          </div>

          {/* Upland flash-flood watch — DWR EWS (Khao Luang headwaters) */}
          {ews.length > 0 && (
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="eyebrow">UPLAND FLASH-FLOOD</span>
                <span className="eyebrow mono" style={{ color: ewsStat.color, marginLeft: "auto" }}>
                  {ewsStat.label}
                </span>
              </div>
              <div className="eyebrow mono" style={{ color: "var(--text-3)", marginTop: 2 }}>
                {ews.length} DWR EWS stations
                {posture.maxSoil != null ? ` · soil max ${Math.round(posture.maxSoil)}%` : ""}
                {posture.primedCount > 0 ? ` · ${posture.primedCount} primed` : ""}
              </div>
              {topUpland.length > 0 && (
                <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                  {topUpland.map((s) => {
                    const primed = (s.soilMoisture ?? 0) >= SOIL_PRIMED;
                    return (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="eyebrow mono" style={{ color: "var(--text-3)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.amphoe || s.name}
                        </span>
                        {s.rain12h != null && s.rain12h > 0 && (
                          <span className="eyebrow mono" style={{ color: "var(--text-3)" }}>
                            {Math.round(s.rain12h)}mm/12h
                          </span>
                        )}
                        <span
                          className="mono"
                          style={{ fontSize: "0.72rem", color: primed ? "var(--warn)" : "var(--text-2)", fontWeight: primed ? 600 : 400 }}
                        >
                          {Math.round(s.soilMoisture ?? 0)}%
                        </span>
                      </div>
                    );
                  })}
                  <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
                    soil ≥ {SOIL_PRIMED}% + rain = flash-flood primed
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Runoff context */}
          {dam && (
            <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
              Khao Luang runoff {dam.status.toUpperCase()}
              {dam.outflowCms != null ? ` · outflow ${Math.round(dam.outflowCms)} m³/s` : ""}
              {" "}— rising outflow precedes city flooding
            </div>
          )}

          {/* Methodology — honest provenance */}
          <div
            className="eyebrow mono"
            style={{ color: "var(--text-3)", marginTop: 4, lineHeight: 1.5, borderTop: "1px solid var(--line)", paddingTop: 6 }}
          >
            Decision support, not an official order. Composite of observed river
            state + forecast rain on the JMA evacuation ladder (act by L4),
            cross-walked to JAXA Today's Earth return-period levels. SE-Asia
            climate context: a former 1-in-100-yr flood now recurs roughly every
            2–25 yr (Hirabayashi et al. 2013).
          </div>
        </>
      )}
    </div>
  );
}
