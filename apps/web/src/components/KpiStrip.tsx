import type { AirQualityPoint, FloodGauge, IncidentFeature, WeatherSnapshot } from "@nst/shared";
import { PanelHeader } from './PanelHeader';
import { aqiBand } from "../lib/coastal";
import type { StatusLevel } from "../lib/status";
import { StatusText, aqiStatus, gaugeStatus } from "../lib/cityStatus";

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

const GAUGE_STATUS_WORD: Record<FloodGauge["status"], string> = {
  normal: "NORMAL",
  watch: "WATCH",
  warning: "WARNING",
  flood: "FLOOD",
  unknown: "—",
};

const REPORTS_CRITICAL = 20;
const REPORTS_ELEVATED = 5;

function reportsState(open: number): { level: StatusLevel | null; word: string } {
  if (open > REPORTS_CRITICAL) return { level: "critical", word: "CRITICAL" };
  if (open > REPORTS_ELEVATED) return { level: "watch", word: "ELEVATED" };
  if (open > 0) return { level: null, word: "OPEN" };
  return { level: "normal", word: "CLEAR" };
}

export function KpiStrip({ cityReports, floodGauges, airQuality, weather, ageMinutes }: Props) {
  const openReports = cityReports.filter((r) => r.status !== "resolved").length;
  const worstGauge = floodGauges.length
    ? [...floodGauges].sort((a, b) => GAUGE_RANK[b.status] - GAUGE_RANK[a.status])[0]
    : null;
  const aq = airQuality[0];
  const w = weather[0];
  const reports = reportsState(openReports);
  const gaugeAlert = floodGauges.some((g) => g.status === "warning" || g.status === "flood");

  return (
    <>
      <PanelHeader title="CITY PULSE" ageMinutes={ageMinutes} source="traffy·openmeteo·aqicn·glofast" />
      <dl className="pc-stats kpis">
        <div>
          <dt>Traffy:CR</dt>
          <dd>
            <span className="num">{openReports}</span>
            {reports.level ? (
              <StatusText level={reports.level}>{reports.word}</StatusText>
            ) : (
              <span className="pc-status">{reports.word}</span>
            )}
            <span className="pc-stats__sub num">{cityReports.length} total // open</span>
          </dd>
        </div>

        <div>
          <dt>Flood:gauge</dt>
          <dd>
            {worstGauge && worstGauge.status !== "unknown" ? (
              <>
                <StatusText level={gaugeStatus(worstGauge.status)}>{GAUGE_STATUS_WORD[worstGauge.status]}</StatusText>
                <span className="pc-stats__sub">{gaugeAlert ? "ALERT" : "OK"}</span>
              </>
            ) : (
              <span>—</span>
            )}
            <span className="pc-stats__sub">Pak Phanang / Tha Dee</span>
          </dd>
        </div>

        <div>
          <dt>PM2.5:AQI</dt>
          <dd>
            <span className="num">{aq?.aqi ?? "—"}</span>
            {aq?.aqi != null && <StatusText level={aqiStatus(aq.aqi)}>{aqiBand(aq.aqi)}</StatusText>}
            <span className="pc-stats__sub num">{aq?.pm25 != null ? `${aq.pm25.toFixed(1)} µg/m³` : "—"}</span>
          </dd>
        </div>

        <div>
          <dt>Temp:WX</dt>
          <dd>
            <span className="num">{w?.tempC != null ? `${Math.round(w.tempC)}°` : "—"}</span>
            <span className="pc-stats__sub num">
              {w ? `Feels ${Math.round((w.feelsLikeC ?? w.tempC) ?? 0)}° // ${(w.windKmh ?? 0).toFixed(0)} km/h` : "—"}
            </span>
          </dd>
        </div>
      </dl>
    </>
  );
}
