/**
 * TopStationsRail — ThaiWater-style "stations to watch" strip.
 *
 * A horizontal strip of compact station cards across the top of the
 * dashboard when FLOOD / ENV / INT lens is active. Each card shows
 * the per-station story a citizen / operator wants at a glance:
 *
 *    [station name (amphoe)]
 *    1.24 m MSL  ·  ▼ -0.06 m/24h  ·  [NORMAL/WATCH/WARNING/CRITICAL]
 *    [████████████░░]  62% of bank
 *
 * Steals + improves from the ThaiWater NST station-card pattern:
 *   - Bilingual station name (TH primary, EN fallback)
 *   - Live level vs bank reference, both numeric AND as a coloured bar
 *   - 24-hour trend glyph + delta in metres (the operator reads "water
 *     rose 6 cm in the last day" without having to click in)
 *   - Status pill coloured by our 5-level vocabulary
 *
 * Improvements over the ThaiWater card:
 *   - 5-row rail with horizontal scroll instead of a fixed list (works
 *     on mobile too)
 *   - Each card links to the map (click → recenter on the station)
 *   - Empty / cold-start safe: returns null when no watch rows fire
 *   - Honours prefers-reduced-motion (CSS keyframes, no rAF loops)
 */

import { useEffect, useState } from "react";
import type { WaterGauge } from "@nst/shared";
import { rankLevelWatch, type LevelWatchRow, type WatchLevel } from "../lib/levelWatch";

interface Props {
  gauges: WaterGauge[];
  /** How many cards to show (default 6 — the same number as the ThaiWater
   *  NST top-of-page summary block). */
  limit?: number;
  /** Click handler — recenter the map on a station. Optional. */
  onFocusStation?: (lng: number, lat: number, id: string) => void;
  /** Extra CSS class for the rail wrapper. */
  className?: string;
}

const WATCH_VAR: Record<WatchLevel, string> = {
  critical: "var(--bad)",
  warning: "var(--alert)",
  watch: "var(--warn)",
};

const WATCH_PILL_RGB: Record<WatchLevel, [number, number, number, number]> = {
  critical: [255, 107, 94, 235],
  warning: [255, 154, 61, 235],
  watch: [240, 180, 41, 235],
};

const WATCH_LABEL_EN: Record<WatchLevel, string> = {
  critical: "OVERBANK",
  warning: "WARNING",
  watch: "WATCH",
};

const WATCH_LABEL_TH: Record<WatchLevel, string> = {
  critical: "ล้นตลิ่ง",
  warning: "น้ำมาก",
  watch: "เฝ้าระวัง",
};

function deltaLabel(prev: number | null, current: number | null): string {
  if (prev == null || current == null) return "·";
  const delta = current - prev;
  // Format with explicit sign so the reader doesn't have to figure it out.
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(2)} m`;
}

function trendGlyph(t: WaterGauge["trend"]): "▲" | "▼" | "→" | "·" {
  if (t === "rising") return "▲";
  if (t === "falling") return "▼";
  if (t === "stable") return "→";
  return "·";
}

function rgbaCss(c: [number, number, number, number]): string {
  return `rgba(${c[0]},${c[1]},${c[2]},${(c[3] / 255).toFixed(3)})`;
}

export function TopStationsRail({
  gauges, limit = 6, onFocusStation, className,
}: Props) {
  // Reduced-motion preference — collapse animations on cards when the
  // user has it on.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const allRows = rankLevelWatch({ gauges });
  const rows = allRows.slice(0, limit);

  if (rows.length === 0) return null;

  const tone = rows[0]?.level ?? "watch";
  const headlineColour = WATCH_VAR[tone];
  const totalCritical = rows.filter((r) => r.level === "critical").length;
  const totalWarning = rows.filter((r) => r.level === "warning").length;

  return (
    <aside
      className={`tsr ${className ?? ""} ${prefersReducedMotion ? "is-rm" : ""}`.trim()}
      aria-label="Top stations to watch"
    >
      <header className="tsr__hdr" style={{ borderLeftColor: headlineColour }}>
        <div>
          <p className="tsr__eyebrow">สถานีต้องเฝ้าระวัง · STATIONS TO WATCH</p>
          <p className="tsr__sub">
            {rows.length} rows · live · 24 h trend ·
            {" "}
            <span className={totalCritical > 0 ? "tsr__chip tsr__chip--bad" : totalWarning > 0 ? "tsr__chip tsr__chip--alert" : "tsr__chip tsr__chip--warn"}>
              {totalCritical > 0 ? `${totalCritical} overbank` : totalWarning > 0 ? `${totalWarning} warning` : "all watching"}
            </span>
          </p>
        </div>
      </header>

      <ol className="tsr__list">
        {rows.map((r) => (
          <li key={r.id}>
            <StationCard row={r} gauges={gauges} onFocusStation={onFocusStation} />
          </li>
        ))}
      </ol>
    </aside>
  );
}

function StationCard({
  row, gauges, onFocusStation,
}: { row: LevelWatchRow; gauges: WaterGauge[]; onFocusStation?: Props["onFocusStation"] }) {
  const gauge = gauges.find((g) => g.id === row.id);
  const prev = gauge?.levelPrev ?? null;
  const cur = gauge?.levelMsl ?? null;
  const bankMsl = gauge?.bankMsl ?? null;
  const fullness = gauge?.fullnessPct ?? null;
  const trend: WaterGauge["trend"] = gauge?.trend ?? "stable";
  const colour = WATCH_VAR[row.level];

  // Compute the bank gauge bar's left/right anchors. We need a visible
  // band from "0%" (well below bank) to "100%" (at bank) to "overflow"
  // (over the bank). For the gauge, clamp at 120 % so the overbank
  // portion still reads visually.
  const fillPct = fullness != null && Number.isFinite(fullness)
    ? Math.max(0, Math.min(120, fullness))
    : null;

  return (
    <button
      type="button"
      className="tsr__card"
      onClick={() => onFocusStation?.(row.lng, row.lat, row.id)}
      data-band={row.level}
      title={`${row.amphoe} · ${row.reason}`}
    >
      <header className="tsr__card-hdr">
        <span className="tsr__station" lang="th">{row.amphoe}</span>
        <span className="tsr__station-en">{row.river}</span>
        <span
          className="tsr__pill"
          style={{ background: rgbaCss(WATCH_PILL_RGB[row.level]) }}
        >
          {WATCH_LABEL_EN[row.level]}
        </span>
      </header>

      <div className="tsr__reading">
        <span className="tsr__level num">{cur != null ? `${cur.toFixed(2)} m` : "—"}</span>
        <span className="tsr__msl">MSL</span>
        <span className="tsr__delta num" aria-label="24-hour delta">
          <span aria-hidden="true">{trendGlyph(trend)}</span>
          {deltaLabel(prev, cur)}
        </span>
      </div>

      <div className="tsr__bank">
        <div
          className="tsr__bank-fill"
          style={{
            width: fillPct != null ? `${(fillPct / 120) * 100}%` : "0%",
            background: colour,
          }}
        />
        <span className="tsr__bank-mark" style={{ left: `${(100 / 120) * 100}%` }} aria-hidden="true">
          bank
        </span>
      </div>
      <p className="tsr__bank-meta num">
        {fullness != null ? `${fullness.toFixed(0)}% of bank` : "—"}
        {bankMsl != null && bankMsl > 0 ? ` · bank ${bankMsl.toFixed(2)} m` : ""}
      </p>
      <p className="tsr__reason" lang="th">{row.reasonTh}</p>
    </button>
  );
}
