/**
 * City-panel status mappings — every domain scale shown in the city rail
 * panels (AQI, flood watch bands, alert levels, flight states…) mapped onto
 * the ONE status vocabulary in ./status. Panels read colour + glyph + label
 * from STATUS; nothing here invents a colour.
 */

import type { CSSProperties, ReactNode } from "react";
import { STATUS, type StatusLevel } from "./status";

/** Inline custom property carrying a status colour token (the only inline colour panels use). */
export function statusStyle(level: StatusLevel): CSSProperties {
  return { "--status": STATUS[level].color } as CSSProperties;
}

/** Status label: coloured glyph (decorative) + ink text label. Never colour alone. */
export function StatusText({ level, children }: { level: StatusLevel; children: ReactNode }) {
  return (
    <span className="pc-status" style={statusStyle(level)}>
      <span className="pc-status__glyph" aria-hidden="true">{STATUS[level].glyph}</span>
      {children}
    </span>
  );
}

/** US AQI → status: good · moderate · unhealthy-SG · unhealthy+. */
export function aqiStatus(aqi: number | null | undefined): StatusLevel {
  if (aqi == null || !Number.isFinite(aqi)) return "unknown";
  if (aqi <= 50) return "normal";
  if (aqi <= 100) return "watch";
  if (aqi <= 150) return "warning";
  return "critical";
}

/** Executive alert level (critical | warning | watch | info). Info is neutral. */
export function alertLevelStatus(level: string): StatusLevel {
  if (level === "critical") return "critical";
  if (level === "warning") return "warning";
  if (level === "watch") return "watch";
  return "unknown";
}

/** Strategic initiative delivery status. */
export function initiativeStatus(status: string): StatusLevel {
  if (status === "on-track" || status === "completed") return "normal";
  if (status === "at-risk") return "watch";
  if (status === "delayed") return "warning";
  return "unknown";
}

/** Adapter health (healthy | degraded | down). */
export function adapterStatus(status: string): StatusLevel {
  if (status === "healthy") return "normal";
  if (status === "degraded") return "watch";
  if (status === "down") return "critical";
  return "unknown";
}

/** FloodDash southern watch band (normal | watch | elevated | high). */
export function floodWatchStatus(band: string): StatusLevel {
  if (band === "normal") return "normal";
  if (band === "watch") return "watch";
  if (band === "elevated") return "warning";
  if (band === "high") return "critical";
  return "unknown";
}

/** GloFAS discharge band (normal | watch | warning | emergency | unknown). */
export function dischargeStatus(band: string): StatusLevel {
  if (band === "normal") return "normal";
  if (band === "watch") return "watch";
  if (band === "warning") return "warning";
  if (band === "emergency") return "critical";
  return "unknown";
}

/** Flood gauge status (normal | watch | warning | flood | unknown). */
export function gaugeStatus(status: string): StatusLevel {
  if (status === "normal") return "normal";
  if (status === "watch") return "watch";
  if (status === "warning") return "warning";
  if (status === "flood") return "critical";
  return "unknown";
}

/** Share (0–1) of a capacity in use: > high → critical, > mid → watch, else normal. */
export function loadStatus(share: number, mid: number, high: number): StatusLevel {
  if (!Number.isFinite(share)) return "unknown";
  if (share > high) return "critical";
  if (share > mid) return "watch";
  return "normal";
}

/** Flight delay in minutes: ≥ 30 → warning, > 0 → watch. */
export function delayStatus(minutes: number | null | undefined): StatusLevel | null {
  if (minutes == null || minutes <= 0) return null;
  return minutes >= 30 ? "warning" : "watch";
}

/** Sensor insight severity (critical | warn | info). */
export function insightStatus(severity: string): StatusLevel {
  if (severity === "critical") return "critical";
  if (severity === "warn") return "watch";
  return "unknown";
}

/** Text summary of a numeric series for screen readers (sparkline alternative). */
export function seriesSummary(values: number[], unit = "", digits = 0): string {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return "No data.";
  const f = (v: number) => `${v.toFixed(digits)}${unit}`;
  const first = finite[0]!;
  const last = finite[finite.length - 1]!;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const delta = last - first;
  const tolerance = Math.max(Math.abs(max - min) * 0.05, 10 ** -digits);
  const trend = delta > tolerance ? "rising" : delta < -tolerance ? "falling" : "flat";
  return `Min ${f(min)}, max ${f(max)}, latest ${f(last)}, trend ${trend}.`;
}
