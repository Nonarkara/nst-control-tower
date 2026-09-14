/**
 * ExecutiveBriefing — Mayor's live situation panel for the EX lens.
 *
 * Shows: live situation alerts · city vitals snapshot · strategic initiatives ·
 * markets snapshot (when API keys are present). All data is sourced from live
 * feeds; nothing is manufactured. Clearly marks reference/modelled values.
 */

import type {
  ExecutiveSnapshot,
  WeatherSnapshot,
  AirQualityPoint,
  MarketSnapshot,
  FallbackTier,
} from "@nst/shared";
import type { ReservoirStatus } from "./WaterPanel";
import type { AdapterHealth } from "../hooks/useSystemHealth";
import { PanelHeader } from "./PanelHeader";
import { execAqiBand, fmt1, fmtInt, avgCapacityPct } from "../lib/executive";
import {
  StatusText,
  adapterStatus,
  alertLevelStatus,
  aqiStatus,
  initiativeStatus,
  statusStyle,
} from "../lib/cityStatus";

interface Props {
  executive: ExecutiveSnapshot | null;
  weather: WeatherSnapshot | null;
  airQuality: AirQualityPoint | null;
  openIncidents: number;
  reservoirs: ReservoirStatus[];
  markets: MarketSnapshot | null;
  adapterHealth?: AdapterHealth[];
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
}

const HEALTH_PREVIEW = 5;


export function ExecutiveBriefing({
  executive,
  weather,
  airQuality,
  openIncidents,
  reservoirs,
  markets,
  adapterHealth,
  ageMinutes,
  fallbackTier,
}: Props) {
  const alerts = executive?.alerts ?? [];
  const initiatives = executive?.initiatives ?? [];
  const aqi = airQuality?.aqi ?? null;
  const avgReservoir = avgCapacityPct(reservoirs);
  const thbUsd = markets?.thb.find((t) => t.vs === "USD")?.rate;
  const sp500 = markets?.ticks.find((t) => t.symbol === "^GSPC");
  const wti = markets?.ticks.find((t) => t.name === "WTI Crude");

  const nowStr = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <section className="panel" aria-label="Executive brief">
      <PanelHeader
        title="EXECUTIVE BRIEF"
        source="live-feeds + compendium"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        actions={<span className="pc-meta num">{nowStr}</span>}
      />

      {/* Situation alerts */}
      <div className="pc-section">
        <h3 className="pc-label">Situation</h3>
        {alerts.length === 0 ? (
          <p role="status">
            <StatusText level="normal">Nominal — no active alerts</StatusText>
          </p>
        ) : (
          <ul className="pc-list" aria-label="Active situation alerts">
            {alerts.map((a) => {
              const level = alertLevelStatus(a.level);
              return (
                <li key={a.id} className="exec-alert" style={statusStyle(level)}>
                  <StatusText level={level}>
                    {a.level} · {a.category}
                  </StatusText>
                  <p className="exec-alert__title">{a.title}</p>
                  <p className="exec-alert__msg">{a.message}</p>
                  {a.actionRequired && <p className="exec-alert__action">→ {a.actionRequired}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* City vitals */}
      <div className="pc-section">
        <h3 className="pc-label">City vitals</h3>
        <dl className="pc-stats pc-stats--pair" aria-label="City vital statistics">
          <div>
            <dt>AQI</dt>
            <dd>
              <span className="num">{fmtInt(aqi)}</span>
              {aqi != null && <StatusText level={aqiStatus(aqi)}>{execAqiBand(aqi)}</StatusText>}
            </dd>
          </div>
          <div>
            <dt>Temp</dt>
            <dd className="num">{fmt1(weather?.tempC)}°C</dd>
          </div>
          <div>
            <dt>Reports</dt>
            <dd>
              <span className="num">{openIncidents}</span>
              {openIncidents > 5 ? (
                <StatusText level="watch">Open</StatusText>
              ) : (
                <span className="pc-stats__sub">open</span>
              )}
            </dd>
          </div>
          <div>
            <dt>Reservoirs</dt>
            <dd>
              <span className="num">{avgReservoir != null ? `${Math.round(avgReservoir)}%` : "—"}</span>
              {avgReservoir != null && avgReservoir < 30 && <StatusText level="watch">Low</StatusText>}
            </dd>
          </div>
        </dl>
      </div>

      {/* Strategic initiatives */}
      {initiatives.length > 0 && (
        <div className="pc-section">
          <h3 className="pc-label">
            Initiatives <span className="pc-meta">· indicative</span>
          </h3>
          <ul className="pc-list">
            {initiatives.map((init) => (
              <li key={init.id} className="exec-init">
                <div className="pc-spread">
                  <span className="exec-init__name">{init.name}</span>
                  <StatusText level={initiativeStatus(init.status)}>
                    {init.status.replace("-", " ")}
                  </StatusText>
                </div>
                {/* No fabricated %-complete bar: the Mayor runs these programmes and
                    would catch invented precision. Show owner + target date only,
                    with a qualitative status, until the Mayor's office supplies real
                    progress figures. */}
                <p className="pc-meta">
                  {init.owner} · target {init.deadline}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Markets snapshot — only when live data is available */}
      {markets && (thbUsd != null || sp500 || wti) && (
        <div className="pc-section">
          <h3 className="pc-label">Markets</h3>
          <dl className="pc-stats">
            {thbUsd != null && (
              <div>
                <dt>THB / USD</dt>
                <dd className="num">{thbUsd.toFixed(2)}</dd>
              </div>
            )}
            {sp500 && (
              <div>
                <dt>S&amp;P 500</dt>
                <dd>
                  <span className="num">{sp500.value != null ? fmtInt(sp500.value) : "—"}</span>
                  {sp500.changePct != null && (
                    <span className="exec-change num">
                      <span aria-hidden="true">{sp500.changePct >= 0 ? "▲" : "▼"}</span>
                      <span className="visually-hidden">{sp500.changePct >= 0 ? "up" : "down"} </span>
                      {Math.abs(sp500.changePct).toFixed(1)}%
                    </span>
                  )}
                </dd>
              </div>
            )}
            {wti && (
              <div>
                <dt>WTI crude</dt>
                <dd className="num">${fmt1(wti.value)}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Data health — only shown when some adapters are not fully healthy */}
      {adapterHealth && adapterHealth.some((a) => a.status === "degraded" || a.status === "down") && (
        <DataHealthSection adapters={adapterHealth} />
      )}
    </section>
  );
}

/** Compact adapter health list for the exec briefing. */
function DataHealthSection({ adapters }: { adapters: AdapterHealth[] }) {
  const unhealthy = adapters.filter((a) => a.status === "degraded" || a.status === "down");
  const healthy = adapters.filter((a) => a.status === "healthy").length;
  const total = adapters.length;

  return (
    <div className="pc-section" role="status" aria-label="Data feed health">
      <div className="pc-spread">
        <h3 className="pc-label">Data health</h3>
        <StatusText level={healthy === total ? "normal" : "watch"}>
          <span className="num">{healthy}/{total}</span> healthy
        </StatusText>
      </div>
      <ul className="pc-list">
        {unhealthy.slice(0, HEALTH_PREVIEW).map((a) => {
          const note = a.lastErrorMessage;
          const isMissingKey = note?.startsWith("Missing") ?? false;
          return (
            <li key={a.name} className="exec-health__row" title={note ?? `${a.name}: ${a.status}`}>
              <span className="exec-health__name">{a.name}</span>
              <StatusText level={adapterStatus(a.status)}>{isMissingKey ? "Key missing" : a.status}</StatusText>
            </li>
          );
        })}
      </ul>
      {unhealthy.length > HEALTH_PREVIEW && (
        <p className="pc-meta">+{unhealthy.length - HEALTH_PREVIEW} more — see SOURCES</p>
      )}
    </div>
  );
}
