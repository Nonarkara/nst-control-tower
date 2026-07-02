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
 * Bilingual (EN/TH): every user-facing string is routed through useLocale().t()
 * so the panel reads natively in Thai for municipal operators. The IBM Plex
 * Sans Thai font (loaded in main.tsx) renders the Thai glyphs.
 *
 * Honesty rules baked in: the scenario is a static-level (bathtub) comparison
 * with no flow routing; coverage is the HII survey area (eastern lowland);
 * WRF is a model forecast. All three caveats are shown in the footer.
 */

import { useMemo } from "react";
import type { Feature, FeatureCollection, Point } from "geojson";
import type { WrfRainDay } from "@nst/shared";
import { PanelHeader } from "./PanelHeader";
import { useLocale, type LocalizableText } from "../hooks/useLocale";
import type { FloodMarkProps, RoadLevelProps } from "../map/layers";
import {
  SCENARIO_PRESETS,
  SCENARIO_MIN_M,
  SCENARIO_MAX_M,
  buildScenarioIndex,
  floodScenarioStats,
} from "../lib/floodScenario";
import { SEASONAL_FLOOD_RISK, SEASONAL_RISK_SOURCE } from "../data/seasonalFloodRisk";

/**
 * Localized UI strings. Module scope so the objects are built once, not on
 * every render. Interpolated strings (impact readout, run-age, day titles)
 * are assembled inline in the component via `t({ en, th })`.
 */
const STR = {
  title: { en: "FLOOD COMMAND // GOD MODE", th: "ศูนย์บัญชาการน้ำท่วม // โหมดควบคุมรวม" },
  scenarioEyebrow: { en: "STREET SCENARIO · WATER LEVEL (m MSL)", th: "สถานการณ์ถนน · ระดับน้ำ (ม. รทก.)" },
  off: { en: "OFF", th: "ปิด" },
  offTitle: { en: "Scenario off — streets colored by surveyed elevation instead", th: "ปิดสถานการณ์ — ถนนระบายสีตามระดับความสูงที่สำรวจแทน" },
  presetNormal: { en: "NORMAL FLOOD", th: "น้ำท่วมปกติ" },
  presetNormalTitle: { en: "Median surveyed normal-season high-water mark", th: "ระดับน้ำมัธยฐานที่สำรวจในช่วงน้ำท่วมปกติ" },
  presetPabuk: { en: "PABUK 2019 MAX", th: "ปาบุก 2019 สูงสุด" },
  presetPabukTitle: { en: "Highest surveyed Tropical Storm Pabuk (Jan 2019) high-water mark", th: "ระดับน้ำสูงสุดที่สำรวจจากพายุโซนร้อนปาบุก (ม.ค. 2019)" },
  sliderLabel: { en: "Scenario water level in metres above mean sea level", th: "ระดับน้ำสถานการณ์เป็นเมตรจากระดับน้ำทะเลปานกลาง" },
  loading: { en: "Loading the street elevation survey (18,359 points)…", th: "กำลังโหลดการสำรวจระดับความสูงถนน (18,359 จุด)…" },
  legendDry: { en: "dry", th: "แห้ง" },
  legendShallow: { en: "<0.3 m", th: "<0.3 ม." },
  legendCar: { en: "0.3–0.8 m (cars impassable)", th: "0.3–0.8 ม. (รถผ่านไม่ได้)" },
  legendDeep: { en: ">0.8 m", th: ">0.8 ม." },
  legendLowOff: { en: "lowest streets", th: "ถนนต่ำสุด" },
  legendMedOff: { en: "~median (1.5 m MSL)", th: "~มัธยฐาน (1.5 ม. รทก.)" },
  legendHighOff: { en: "high ground", th: "พื้นที่สูง" },
  legendAria: { en: "Street scenario map colors", th: "สีแผนที่สถานการณ์ถนน" },
  enableHint: { en: 'Enable "Street levels / flood scenario" (FLOOD lens) to see it on the map.', th: 'เปิด "ระดับถนน / สถานการณ์น้ำท่วม" (เลนส์น้ำท่วม) เพื่อดูบนแผนที่' },
  watershedEyebrow: { en: "WATERSHED RAIN · WRF-ROMS · KHAO LUANG→CITY", th: "ฝนลุ่มน้ำ · WRF-ROMS · เขาหลวง→เมือง" },
  wrfAwaiting: { en: "Awaiting WRF-ROMS model feed.", th: "รอข้อมูลแบบจำลอง WRF-ROMS" },
  mapBtn: { en: "MAP", th: "แผนที่" },
  mapTitle: { en: "Show the selected day's forecast-rain grid on the map (~3 km cells)", th: "แสดงกริดฝนพยากรณ์ของวันที่เลือกบนแผนที่ (~3 กม.)" },
  unitsLine: { en: "mm/24h, catchment mean · ↑ = peak cell", th: "มม./24ชม. เฉลี่ยลุ่มน้ำ · ↑ = เซลล์สูงสุด" },
  seasonalEyebrow: { en: "SEASONAL FLOOD CALENDAR · CITY TAMBONS · 17-YEAR RECORD", th: "ปฏิทินน้ำท่วมตามฤดู · ตำบลในเมือง · ข้อมูล 17 ปี" },
  calendarAria: { en: "Calendar risk classes", th: "ระดับความเสี่ยงในปฏิทิน" },
  legend9plus: { en: "9+ floods / 17 y", th: "9+ ครั้ง / 17 ปี" },
  source: { en: "hii-survey · wrf-roms · gistda", th: "hii-survey · wrf-roms · gistda" },
  footer: {
    en: "Scenario = static water level vs surveyed street elevations (HII 2025, m MSL, eastern-lowland coverage only) — no flow routing or drainage dynamics. Rain outlook = WRF-ROMS model, not observation. Presets are real surveyed high-water marks.",
    th: "สถานการณ์ = ระดับน้ำคงที่เทียบกับระดับถนนที่สำรวจ (HII 2025, ม. รทก., ครอบคลุมเฉพาะพื้นที่ราบตะวันออก) — ไม่มีการไหลหรือพลศาสตร์การระบายน้ำ ฝนพยากรณ์ = แบบจำลอง WRF-ROMS ไม่ใช่การวัดจริง ค่าตั้งต้นคือระดับน้ำสูงสุดที่สำรวจจริง",
  },
} satisfies Record<string, LocalizableText>;

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

/** "2026-07-04" → "SAT 4/7" (or the localized "today"). */
function dayLabel(validDate: string, todayLabel: string): string {
  if (validDate === bangkokToday()) return todayLabel;
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
function runAge(runId: string | undefined, locale: string): { hours: number; label: string; color: string } | null {
  const m = runId?.match(/^(\d{4}-\d{2}-\d{2})_(\d{2})UTC$/);
  if (!m) return null;
  const t = new Date(`${m[1]}T${m[2]}:00:00Z`).getTime();
  if (Number.isNaN(t)) return null;
  const hours = Math.max(0, Math.round((Date.now() - t) / 3_600_000));
  const [, mo, day] = m[1].split("-");
  // EN "RUN 1/7 12Z · 31 H AGO" · TH "รัน 1/7 12Z · 31 ชม. ที่แล้ว"
  const label = locale === "th"
    ? `รัน ${Number(day)}/${Number(mo)} ${m[2]}Z · ${hours} ชม. ที่แล้ว`
    : `RUN ${Number(day)}/${Number(mo)} ${m[2]}Z · ${hours} H AGO`;
  return {
    hours,
    label,
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
  const { t, locale } = useLocale();

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
  const age = wrfOutlook[0] ? runAge(wrfOutlook[0].runId, locale) : null;
  const today = bangkokToday();

  return (
    <div className="col" style={{ gap: 8 }}>
      {/* No ageMinutes/fallbackTier here on purpose: those describe only the
          WRF feed, while most of this panel is static survey data — a WRF
          outage must not stamp the whole panel OFFLINE. The WRF section
          carries its own run-age line + empty state instead. */}
      <PanelHeader title={t(STR.title)} source={t(STR.source)} />

      {/* ── 1 · Street-flood scenario ─────────────────────────────────── */}
      <div>
        <div className="eyebrow mono" style={{ marginBottom: 4 }}>
          {t(STR.scenarioEyebrow)}
        </div>
        <div className="fc-presets">
          <button
            onClick={() => onScenarioChange(null)}
            aria-pressed={scenarioLevel == null}
            className={`mono ${scenarioLevel == null ? "active" : ""}`}
            title={t(STR.offTitle)}
          >
            {t(STR.off)}
          </button>
          {SCENARIO_PRESETS.map((p) => {
            const label = p.key === "pabuk" ? STR.presetPabuk : STR.presetNormal;
            const title = p.key === "pabuk" ? STR.presetPabukTitle : STR.presetNormalTitle;
            return (
              <button
                key={p.key}
                onClick={() => onScenarioChange(p.levelM)}
                aria-pressed={scenarioLevel === p.levelM}
                className={`mono ${scenarioLevel === p.levelM ? "active" : ""}`}
                title={t(title)}
              >
                {t(label)} {p.levelM.toFixed(2)}
              </button>
            );
          })}
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
          aria-label={t(STR.sliderLabel)}
        />
        {scenarioLevel != null && !stats && (
          <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
            {t(STR.loading)}
          </div>
        )}
        {scenarioLevel != null && stats && (
          <div className="fc-impact mono">
            <span style={{ color: stats.wetShare > 0.5 ? "var(--bad)" : stats.wetShare > 0.15 ? "var(--warn)" : "var(--good)" }}>
              {t({
                en: `${(stats.wetShare * 100).toFixed(0)}% of surveyed streets under water`,
                th: `${(stats.wetShare * 100).toFixed(0)}% ของถนนที่สำรวจอยู่ใต้น้ำ`,
              })}
            </span>
            <span className="fc-impact-sub">
              {t({
                en: `≈ ${stats.wetKm.toFixed(1)} of ${stats.totalKm.toFixed(1)} km · deepest ${stats.deepestM.toFixed(2)} m · exceeds ${stats.marksExceeded}/${stats.marksTotal} historical marks`,
                th: `≈ ${stats.wetKm.toFixed(1)} จาก ${stats.totalKm.toFixed(1)} กม. · ลึกสุด ${stats.deepestM.toFixed(2)} ม. · เกิน ${stats.marksExceeded}/${stats.marksTotal} ระดับน้ำในประวัติ`,
              })}
            </span>
          </div>
        )}
        {/* Map color legend — the depth classes double as passability guidance. */}
        <div className="fc-legend mono" aria-label={t(STR.legendAria)}>
          {scenarioLevel != null ? (
            <>
              <span><i style={{ background: "rgb(74,222,128)" }} /> {t(STR.legendDry)}</span>
              <span><i style={{ background: "rgb(251,191,36)" }} /> {t(STR.legendShallow)}</span>
              <span><i style={{ background: "rgb(249,115,22)" }} /> {t(STR.legendCar)}</span>
              <span><i style={{ background: "rgb(220,38,38)" }} /> {t(STR.legendDeep)}</span>
            </>
          ) : (
            <>
              <span><i style={{ background: "rgb(30,64,175)" }} /> {t(STR.legendLowOff)}</span>
              <span><i style={{ background: "rgb(59,130,246)" }} /> {t(STR.legendMedOff)}</span>
              <span><i style={{ background: "rgb(226,232,240)" }} /> {t(STR.legendHighOff)}</span>
            </>
          )}
        </div>
        {scenarioLevel != null && !scenarioLayerOn && (
          <div className="eyebrow mono" style={{ color: "var(--warn)" }}>
            {t(STR.enableHint)}
          </div>
        )}
      </div>

      {/* ── 2 · 3-day watershed rain (WRF-ROMS) ───────────────────────── */}
      <div>
        <div className="eyebrow mono" style={{ marginBottom: 4 }}>
          {t(STR.watershedEyebrow)}
        </div>
        {wrfOutlook.length === 0 ? (
          <div className="eyebrow mono" style={{ color: "var(--text-3)" }}>
            {wrfNote ?? t(STR.wrfAwaiting)}
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
                    title={t({
                      en: `Valid ${d.validDate}${isPast ? " (already past)" : ""} · catchment mean ${d.catchmentMeanMm} / max ${d.catchmentMaxMm} mm · city mean ${d.cityMeanMm} mm`,
                      th: `ใช้ได้ ${d.validDate}${isPast ? " (ผ่านไปแล้ว)" : ""} · เฉลี่ยลุ่มน้ำ ${d.catchmentMeanMm} / สูงสุด ${d.catchmentMaxMm} มม. · เฉลี่ยเมือง ${d.cityMeanMm} มม.`,
                    })}
                  >
                    <span className="fc-wrf-label">{dayLabel(d.validDate, t({ en: "TODAY", th: "วันนี้" }))}</span>
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
                title={t(STR.mapTitle)}
              >
                {t(STR.mapBtn)}
              </button>
            </div>
            <div className="eyebrow mono" style={{ color: age?.color ?? "var(--text-3)", marginTop: 2 }}>
              {age ? age.label : null} · {t(STR.unitsLine)}
            </div>
          </>
        )}
      </div>

      {/* ── 3 · Seasonal risk calendar ────────────────────────────────── */}
      <div>
        <div className="eyebrow mono" style={{ marginBottom: 4 }}>
          {t(STR.seasonalEyebrow)}
        </div>
        <div className="fc-calendar">
          <div className="fc-cal-row fc-cal-head">
            <span className="fc-cal-name" />
            {MONTHS.map((m, i) => (
              <span key={i} className={`fc-cal-month mono ${i === currentMonth ? "now" : ""}`}>{m}</span>
            ))}
          </div>
          {/* `tb` (tambon), NOT `t` — the translator `t` from useLocale is in scope. */}
          {SEASONAL_FLOOD_RISK.map((tb) => (
            <div key={tb.geocode} className="fc-cal-row" title={t({
              en: `${tb.en} · worst month flooded ${tb.peakFloods17y}× in 17 years`,
              th: `${tb.th} · เดือนเลวร้ายที่สุดที่ท่วม ${tb.peakFloods17y} ครั้งใน 17 ปี`,
            })}>
              <span className="fc-cal-name mono">{locale === "th" ? tb.th : tb.en}</span>
              {tb.risk.map((r, i) => (
                <span
                  key={i}
                  className={`fc-cal-cell ${i === currentMonth ? "now" : ""}`}
                  style={{ background: RISK_CELL_COLOR[r] ?? RISK_CELL_COLOR[0] }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="fc-legend mono" aria-label={t(STR.calendarAria)}>
          <span><i style={{ background: "var(--bg-3)" }} /> 0</span>
          <span><i style={{ background: "var(--data)" }} /> 1–3</span>
          <span><i style={{ background: "var(--warn)" }} /> 4–8</span>
          <span><i style={{ background: "var(--bad)" }} /> {t(STR.legend9plus)}</span>
        </div>
        <div className="eyebrow mono" style={{ color: "var(--text-3)", marginTop: 2 }}>
          {t({
            en: SEASONAL_RISK_SOURCE,
            th: "hii.or.th พื้นที่เสี่ยงน้ำท่วม · บันทึกดาวเทียม GISTDA 2548–2564",
          })}
        </div>
      </div>

      {/* ── Honesty footer ────────────────────────────────────────────── */}
      <div className="eyebrow mono" style={{ color: "var(--text-3)", borderTop: "1px solid var(--line)", paddingTop: 6, lineHeight: 1.5 }}>
        {t(STR.footer)}
      </div>
    </div>
  );
}
