/**
 * UpstreamWatershed — real-time water tracking along the upstream→city flow path.
 *
 * NST city floods are made upstream: the Tha Dee canal (คลองท่าดี) rises at
 * คีรีวง / ลานสกา on the Khao Luang massif and runs into the city, while ทุ่งสง
 * sits on the SW divide. This panel shows each upstream node's live river +
 * rain + soil state in flow order, so urban managers can see what is coming
 * downtown hours ahead — not just what has already arrived.
 *
 * Data: live ThaiWater gauges + rainfall (HII) and DWR EWS soil moisture,
 * grouped by lib/watershed. Degrades gracefully per node.
 */

import { useMemo } from "react";
import type { WaterGauge, RainfallStation, EwsStation, FloodGauge, FallbackTier, ZonePrecipNowcast } from "@nst/shared";
import { PanelHeader } from "./PanelHeader";
import { MixedText } from "./MixedText";
import {
  summarizeWatershed,
  leadTimeToCity,
  ZONE_STATUS_LABEL,
  type ZoneStatus,
  type ZoneSummary,
} from "../lib/watershed";
import { rainStatus } from "../lib/water";
import { STATUS, type StatusLevel } from "../lib/status";

interface Props {
  waterGauges: WaterGauge[];
  rainfall: RainfallStation[];
  ews?: EwsStation[];
  /** GloFAS flood gauges — MODELLED proxy for zones with no live HII gauge/EWS. */
  floodGauges?: FloodGauge[];
  /** Rain FORECAST (not observed) at the 3 upstream zones — city excluded,
   *  already covered by the city-level forecast shown elsewhere. */
  precipZones?: ZonePrecipNowcast[];
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
}

/** Watershed zone status → the shared status vocabulary. */
const ZONE_STATUS: Record<ZoneStatus, StatusLevel> = {
  flood: "critical",
  high: "warning",
  watch: "watch",
  normal: "normal",
  nodata: "unknown",
};

const PRECIP_STATUS: Record<ZonePrecipNowcast["intensity"], StatusLevel> = {
  dry: "normal",
  light: "normal",
  moderate: "warning",
  heavy: "critical",
};

const SOIL_PRIMED_PCT = 85;

/** Coloured reading with its status glyph; neutral when the level is normal. */
function Reading({ level, children, title }: { level: StatusLevel; children: React.ReactNode; title?: string }) {
  if (level === "normal" || level === "unknown") return <li title={title}>{children}</li>;
  const st = STATUS[level];
  return (
    <li title={title} className="flood-status" style={{ color: st.color }}>
      <span aria-hidden="true">{st.glyph}</span>
      {children}
      <span className="visually-hidden"> ({st.en})</span>
    </li>
  );
}

function ZoneRow({ s, isLast, precip }: { s: ZoneSummary; isLast: boolean; precip?: ZonePrecipNowcast }) {
  const st = STATUS[ZONE_STATUS[s.status]];
  const z = s.zone;
  const lt = z.isCity ? null : leadTimeToCity(z.key);

  return (
    <li className={`watershed-zone${z.isCity ? " is-city" : ""}`}>
      {/* Flow rail — node dot + connector */}
      <div className="watershed-rail" aria-hidden="true">
        <span className={`watershed-node${z.isCity ? " is-city" : ""}`} style={{ background: st.color }} />
        {!isLast && <span className="watershed-connector" />}
      </div>

      {/* Node detail */}
      <div className="watershed-body">
        <div className="flood-row-head">
          <span>
            <span className="watershed-zone__name" lang="th">{z.th}</span>{" "}
            <span className="watershed-zone__en">{z.en}</span>
          </span>
          <span className="flood-status watershed-zone__status" style={{ color: st.color }}>
            <span aria-hidden="true">{st.glyph}</span>
            <MixedText text={ZONE_STATUS_LABEL[s.status]} />
            {s.modelled && <span className="flood-meta"> · model</span>}
          </span>
        </div>

        <p className="flood-meta"><MixedText text={`${z.role} · ${z.river}`} /></p>
        {lt && (
          <p className="flood-meta num">≈ {lt.minH.toFixed(1)}–{lt.maxH.toFixed(1)} h to city (est.)</p>
        )}

        {/* Live readings */}
        <ul className="watershed-readings">
          {s.gaugeCount > 0 && (
            <Reading level="normal">
              {s.gaugeCount} gauge{s.gaugeCount > 1 ? "s" : ""}
              {s.rising && <><span aria-hidden="true"> ↑</span><span className="visually-hidden">, rising</span></>}
            </Reading>
          )}
          {s.levelMsl != null && <Reading level="normal"><span className="num">{s.levelMsl.toFixed(1)} m</span></Reading>}
          {s.diffFromBank != null && (
            <Reading level={s.diffFromBank > 0 ? "critical" : "normal"}>
              {s.diffFromBank > 0
                ? `${s.diffFromBank.toFixed(1)} m OVERBANK`
                : `${Math.abs(s.diffFromBank).toFixed(1)} m to bank`}
            </Reading>
          )}
          {s.rain24h != null && s.rain24h > 0 && (
            <Reading level={s.rain24h >= 35 ? rainStatus(s.rain24h) : "normal"}>
              <span aria-hidden="true">☔</span> {Math.round(s.rain24h)} mm/24h
            </Reading>
          )}
          {precip && precip.total2hMm > 0 && (
            <Reading level={PRECIP_STATUS[precip.intensity]} title="Forecast, not observed — Open-Meteo minutely_15">
              <span aria-hidden="true">⇢</span> forecast +{precip.total2hMm}mm/2h
              {precip.minutesToSignificant != null && ` · in ${precip.minutesToSignificant}min`}
            </Reading>
          )}
          {s.soil != null && (
            <Reading level={s.soil >= SOIL_PRIMED_PCT ? "watch" : "normal"}>soil {Math.round(s.soil)}%</Reading>
          )}
        </ul>
        {s.topStation && (
          <p className="flood-meta watershed-station"><MixedText text={s.topStation} /></p>
        )}
      </div>
    </li>
  );
}

export function UpstreamWatershed({ waterGauges, rainfall, ews = [], floodGauges = [], precipZones = [], ageMinutes, fallbackTier }: Props) {
  const summaries = useMemo(
    () => summarizeWatershed(waterGauges, rainfall, ews, floodGauges),
    [waterGauges, rainfall, ews, floodGauges],
  );

  const hasAny = summaries.some((s) => s.gaugeCount > 0 || s.rain24h != null || s.soil != null || s.modelled);
  // Worst upstream (non-city) status drives the "what's coming" line.
  const upstream = summaries.filter((s) => !s.zone.isCity);
  const upstreamAlert = upstream.find((s) => s.status === "flood" || s.status === "high");
  const alertStatus = upstreamAlert ? STATUS[ZONE_STATUS[upstreamAlert.status]] : null;

  return (
    <section className="panel" aria-label="Upstream watershed">
      <PanelHeader
        title="WATERSHED // UPSTREAM → CITY"
        source="thaiwater · dwr-ews"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
      />

      {!hasAny ? (
        <p className="flood-empty">Awaiting upstream gauge + rainfall feeds.</p>
      ) : (
        <>
          {/* What's coming — the lead-time headline */}
          <p className="watershed-headline">
            {upstreamAlert && alertStatus ? (
              <span className="flood-status" style={{ color: alertStatus.color }}>
                <span aria-hidden="true">{alertStatus.glyph}</span>
                <span>
                  <MixedText
                    text={`${upstreamAlert.zone.th} ${ZONE_STATUS_LABEL[upstreamAlert.status].split(" ")[0]} upstream — heading for the city via ${upstreamAlert.zone.river}`}
                  />
                </span>
              </span>
            ) : (
              "Upstream calm — Tha Dee headwaters within banks"
            )}
          </p>

          {/* The cascade */}
          <ol className="watershed-cascade" aria-label="Flow order, upstream to city">
            {summaries.map((s, i) => (
              <ZoneRow
                key={s.zone.key}
                s={s}
                isLast={i === summaries.length - 1}
                precip={precipZones.find((p) => p.zoneKey === s.zone.key)}
              />
            ))}
          </ol>

          <p className="flood-footnote">
            Flow order along <span lang="th">คลองท่าดี</span>: Khao Luang → <span lang="th">คีรีวง</span> →{" "}
            <span lang="th">ลานสกา</span> → city.
            Lead-time = channel distance ÷ a 1.5–3 m/s flood-wave celerity band
            (estimate, not hydraulic routing) — the window to act.
          </p>
        </>
      )}
    </section>
  );
}
