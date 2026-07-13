import type { FallbackTier } from "@nst/shared";
import type { InsightSeverity, SensorInsight } from "../lib/sensorInsights";
import { PanelHeader } from "./PanelHeader";

/**
 * SENSOR SIGNALS — FloodDash's insight cards: every line is one live pattern
 * detected across the telemetry (overbank, flash rain, saturated soil,
 * compound events, silent sensors). Tapping a spatial insight flies the map
 * to the station, so the rail reads top-to-bottom as a triage list.
 */

const SEV_COLOR: Record<InsightSeverity, string> = {
  critical: "var(--bad)",
  warn: "var(--warn)",
  info: "var(--ink-low)",
};

const SEV_LABEL: Record<InsightSeverity, string> = {
  critical: "CRITICAL",
  warn: "WARN",
  info: "INFO",
};

const TYPE_LABEL: Record<SensorInsight["type"], string> = {
  compound: "เหตุการณ์ซ้อน",
  overbank: "น้ำใกล้ล้น",
  rapid_rise: "น้ำขึ้นเร็ว",
  heavy_rain: "ฝนหนัก",
  flash_rain: "ฝนถล่ม",
  soil_saturated: "ดิน/EWS",
  reservoir_high: "อ่างใกล้เต็ม",
  sensor_gap: "สถานีเงียบ",
};

interface Props {
  insights: SensorInsight[];
  ageMinutes: number;
  fallbackTier?: FallbackTier;
  onFocus: (lng: number, lat: number) => void;
}

export function SensorInsightsPanel({ insights, ageMinutes, fallbackTier, onFocus }: Props) {
  const critical = insights.filter((i) => i.severity === "critical").length;
  const warn = insights.filter((i) => i.severity === "warn").length;

  return (
    <div>
      <PanelHeader
        title="SENSOR SIGNALS"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="thaiwater·dwr·rid"
      />
      {insights.length === 0 ? (
        <div className="eyebrow mono" style={{ color: "var(--accent)" }}>
          ✓ ไม่มีสัญญาณผิดปกติจากเครือข่ายเซนเซอร์ขณะนี้
        </div>
      ) : (
        <>
          <div className="eyebrow mono" style={{ marginBottom: 6 }}>
            {critical > 0 && <span style={{ color: "var(--bad)", fontWeight: 700 }}>{critical} CRITICAL</span>}
            {critical > 0 && warn > 0 && " · "}
            {warn > 0 && <span style={{ color: "var(--warn)" }}>{warn} WARN</span>}
            <span style={{ color: "var(--ink-low)" }}> · แตะเพื่อดูบนแผนที่</span>
          </div>
          {insights.map((i) => {
            const spatial = i.lat != null && i.lng != null;
            return (
              <button
                key={i.id}
                className="si-card"
                style={{ borderLeftColor: SEV_COLOR[i.severity] }}
                onClick={() => spatial && onFocus(i.lng!, i.lat!)}
                disabled={!spatial}
                title={spatial ? "แสดงตำแหน่งบนแผนที่" : undefined}
              >
                <span className="si-head mono">
                  <span className="si-type">{TYPE_LABEL[i.type]}</span>
                  <span className="si-sev" style={{ color: SEV_COLOR[i.severity] }}>{SEV_LABEL[i.severity]}</span>
                </span>
                <span className="si-title">{i.titleTh}</span>
                <span className="si-body mono">{i.body}</span>
              </button>
            );
          })}
        </>
      )}
      <div className="eyebrow mono" style={{ color: "var(--ink-low)", marginTop: 4 }}>
        สัญญาณจากโทรมาตรจริง — ไม่ใช่การพยากรณ์ · เกณฑ์: กรมอุตุฯ/HII/DWR
      </div>
    </div>
  );
}
