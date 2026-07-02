/**
 * FloodCommand — the God Mode planning panel. Composes the four capabilities
 * the mayor needs in one place:
 *
 *   1. Street-flood SCENARIO — a water level (m MSL) compared point-by-point
 *      against the HII 2025 road-elevation survey (18,359 points, cm accuracy)
 *      → which streets go under, how deep, how many km. Presets anchor to the
 *      surveyed historical flood marks (NORMAL median · PABUK 2019 max).
 *   2. IMPACT readout — auditable arithmetic (lib/floodScenario.ts), not model.
 *   3. 3-DAY WATERSHED RAIN — WRF-ROMS (HII) forecast averaged over the Khao
 *      Luang–Tha Dee catchment: the water that will be coming down.
 *   4. SEASONAL CALENDAR — 17 years of satellite-detected flooding per city
 *      tambon per month (GISTDA/HII): when to pre-position what, where.
 *
 * Honesty rules baked in: the scenario is a static-level (bathtub) comparison
 * with no flow routing; coverage is the HII survey area (eastern lowland);
 * WRF is a model forecast. All three caveats are shown in the footer.
 */

import { useMemo } from "react";
import type { Feature, FeatureCollection, Point } from "geojson";
import type { WrfRainDay } from "@nst/shared";
import { PanelHeader } from "./PanelHeader";
import type { FloodMarkProps, RoadLevelProps } from "../map/layers";
import {
  SCENARIO_PRESETS,
  SCENARIO_MIN_M,
  SCENARIO_MAX_M,
  buildScenarioIndex,
  floodScenarioStats,
} from "../lib/floodScenario";
import { SEASONAL_FLOOD_RISK, SEASONAL_RISK_SOURCE } from "../data/seasonalFloodRisk";

interface Props {
  /** Scenario water level (m MSL) or null = scenario off (elevation ramp). */
  scenarioLevel: number | null;
  onScenarioChange: (level: number | null) => void;
  roadLevels: FeatureCollection<Point, RoadLevelProps> | null;
  floodMarks: FeatureCollection<Point, FloodMarkProps> | null;
  /** True when the street-flood-sim map layer is enabled (FLOOD lens). */
  scenarioLayerOn: boolean;
  wrfOutlook: WrfRainDay[];
  wrfDay: 1 | 2 | 3;
  onWrfDayChange: (day: 1 | 2 | 3) => void;
  /** Whether the wrf-rain-grid map layer is enabled + its toggle. */
  wrfLayerOn: boolean;
  onToggleWrfLayer: () => void;
  wrfNote?: string;
}

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const RISK_CELL_COLOR = [
  "var(--bg-3)",  // 0 — no recorded flooding
  "var(--data)",  // 1 — low (1–3 events / 17 y)
  "var(--warn)",  // 2 — medium (4–8)
  "var(--bad)",   // 3 — high (9+)
];

function rainTone(mm: number): string {
  if (mm >= 90) return "var(--crit)";
  if (mm >= 35) return "var(--bad)";
  if (mm >= 10) return "var(--warn)";
  if (mm >= 1) return "var(--data)";
  return "var(--text-3)";
}

const BKK_TZ = "Asia/Bangkok";

/** Bangkok-local ISO date (YYYY-MM-DD) for "is this forecast day past?". */
function bangkokToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BKK_TZ }).format(new Date());
}

/** "2026-07-04" → "SAT 4/7" (or "TODAY"). */
function dayLabel(validDate: string): string {
  if (validDate === bangkokToday()) return "TODAY";
  const d = new Date(`${validDate}T12:00:00+07:00`);
  const wd = d.toLocaleDateString("en-GB", { weekday: "short", timeZone: BKK_TZ }).toUpperCase();
  const [, m, day] = validDate.split("-");
  return `${wd} ${Number(day)}/${Number(m)}`;
}

/** Model-run age from a runId like "2026-07-01_12UTC". Publication can lag
 *  by DAYS (observed live); this is shown prominently so a 2-day-old run is
 *  never mistaken for a fresh outlook.
 *  runId is optional-defensive: useFeed persists payloads to localStorage,
 *  so right after a schema change a cached feature can predate the field. */
function runAge(runId: string | undefined): { hours: number; label: string; color: string } | null {
  const m = runId?.match(/^(\d{4}-\d{2}-\d{2})_(\d{2})UTC$/);
  if (!m) return null;
  const t = new Date(`${m[1]}T${m[2]}:00:00Z`).getTime();
  if (Number.isNaN(t)) return null;
  const hours = Math.max(0, Math.round((Date.now() - t) / 3_600_000));
  const [, mo, day] = m[1].split("-");
  return {
    hours,
    label: `RUN ${Number(day)}/${Number(mo)} ${m[2]}Z · ${hours} H AGO`,
    // A new run should land ~every 12 h + publication lag; escalate visibly.
    color: hours >= 48 ? "var(--bad)" : hours >= 24 ? "var(--warn)" : "var(--text-3)",
  };
}

export function FloodCommand({
  scenarioLevel,
  onScenarioChange,
  roadLevels,
  floodMarks,
  scenarioLayerOn,
  wrfOutlook,
  wrfDay,
  onWrfDayChange,
  wrfLayerOn,
  onToggleWrfLayer,
  wrfNote,
}: Props) {
  const index = useMemo(
    () => (roadLevels ? buildScenarioIndex(roadLevels) : null),
    [roadLevels],
  );
  const marks = useMemo(
    () => (floodMarks?.features ?? []) as Feature<Point, FloodMarkProps>[],
    [floodMarks],
  );
  const stats = useMemo(
    () => (index && scenarioLevel != null ? floodScenarioStats(index, marks, scenarioLevel) : null),
    [index, marks, scenarioLevel],
  );

  const currentMonth = new Date().getMonth(); // 0-based, matches risk[] index
  const age = wrfOutlook[0] ? runAge(wrfOutlook[0].runId) : null;
  const today = bangkokToday();

  return (
    <div className="col" style={{ gap: 8 }}>
      {/* No ageMinutes/fallbackTier here on purpose: those describe only the
          WRF feed, while most of this panel is static survey data — a WRF
          outage must not stamp the whole panel OFFLINE. The WRF section
          carries its own run-age line + empty state instead. */}
      <PanelHeader title="FLOOD COMMAND // GOD MODE" source="hii-survey · wrf-roms · gistda" />

      {/* ── 1 · Street-flood scenario ─────────────────────────────────── */}
      <div>
        <div className="eyebrow mono" style={{ marginBottom: 4 }}>
          STREET SCENARIO · WATER LEVEL (m MSL)
        </div>
        <div className="fc-presets">
          <button
            onClick={() => onScenarioChange(null)}
            aria-pressed={scenarioLevel == null}
            className={`mono ${scenarioLevel == null ? "active" : ""}`}
            title="Scenario off — streets colored by surveyed elevation instead"
          >
            OFF
          </button>
          {SCENARIO_PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => onScenarioChange(p.levelM)}
              aria-pressed={scenarioLevel === p.levelM}
              className={`mono ${scenarioLevel === p.levelM ? "active" : ""}`}
              title={
                p.key === "pabuk"
                  ? "Highest surveyed Tropical Storm Pabuk (Jan 2019) high-water mark"
                  : "Median surveyed normal-season high-water mark"
              }
            >
              {p.label} {p.levelM.toFixed(2)}
            </button>
          ))}
        </div>
        <input
          type="range"
          className="fc-slider"
          min={SCENARIO_MIN_M}
          max={SCENARIO_MAX_M}
          step={0.05}
          value={scenarioLevel ?? SCENARIO_MIN_M}
          onChange={(e) => onScenarioChange(Number(e.target.value))}
          // A controlled range fires no change event when tapped at its
          // resting value — from OFF, a tap at the left edge would do
          // nothing. Activate on first touch instead.
          onPointerDown={() => {
            if (scenarioLevel == null) onScenarioChange(SCENARIO_MIN_M);
          }}
          aria-label="Scenario water level in metres above mean sea level"
        />
        {scenarioLevel != null && !stats && (
          <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
            Loading the street elevation survey (18,359 points)…
          </div>
        )}
        {scenarioLevel != null && stats && (
          <div className="fc-impact mono">
            <span style={{ color: stats.wetShare > 0.5 ? "var(--bad)" : stats.wetShare > 0.15 ? "var(--warn)" : "var(--good)" }}>
              {(stats.wetShare * 100).toFixed(0)}% of surveyed streets under water
            </span>
            <span className="fc-impact-sub">
              ≈ {stats.wetKm.toFixed(1)} of {stats.totalKm.toFixed(1)} km · deepest {stats.deepestM.toFixed(2)} m ·
              exceeds {stats.marksExceeded}/{stats.marksTotal} historical marks
            </span>
          </div>
        )}
        {/* Map color legend — the depth classes double as passability guidance. */}
        <div className="fc-legend mono" aria-label="Street scenario map colors">
          {scenarioLevel != null ? (
            <>
              <span><i style={{ background: "rgb(74,222,128)" }} /> dry</span>
              <span><i style={{ background: "rgb(251,191,36)" }} /> &lt;0.3 m</span>
              <span><i style={{ background: "rgb(249,115,22)" }} /> 0.3–0.8 m (cars impassable)</span>
              <span><i style={{ background: "rgb(220,38,38)" }} /> &gt;0.8 m</span>
            </>
          ) : (
            <>
              <span><i style={{ background: "rgb(30,64,175)" }} /> lowest streets</span>
              <span><i style={{ background: "rgb(59,130,246)" }} /> ~median (1.5 m MSL)</span>
              <span><i style={{ background: "rgb(226,232,240)" }} /> high ground</span>
            </>
          )}
        </div>
        {scenarioLevel != null && !scenarioLayerOn && (
          <div className="eyebrow mono" style={{ color: "var(--warn)" }}>
            Enable "Street levels / flood scenario" (FLOOD lens) to see it on the map.
          </div>
        )}
      </div>

      {/* ── 2 · 3-day watershed rain (WRF-ROMS) ───────────────────────── */}
      <div>
        <div className="eyebrow mono" style={{ marginBottom: 4 }}>
          WATERSHED RAIN · WRF-ROMS · KHAO LUANG→CITY
        </div>
        {wrfOutlook.length === 0 ? (
          <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
            {wrfNote ?? "Awaiting WRF-ROMS model feed."}
          </div>
        ) : (
          <>
            <div className="fc-wrf-days">
              {wrfOutlook.map((d) => {
                const isPast = d.validDate < today;
                return (
                  <button
                    key={d.day}
                    onClick={() => onWrfDayChange(d.day)}
                    aria-pressed={wrfDay === d.day}
                    className={`fc-wrf-day mono ${wrfDay === d.day ? "active" : ""}`}
                    style={isPast ? { opacity: 0.45 } : undefined}
                    title={`Valid ${d.validDate}${isPast ? " (already past)" : ""} · catchment mean ${d.catchmentMeanMm} / max ${d.catchmentMaxMm} mm · city mean ${d.cityMeanMm} mm`}
                  >
                    <span className="fc-wrf-label">{dayLabel(d.validDate)}</span>
                    <span className="fc-wrf-mm" style={{ color: rainTone(d.catchmentMeanMm) }}>
                      {Math.round(d.catchmentMeanMm)}
                    </span>
                    <span className="fc-wrf-unit">
                      ↑{Math.round(d.catchmentMaxMm)}
                    </span>
                  </button>
                );
              })}
              <button
                onClick={onToggleWrfLayer}
                aria-pressed={wrfLayerOn}
                className={`mono ${wrfLayerOn ? "active" : ""}`}
                title="Show the selected day's forecast-rain grid on the map (~3 km cells)"
              >
                MAP
              </button>
            </div>
            <div className="eyebrow mono" style={{ color: age?.color ?? "var(--text-3)", marginTop: 2 }}>
              {age ? age.label : null} · mm/24h, catchment mean · ↑ = peak cell
            </div>
          </>
        )}
      </div>

      {/* ── 3 · Seasonal risk calendar ────────────────────────────────── */}
      <div>
        <div className="eyebrow mono" style={{ marginBottom: 4 }}>
          SEASONAL FLOOD CALENDAR · CITY TAMBONS · 17-YEAR RECORD
        </div>
        <div className="fc-calendar">
          <div className="fc-cal-row fc-cal-head">
            <span className="fc-cal-name" />
            {MONTHS.map((m, i) => (
              <span key={i} className={`fc-cal-month mono ${i === currentMonth ? "now" : ""}`}>{m}</span>
            ))}
          </div>
          {SEASONAL_FLOOD_RISK.map((t) => (
            <div key={t.geocode} className="fc-cal-row" title={`${t.th} · worst month flooded ${t.peakFloods17y}× in 17 years`}>
              <span className="fc-cal-name mono">{t.th}</span>
              {t.risk.map((r, i) => (
                <span
                  key={i}
                  className={`fc-cal-cell ${i === currentMonth ? "now" : ""}`}
                  style={{ background: RISK_CELL_COLOR[r] ?? RISK_CELL_COLOR[0] }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="fc-legend mono" aria-label="Calendar risk classes">
          <span><i style={{ background: "var(--bg-3)" }} /> 0</span>
          <span><i style={{ background: "var(--data)" }} /> 1–3</span>
          <span><i style={{ background: "var(--warn)" }} /> 4–8</span>
          <span><i style={{ background: "var(--bad)" }} /> 9+ floods / 17 y</span>
        </div>
        <div className="eyebrow mono" style={{ color: "var(--text-3)", marginTop: 2 }}>
          {SEASONAL_RISK_SOURCE}
        </div>
      </div>

      {/* ── Honesty footer ────────────────────────────────────────────── */}
      <div className="eyebrow mono" style={{ color: "var(--text-3)", borderTop: "1px solid var(--line)", paddingTop: 6, lineHeight: 1.5 }}>
        Scenario = static water level vs surveyed street elevations (HII 2025,
        m MSL, eastern-lowland coverage only) — no flow routing or drainage
        dynamics. Rain outlook = WRF-ROMS model, not observation. Presets are
        real surveyed high-water marks.
      </div>
    </div>
  );
}
