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
import type { WaterGauge, RainfallStation, EwsStation, FallbackTier } from "@nst/shared";
import { PanelHeader } from "./PanelHeader";
import {
  summarizeWatershed,
  ZONE_STATUS_COLOR,
  ZONE_STATUS_LABEL,
  type ZoneSummary,
} from "../lib/watershed";

interface Props {
  waterGauges: WaterGauge[];
  rainfall: RainfallStation[];
  ews?: EwsStation[];
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
}

function ZoneRow({ s, isLast }: { s: ZoneSummary; isLast: boolean }) {
  const color = ZONE_STATUS_COLOR[s.status];
  const z = s.zone;

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {/* Flow rail — node dot + connector */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 12, flexShrink: 0 }}>
        <span
          style={{
            width: z.isCity ? 11 : 9,
            height: z.isCity ? 11 : 9,
            borderRadius: "50%",
            background: color,
            border: z.isCity ? "2px solid var(--ink)" : "none",
            marginTop: 3,
          }}
        />
        {!isLast && <span style={{ flex: 1, width: 2, background: "var(--line)", minHeight: 18 }} />}
      </div>

      {/* Node detail */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span className="mono" style={{ fontSize: "0.8rem", fontWeight: z.isCity ? 700 : 600 }}>
            {z.th}
          </span>
          <span className="eyebrow mono" style={{ color: "var(--text-3)" }}>{z.en}</span>
          <span className="eyebrow mono" style={{ color, marginLeft: "auto", fontWeight: 600 }}>
            {ZONE_STATUS_LABEL[s.status]}
          </span>
        </div>

        <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
          {z.role} · {z.river}
        </div>

        {/* Live readings */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
          {s.gaugeCount > 0 && (
            <span className="eyebrow mono" style={{ color: "var(--text-2)" }}>
              {s.gaugeCount} gauge{s.gaugeCount > 1 ? "s" : ""}
              {s.rising ? " ↑" : ""}
            </span>
          )}
          {s.levelMsl != null && (
            <span className="eyebrow mono" style={{ color: "var(--text-2)" }}>
              {s.levelMsl.toFixed(1)} m
            </span>
          )}
          {s.diffFromBank != null && (
            <span
              className="eyebrow mono"
              style={{ color: s.diffFromBank > 0 ? "var(--bad)" : "var(--text-2)" }}
            >
              {s.diffFromBank > 0
                ? `${s.diffFromBank.toFixed(1)} m OVERBANK`
                : `${Math.abs(s.diffFromBank).toFixed(1)} m to bank`}
            </span>
          )}
          {s.rain24h != null && s.rain24h > 0 && (
            <span className="eyebrow mono" style={{ color: s.rain24h >= 90 ? "var(--bad)" : s.rain24h >= 35 ? "var(--warn)" : "var(--text-2)" }}>
              ☔ {Math.round(s.rain24h)} mm/24h
            </span>
          )}
          {s.soil != null && (
            <span className="eyebrow mono" style={{ color: s.soil >= 85 ? "var(--warn)" : "var(--text-2)" }}>
              soil {Math.round(s.soil)}%
            </span>
          )}
        </div>
        {s.topStation && (
          <div className="eyebrow mono" style={{ color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {s.topStation}
          </div>
        )}
      </div>
    </div>
  );
}

export function UpstreamWatershed({ waterGauges, rainfall, ews = [], ageMinutes, fallbackTier }: Props) {
  const summaries = useMemo(
    () => summarizeWatershed(waterGauges, rainfall, ews),
    [waterGauges, rainfall, ews],
  );

  const hasAny = summaries.some((s) => s.gaugeCount > 0 || s.rain24h != null || s.soil != null);
  // Worst upstream (non-city) status drives the "what's coming" line.
  const upstream = summaries.filter((s) => !s.zone.isCity);
  const upstreamAlert = upstream.find((s) => s.status === "flood" || s.status === "high");

  return (
    <div className="col" style={{ gap: 8 }}>
      <PanelHeader
        title="WATERSHED // UPSTREAM → CITY"
        source="thaiwater · dwr-ews"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
      />

      {!hasAny ? (
        <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
          Awaiting upstream gauge + rainfall feeds.
        </div>
      ) : (
        <>
          {/* What's coming — the lead-time headline */}
          <div className="eyebrow mono" style={{ color: upstreamAlert ? "var(--warn)" : "var(--text-3)", lineHeight: 1.4 }}>
            {upstreamAlert
              ? `▲ ${upstreamAlert.zone.th} ${ZONE_STATUS_LABEL[upstreamAlert.status].split(" ")[0]} upstream — heading for the city via ${upstreamAlert.zone.river}`
              : "Upstream calm — Tha Dee headwaters within banks"}
          </div>

          {/* The cascade */}
          <div>
            {summaries.map((s, i) => (
              <ZoneRow key={s.zone.key} s={s} isLast={i === summaries.length - 1} />
            ))}
          </div>

          <div className="eyebrow mono" style={{ color: "var(--text-3)", borderTop: "1px solid var(--line)", paddingTop: 6, lineHeight: 1.5 }}>
            Flow order along คลองท่าดี: Khao Luang → คีรีวง → ลานสกา → city.
            Upstream rain & rises lead downtown by hours — the window to act.
          </div>
        </>
      )}
    </div>
  );
}
