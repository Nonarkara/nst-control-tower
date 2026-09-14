/**
 * SituationDigest — template-based situation summary synthesizing
 * NASA MERRA-2 Earth readings + TimesFM forecast alerts.
 *
 * No network calls — pure derivation from props passed by App.tsx.
 * Shown at the top of the left rail only when the INT lens is active.
 */

import type { NasaEarthReadings } from "@nst/shared";
import type { ForecastMetric } from "./PredictivePanel";
import { METRIC_LABEL } from "./PredictivePanel";
import { aqiBand } from "../lib/coastal";
import { StatusText, statusStyle } from "../lib/cityStatus";

interface Props {
  nasaReadings: NasaEarthReadings | null;
  avgSolarIrrKWh: number | null;
  forecastAlerts: Set<string>;
  forecasts: ForecastMetric[];
}

export function SituationDigest({ nasaReadings, avgSolarIrrKWh, forecastAlerts, forecasts }: Props) {
  const hasAlerts = forecastAlerts.size > 0;

  // Build situation lines
  const lines: string[] = [];

  if (hasAlerts) {
    const alertNames = [...forecastAlerts].map((m) => METRIC_LABEL[m] ?? m).join(" · ");
    lines.push(`▲ ACTIVE ALERTS: ${alertNames}`);
  }

  const aqiForecast = forecasts.find((f) => f.metric === "aqi.forecast");
  if (aqiForecast?.horizon.length) {
    const currentAqi = aqiForecast.horizon[0].p50;
    lines.push(`AQI ${Math.round(currentAqi)} (${aqiBand(currentAqi)}) — forecast ${aqiForecast.horizon.length}h`);
  }

  if (nasaReadings) {
    const parts: string[] = [];
    if (nasaReadings.tempC != null) parts.push(`${nasaReadings.tempC.toFixed(1)}°C`);
    if (nasaReadings.precipMmDay != null) parts.push(`${nasaReadings.precipMmDay.toFixed(1)} mm precip`);
    if (parts.length) lines.push(`MERRA-2: ${parts.join(" · ")}`);
  }

  if (avgSolarIrrKWh != null) {
    lines.push(`Solar: ${avgSolarIrrKWh.toFixed(1)} kWh/m²/mo (GISTDA LOD2)`);
  }

  const rainForecast = forecasts.find((f) => f.metric === "precipitation.forecast");
  if (rainForecast?.horizon.length) {
    const peak = Math.max(...rainForecast.horizon.map((p) => p.p50));
    if (peak < rainForecast.alertThreshold) {
      lines.push(`Rain peak ${peak.toFixed(1)} mm — below flood threshold`);
    }
  }

  if (lines.length === 0) {
    lines.push("Earth observations and forecasts loading…");
  }

  return (
    <div
      className="dig"
      role="region"
      aria-label="Situation digest"
      aria-live="polite"
      style={hasAlerts ? statusStyle("critical") : undefined}
    >
      <div className="pc-spread">
        {hasAlerts ? (
          <StatusText level="critical">SITUATION ALERT</StatusText>
        ) : (
          <span className="pc-label">SITUATION DIGEST</span>
        )}
        <span className="pc-meta">INT · LIVE</span>
      </div>
      {lines.map((line) => (
        <p key={line} className="dig__line">
          {line}
        </p>
      ))}
    </div>
  );
}
