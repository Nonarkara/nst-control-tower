/**
 * WeatherPanel — the city's current conditions and five-day outlook, as a rail
 * panel. Replaces the full-width world strip band above the map (which also
 * carried three foreign-city clocks the municipality doesn't operate on).
 */
import type { PrecipNowcast } from "@nst/shared";
import { PanelHeader } from "./PanelHeader";
import { aqiBand, hmFromIso, rainBadge, uvBand, windDirLabel } from "../lib/worldStrip";

export interface HostWeather {
  tempC: number | null;
  apparentTempC: number | null;
  humidity: number | null;
  rainNow: number | null;
  windKmh: number | null;
  windDeg: number | null;
  uv: number | null;
  cloudPct: number | null;
  pressurehPa: number | null;
  visKm: number | null;
  isDay: boolean | null;
  condition: string;
  sunrise: string | null;
  sunset: string | null;
  daily: Array<{ date: string; tempMaxC: number; tempMinC: number; precipMm: number; precipProb: number }>;
}

interface Props {
  weather: HostWeather | null;
  aqi: number | null;
  pm25: number | null;
  nowcast: PrecipNowcast | null;
}

const dash = "—";
const round = (n: number | null, suffix = "") => (n == null ? dash : `${Math.round(n)}${suffix}`);
const fixed = (n: number | null, d = 1, suffix = "") => (n == null ? dash : `${n.toFixed(d)}${suffix}`);

function weekday(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", weekday: "short" }).format(new Date(`${iso}T00:00:00`));
}

export function WeatherPanel({ weather, aqi, pm25, nowcast }: Props) {
  const air = aqiBand(aqi);
  const uv = uvBand(weather?.uv ?? null);
  const rain = rainBadge(nowcast);
  const wind = weather?.windKmh ?? null;

  return (
    <section className="panel" aria-label="Weather">
      <PanelHeader title="WEATHER" source="open-meteo · waqi" />

      <p className="stat-line">
        <span className="stat-line__value num">{round(weather?.tempC ?? null, "°C")}</span>
        <span className="stat-line__label">
          {weather?.condition ?? dash} · feels like <span className="num">{round(weather?.apparentTempC ?? null, "°")}</span>
        </span>
      </p>

      <dl className="weather-grid">
        <div>
          <dt>Humidity</dt>
          <dd className="num">{round(weather?.humidity ?? null, "%")}</dd>
        </div>
        <div>
          <dt>Wind</dt>
          <dd>
            <span className="num">{round(wind, " km/h")}</span> {wind != null ? windDirLabel(weather?.windDeg ?? null) : ""}
          </dd>
        </div>
        <div>
          <dt>Rain now</dt>
          <dd className="num">{fixed(weather?.rainNow ?? null, 1, " mm/h")}</dd>
        </div>
        <div>
          <dt>Next 2 hours</dt>
          <dd>{rain.label}{rain.sub ? ` · ${rain.sub}` : ""}</dd>
        </div>
        <div>
          <dt>Air quality</dt>
          <dd>
            <span className="num">{aqi ?? dash}</span> {aqi != null ? air.label : ""}
            {pm25 != null && <span className="weather-grid__sub num"> · PM2.5 {pm25.toFixed(1)}</span>}
          </dd>
        </div>
        <div>
          <dt>UV index</dt>
          <dd>
            <span className="num">{fixed(weather?.uv ?? null, 1)}</span> {weather?.uv != null ? uv.label : ""}
          </dd>
        </div>
        <div>
          <dt>Sunrise · sunset</dt>
          <dd className="num">
            {hmFromIso(weather?.sunrise ?? null)} · {hmFromIso(weather?.sunset ?? null)}
          </dd>
        </div>
        <div>
          <dt>Visibility</dt>
          <dd className="num">{fixed(weather?.visKm ?? null, 1, " km")}</dd>
        </div>
      </dl>

      {weather?.daily?.length ? (
        <table className="data-table">
          <caption className="visually-hidden">Five-day forecast</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col" className="data-table__num">High</th>
              <th scope="col" className="data-table__num">Low</th>
              <th scope="col" className="data-table__num">Rain</th>
            </tr>
          </thead>
          <tbody>
            {weather.daily.slice(0, 5).map((d) => (
              <tr key={d.date}>
                <th scope="row">{weekday(d.date)}</th>
                <td className="data-table__num num">{Math.round(d.tempMaxC)}°</td>
                <td className="data-table__num num">{Math.round(d.tempMinC)}°</td>
                <td className="data-table__num num">
                  {d.precipMm.toFixed(0)} mm · {Math.round(d.precipProb)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
