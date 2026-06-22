import type { AirQualityPoint, FloodGauge, IncidentFeature, WeatherSnapshot } from "@nst/shared";
import { PanelHeader } from './PanelHeader';
import { aqiColor, aqiBand } from "../lib/coastal";

interface Props {
  cityReports: IncidentFeature[];
  floodGauges: FloodGauge[];
  airQuality: AirQualityPoint[];
  weather: WeatherSnapshot[];
  ageMinutes?: number;
}

const GAUGE_RANK: Record<FloodGauge["status"], number> = {
  normal: 0,
  watch: 1,
  warning: 2,
  flood: 3,
  unknown: -1,
};

const GAUGE_STATUS_COLOR: Record<FloodGauge["status"], string> = {
  normal: "var(--good)",
  watch: "var(--warn)",
  warning: "var(--warn)",
  flood: "var(--bad)",
  unknown: "var(--text-3)",
};

const GAUGE_STATUS_WORD: Record<FloodGauge["status"], string> = {
  normal: "NORMAL",
  watch: "WATCH",
  warning: "WARNING",
  flood: "FLOOD",
  unknown: "—",
};

export function KpiStrip({ cityReports, floodGauges, airQuality, weather, ageMinutes }: Props) {
  const openReports = cityReports.filter((r) => r.status !== "resolved").length;
  const worstGauge = floodGauges.length
    ? [...floodGauges].sort((a, b) => GAUGE_RANK[b.status] - GAUGE_RANK[a.status])[0]
    : null;
  const aq = airQuality[0];
  const w = weather[0];

  return (
    <>
      <PanelHeader title="CITY PULSE" ageMinutes={ageMinutes} source="traffy·openmeteo·aqicn·glofast" />
      <div className="kpi-grid">
      <div className="kpi" role="status" aria-label={`Citizen reports: ${openReports} open`}>
        <div className="label">TRAFFY:CR</div>
        <div className="value" style={{ color: openReports > 20 ? "var(--bad)" : openReports > 5 ? "var(--warn)" : openReports > 0 ? "var(--text)" : "var(--good)" }}>
          {openReports}
          <span className="kpi-status-word">{openReports > 20 ? "CRITICAL" : openReports > 5 ? "ELEVATED" : openReports > 0 ? "OPEN" : "CLEAR"}</span>
        </div>
        <div className="sub">{cityReports.length} TOTAL // OPEN</div>
      </div>

      <div className="kpi" role="status" aria-label={worstGauge ? `Flood gauge: ${worstGauge.status}` : "Flood status unavailable"}>
        <div className="label">FLOOD:GAUGE</div>
        <div className="value" style={{ color: worstGauge ? GAUGE_STATUS_COLOR[worstGauge.status] : "var(--text-3)" }}>
          {worstGauge ? GAUGE_STATUS_WORD[worstGauge.status] : "—"}
          {worstGauge && worstGauge.status !== "unknown" && (
            <span className="kpi-status-word">{floodGauges.filter(g => g.status === "warning" || g.status === "flood").length > 0 ? "ALERT" : "OK"}</span>
          )}
        </div>
        <div className="sub">PAK PHANANG / THA DEE</div>
      </div>

      <div className="kpi" role="status"
        aria-label={aq?.aqi != null ? `AQI ${aq.aqi}, ${aqiBand(aq.aqi)}` : "AQI unavailable"}>
        <div className="label">PM2.5:AQI</div>
        <div className="value" style={{ color: aq?.aqi != null ? aqiColor(aq.aqi) : "var(--text-3)" }}>
          {aq?.aqi ?? "—"}
          {aq?.aqi != null && (
            <span className="kpi-status-word">{aqiBand(aq.aqi)}</span>
          )}
        </div>
        <div className="sub">{aq?.pm25 != null ? `${aq.pm25.toFixed(1)} µg/m³` : "—"}</div>
      </div>

      <div className="kpi" role="status"
        aria-label={w?.tempC != null ? `Temperature ${Math.round(w.tempC)} degrees` : "Temperature unavailable"}>
        <div className="label">TEMP:WX</div>
        <div className="value">{w?.tempC != null ? `${Math.round(w.tempC)}°` : "—"}</div>
        <div className="sub">{w ? `FL ${Math.round((w.feelsLikeC ?? w.tempC) ?? 0)}° // ${(w.windKmh ?? 0).toFixed(0)} KMH` : "—"}</div>
      </div>
    </div>
    </>
  );
}
