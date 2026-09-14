import type { FallbackTier } from "@nst/shared";
import type { InsightSeverity, SensorInsight } from "../lib/sensorInsights";
import { PanelHeader } from "./PanelHeader";
import { StatusText, insightStatus, statusStyle } from "../lib/cityStatus";

/**
 * SENSOR SIGNALS — FloodDash's insight cards: every line is one live pattern
 * detected across the telemetry (overbank, flash rain, saturated soil,
 * compound events, silent sensors). Tapping a spatial insight flies the map
 * to the station, so the rail reads top-to-bottom as a triage list.
 */

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

function CardBody({ i }: { i: SensorInsight }) {
  return (
    <>
      <span className="sig-card__head">
        <span className="sig-card__type" lang="th">{TYPE_LABEL[i.type]}</span>
        <StatusText level={insightStatus(i.severity)}>{SEV_LABEL[i.severity]}</StatusText>
      </span>
      <span className="sig-card__title" lang="th">{i.titleTh}</span>
      <span className="sig-card__body">{i.body}</span>
    </>
  );
}

export function SensorInsightsPanel({ insights, ageMinutes, fallbackTier, onFocus }: Props) {
  const critical = insights.filter((i) => i.severity === "critical").length;
  const warn = insights.filter((i) => i.severity === "warn").length;

  return (
    <section className="panel" aria-label="Sensor signals">
      <PanelHeader
        title="SENSOR SIGNALS"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="thaiwater·dwr·rid"
      />
      {insights.length === 0 ? (
        <p>
          <StatusText level="normal">
            <span lang="th">ไม่มีสัญญาณผิดปกติจากเครือข่ายเซนเซอร์ขณะนี้</span>
          </StatusText>
        </p>
      ) : (
        <>
          <p className="pc-spread">
            <span className="pc-spread">
              {critical > 0 && <StatusText level="critical"><span className="num">{critical}</span> CRITICAL</StatusText>}
              {warn > 0 && <StatusText level="watch"><span className="num">{warn}</span> WARN</StatusText>}
            </span>
            <span className="pc-meta" lang="th">แตะเพื่อดูบนแผนที่</span>
          </p>
          <ul className="sig-list">
            {insights.map((i) => {
              const spatial = i.lat != null && i.lng != null;
              const style = statusStyle(insightStatus(i.severity));
              return (
                <li key={i.id}>
                  {spatial ? (
                    <button
                      type="button"
                      className="sig-card"
                      style={style}
                      onClick={() => onFocus(i.lng!, i.lat!)}
                      title="แสดงตำแหน่งบนแผนที่"
                    >
                      <CardBody i={i} />
                    </button>
                  ) : (
                    <div className="sig-card" style={style}>
                      <CardBody i={i} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="pc-meta">
        <span lang="th">สัญญาณจากโทรมาตรจริง — ไม่ใช่การพยากรณ์ · เกณฑ์: กรมอุตุฯ/HII/DWR</span>
        {" · "}Powered by FloodDash by Dr.Non
      </p>
    </section>
  );
}
