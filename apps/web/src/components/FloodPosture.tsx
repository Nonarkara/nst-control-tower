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
import { MixedText } from "./MixedText";
import { LADDER, computePosture, leadSignal, SOIL_PRIMED, type Level } from "../lib/floodPosture";
import { leadTimeToCity, CELERITY_MIN_MS, CELERITY_MAX_MS } from "../lib/watershed";
import { STATUS, type StatusLevel } from "../lib/status";

interface Props {
  waterGauges: WaterGauge[];
  rainfall: RainfallStation[];
  ews?: EwsStation[];
  dam: DamStatus | null;
  precip: PrecipNowcast | null;
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
}

// DWR EWS official status (0-3) → shared status + bilingual label.
const EWS_STATUS: Record<0 | 1 | 2 | 3, { th: string; en: string; level: StatusLevel }> = {
  0: { th: "เฝ้าระวังปกติ", en: "NORMAL", level: "normal" },
  1: { th: "เฝ้าระวัง", en: "WATCH", level: "watch" },
  2: { th: "เตรียมพร้อม", en: "PREPARE", level: "warning" },
  3: { th: "วิกฤติ", en: "CRITICAL", level: "critical" },
};

const LEVELS: Level[] = [1, 2, 3, 4, 5];

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
  const stepStatus = STATUS[step.status];
  const lead = leadSignal(precip, posture.risingCount);
  const ewsStat = EWS_STATUS[posture.worstEwsStatus];
  const ewsStatus = STATUS[ewsStat.level];
  // Auditable lead-time estimate: how far ahead the Tha Dee source (คีรีวง) leads
  // the city, from channel distance ÷ a labelled flood-wave celerity band.
  const leadKW = leadTimeToCity("khiri-wong");

  return (
    <section className="panel" aria-label="Flood posture decision support">
      <PanelHeader
        title="FLOOD POSTURE // DECISION SUPPORT"
        source="synthesis · jma/jaxa ladder"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        actions={
          <span
            className="flood-tag"
            title="A derived guidance level computed from live feeds on the JMA/JAXA ladder — not a live gauge reading or an official order."
          >
            MODELLED
          </span>
        }
      />

      {!hasData ? (
        <p className="flood-empty">Awaiting gauge + rainfall feeds to compute posture.</p>
      ) : (
        <>
          {/* Current level — the headline */}
          <div className="flood-posture-level" style={{ borderColor: stepStatus.color }}>
            <div className="flood-posture-level__row">
              <span className="flood-posture-level__num flood-status" style={{ color: stepStatus.color }}>
                <span aria-hidden="true">{stepStatus.glyph}</span>
                <span><span className="visually-hidden">Level </span>L{posture.level}</span>
              </span>
              <div className="flood-posture-level__name">
                <span className="flood-posture-level__title" style={{ color: stepStatus.color }}>
                  <span lang="th">{step.th}</span> · {step.en}
                </span>
                <span className="flood-meta">{step.issuer}</span>
              </div>
            </div>
            <p className="flood-posture-action">
              <span aria-hidden="true">▸ </span>{step.action}
            </p>
          </div>

          {/* 5-step ladder strip */}
          <div
            className="flood-posture-ladder"
            role="img"
            aria-label={`Alert ladder: level ${posture.level} of 5, ${step.en}`}
          >
            {LEVELS.map((lv) => {
              const on = lv <= posture.level;
              const here = lv === posture.level;
              return (
                <span
                  key={lv}
                  title={`${LADDER[lv].en} — ${LADDER[lv].action}`}
                  className={`flood-posture-step${here ? " is-here" : ""}`}
                  style={on ? { background: stepStatus.color } : undefined}
                />
              );
            })}
          </div>

          {/* Drivers — why this level (precautionary transparency) */}
          <div className="flood-section">
            <p className="flood-label">Drivers</p>
            <p className="flood-posture-body">
              <MixedText text={posture.drivers.join(" · ")} />
            </p>
          </div>

          {/* Signal grid */}
          <dl className="flood-stats flood-stats--2">
            <div className="flood-stat">
              <dt className="flood-label">Lead signal</dt>
              <dd className="flood-value">{lead}</dd>
              <dd className="flood-meta">
                {leadKW
                  ? <><span lang="th">คีรีวง</span> → city ≈ {leadKW.minH.toFixed(1)}–{leadKW.maxH.toFixed(1)} h (est. @ {CELERITY_MIN_MS}–{CELERITY_MAX_MS} m/s)</>
                  : "upland rain leads city by hours"}
              </dd>
            </div>
            <div className="flood-stat">
              <dt className="flood-label">River state</dt>
              <dd className="flood-value">
                {posture.overbankCount > 0
                  ? `${posture.overbankCount} overbank`
                  : posture.worstSit >= 4
                    ? "high water"
                    : "within banks"}
              </dd>
              <dd className="flood-meta num">
                {posture.risingCount} rising · max {Math.round(posture.rain24hMax)} mm/24h
              </dd>
            </div>
          </dl>

          {/* Upland flash-flood watch — DWR EWS (Khao Luang headwaters) */}
          {ews.length > 0 && (
            <div className="flood-posture-upland">
              <div className="flood-row-head">
                <p className="flood-label">Upland flash-flood</p>
                <span className="flood-status" style={{ color: ewsStatus.color }}>
                  <span aria-hidden="true">{ewsStatus.glyph}</span>
                  <span lang="th">{ewsStat.th}</span> {ewsStat.en}
                </span>
              </div>
              <p className="flood-meta num">
                {ews.length} DWR EWS stations
                {posture.maxSoil != null ? ` · soil max ${Math.round(posture.maxSoil)}%` : ""}
                {posture.primedCount > 0 ? ` · ${posture.primedCount} primed` : ""}
              </p>
              {topUpland.length > 0 && (
                <>
                  <ul className="flood-list">
                    {topUpland.map((s) => {
                      const primed = (s.soilMoisture ?? 0) >= SOIL_PRIMED;
                      return (
                        <li key={s.id} className="flood-posture-slope">
                          <span className="flood-name"><MixedText text={s.amphoe || s.name} /></span>
                          {s.rain12h != null && s.rain12h > 0 && (
                            <span className="flood-meta num">{Math.round(s.rain12h)}mm/12h</span>
                          )}
                          {primed ? (
                            <span className="flood-status num" style={{ color: STATUS.watch.color }}>
                              <span aria-hidden="true">{STATUS.watch.glyph}</span>
                              {Math.round(s.soilMoisture ?? 0)}%
                              <span className="visually-hidden"> soil, primed</span>
                            </span>
                          ) : (
                            <span className="flood-posture-soil num">
                              {Math.round(s.soilMoisture ?? 0)}%<span className="visually-hidden"> soil</span>
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="flood-meta">soil ≥ {SOIL_PRIMED}% + rain = flash-flood primed</p>
                </>
              )}
            </div>
          )}

          {/* Runoff context */}
          {dam && (
            <p className="flood-meta">
              Khao Luang runoff {dam.status.toUpperCase()}
              {dam.outflowCms != null ? ` · outflow ${Math.round(dam.outflowCms)} m³/s` : ""}
              {" "}— rising outflow precedes city flooding
            </p>
          )}

          {/* Methodology — honest provenance */}
          <p className="flood-footnote">
            Decision support, not an official order. Composite of observed river
            state + forecast rain on the JMA evacuation ladder (act by L4),
            cross-walked to JAXA Today's Earth return-period levels. SE-Asia
            climate context: a former 1-in-100-yr flood now recurs roughly every
            2–25 yr (Hirabayashi et al. 2013).
          </p>
        </>
      )}
    </section>
  );
}
