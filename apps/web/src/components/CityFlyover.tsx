import { useLocale } from "../hooks/useLocale";
import { STATUS } from "../lib/status";
import { CITY_FLYOVER } from "../data/cityFlyover";
import type { FloodScenarioStats } from "../lib/floodScenario";
import { SCENARIO_MIN_M, SCENARIO_MAX_M } from "../lib/floodScenario";
import "../styles/city-flyover.css";

interface Props {
  step: number;
  playing: boolean;
  reducedMotion: boolean;
  onStep: (step: number) => void;
  onPlay: () => void;
  onClose: () => void;
  level: number | null;
  onLevel: (level: number | null) => void;
  stats: FloodScenarioStats | null;
  coverage: "loading" | "ready" | "unavailable";
  surveyStatus: "loading" | "ready" | "unavailable";
}

export function CityFlyover({ step, playing, reducedMotion, onStep, onPlay, onClose, level, onLevel, stats, coverage, surveyStatus }: Props) {
  const stop = CITY_FLYOVER[step]!;
  const { locale } = useLocale();
  const th = locale === "th";
  const last = step === CITY_FLYOVER.length - 1;
  return <><section id="city-flyover-controls" className="city-flyover" aria-label="City flyover controls" tabIndex={-1}>
    <p className="city-flyover-title" aria-live="polite">{step + 1}/{CITY_FLYOVER.length} · {stop.title}</p>
    <div className="city-flyover-actions">
      <button aria-label="Previous flyover stop" disabled={step === 0} onClick={() => onStep(step - 1)}>‹</button>
      <button aria-label={playing ? "Pause flyover" : "Play flyover"} disabled={reducedMotion} title={reducedMotion ? "Reduced motion: use previous and next stops" : undefined} onClick={onPlay}>{playing ? "Ⅱ" : "▶"}</button>
      <button aria-label="Next flyover stop" disabled={step === CITY_FLYOVER.length - 1} onClick={() => onStep(step + 1)}>›</button>
      <button aria-label="End flyover and restore previous map" onClick={onClose}>×</button>
    </div>
    {!last && <p className="city-flyover-note">{reducedMotion && "Reduced motion: use ‹ and ›. "}{coverage === "ready" ? (th ? stop.noteTh : stop.note) : coverage === "unavailable" ? "Satellite-derived infill unavailable; showing base mapped buildings only." : "Loading satellite-derived building coverage…"}</p>}
    {last && <div className="city-flyover-scenario">
      <label htmlFor="flyover-water-level">{th ? "ระดับน้ำสมมติ" : "What-if water level"} · {level == null ? (th ? "ปิด" : "off") : `${level.toFixed(2)} m MSL`}</label>
      <div className="city-flyover-presets">
        <button onClick={() => onLevel(null)} aria-pressed={level == null}>{th ? "ปิด" : "Off"}</button>
        <button disabled={surveyStatus !== "ready"} onClick={() => onLevel(1.24)} aria-pressed={level === 1.24}>1.24 m</button>
        <button disabled={surveyStatus !== "ready"} onClick={() => onLevel(2.12)} aria-pressed={level === 2.12}>2.12 m</button>
      </div>
      <input disabled={surveyStatus !== "ready"} id="flyover-water-level" type="range" min={SCENARIO_MIN_M} max={SCENARIO_MAX_M} step={.01} value={level ?? SCENARIO_MIN_M} onChange={e => onLevel(Number(e.target.value))} aria-label="What-if water level in metres MSL" />
      {surveyStatus !== "ready" && <p role="status">{surveyStatus === "unavailable" ? "HII survey unavailable — no what-if result." : "Loading HII road survey…"}</p>}
      {level != null ? <ul className="city-flyover-depth-key" aria-label="What-if map colors">
        {[["normal", "≥ level"], ["watch", "0–0.3 m"], ["warning", "0.3–0.8 m"], ["critical", ">0.8 m"]].map(([key, label]) => <li key={key}><span style={{background: STATUS[key as keyof typeof STATUS].color}} />{label}</li>)}
      </ul> : <p>{th ? "จุดถนน: น้ำเงินเข้ม = ต่ำ สีอ่อน = สูง" : "Road dots: dark blue = lower, pale = higher."}</p>}
      {level != null && <p role="status">{stats ? (th ? `≈${stats.wetKm.toFixed(1)}/${stats.totalKm.toFixed(1)} กม. ถนนสำรวจต่ำกว่าระดับสมมติ` : `≈${stats.wetKm.toFixed(1)}/${stats.totalKm.toFixed(1)} surveyed road km below level`) : (th ? "กำลังโหลดผลสำรวจ HII…" : "Loading HII road survey…")}</p>}
      <p>{th ? "เทียบระดับถนนเท่านั้น ไม่ใช่พยากรณ์น้ำท่วมคืนนี้" : "Static road-height comparison, not tonight’s flood forecast."}</p>
      <details><summary>{th ? "ข้อมูลและข้อจำกัด" : "Survey & model limits"}</summary>
        <p>{th ? "ถนนฝั่งตะวันออกที่ HII สำรวจปี 2025 เท่านั้น ไม่รวมการไหล การระบายน้ำ หรือเวลาที่น้ำมาถึง" : "HII 2025 eastern-road survey only. No flow routing, drainage or arrival time."}</p>
        <p>{th ? "ป้ายคือรอยน้ำสูงในอดีต (ม. รทก.) ไม่ใช่มาตรวัดปัจจุบัน ค่าตั้งต้นคือมัธยฐานฤดูปกติ / รอยน้ำสูงสุดปาบึก 2019" : "Labels are past high-water marks (m MSL), not current gauges. Presets: normal-season median / Pabuk2019 maximum marks."}</p>
      </details>
    </div>}
  </section><a className="city-demo-imagery-credit" href="https://goto.arcgisonline.com/maps/World_Imagery" target="_blank" rel="noreferrer">Imagery © Esri, Vantor, Earthstar Geographics, GIS User Community</a></>;
}
