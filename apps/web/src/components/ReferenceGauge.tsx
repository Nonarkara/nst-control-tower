import type { CSSProperties } from "react";
import { STATUS, type StatusLevel } from "../lib/status";

export interface GaugeThreshold { at: number; label: string; level: StatusLevel }
export interface ReferenceGaugeProps {
  label: string; value: number | null; unit: string; max: number;
  ticks: readonly number[]; thresholds: readonly GaugeThreshold[];
  /** Visible provenance/interpretation; thresholds are never implicit. */
  basis: string;
}
const number = (n: number) => Number.isInteger(n) ? String(n) : n.toFixed(1);
export function ReferenceGauge({ label, value, unit, max, ticks, thresholds, basis }: ReferenceGaugeProps) {
  const reading = value != null && Number.isFinite(value) && value >= 0 ? value : null;
  const ordered = [...thresholds].sort((a, b) => a.at - b.at);
  const passed = ordered.filter(t => reading != null && reading >= t.at);
  const crossed = passed.at(-1);
  const next = ordered.find(t => reading != null && reading < t.at);
  const state = reading == null ? "unknown" : crossed ? "crossed" : "below";
  const gapUnit = unit === "%" ? "percentage points" : unit;
  const status = reading == null ? "No usable reading — not zero" : crossed
    ? `${crossed.label}: reached${next ? ` · ${number(next.at - reading)} ${gapUnit} below ${next.label}` : reading > crossed.at ? `; ${number(reading - crossed.at)} ${gapUnit} above` : ""}`
    : next ? `${number(next.at - reading)} ${gapUnit} below ${next.label}` : "No reference threshold";
  const pct = reading == null ? 0 : Math.min(100, reading / max * 100);
  const overflow = reading != null && reading > max;
  const description = `${label}: ${reading == null ? "unknown" : `${number(reading)} ${unit}`}. Scale 0–${max} ${unit}. ${status}.${overflow ? ` Above plotted range by ${number(reading - max)} ${unit}.` : ""}`;
  return <figure className="reference-gauge" data-reading-state={state} data-overflow={overflow || undefined}>
    <figcaption className="reference-gauge__heading"><span>{label}</span><strong className="num">{reading == null ? "—" : `${reading.toFixed(1)} ${unit}`}</strong></figcaption>
    <div className="reference-gauge__plot" role="img" aria-label={description}>
      <div className="reference-gauge__track" aria-hidden="true">
        {reading != null && <span className="reference-gauge__fill" style={{ width: `${pct}%`, background: crossed ? STATUS[crossed.level].color : "var(--data)" }} />}
        {ordered.map(t => <span key={t.at} className="reference-gauge__threshold" data-threshold={t.at} style={{ left: `${t.at / max * 100}%`, "--threshold-color": STATUS[t.level].color } as CSSProperties} />)}
        {reading != null && <span className="reference-gauge__reading" style={{ left: `${pct}%` }} />}
      </div>
      <div className="reference-gauge__ticks" aria-hidden="true">{ticks.map(t => <span key={t} style={{ left: `${t / max * 100}%` }} className={t === 0 ? "is-first" : t === max ? "is-last" : undefined}>{number(t)}</span>)}</div>
    </div>
    <p className="reference-gauge__key">{ordered.map(t => <span key={t.at}><i style={{ background: STATUS[t.level].color }} aria-hidden="true" />{number(t.at)} {unit} {t.label}</span>)}</p>
    <p className="reference-gauge__status">{status}{overflow && ` · Above plotted range (0–${max} ${unit})`}</p>
    <p className="reference-gauge__basis">{basis}</p>
  </figure>;
}
