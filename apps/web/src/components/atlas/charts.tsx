import type {
  AtlasChart,
  AtlasModule,
  Indicator,
  NamedValue,
  ChartSeries,
} from "@nst/shared";

/**
 * Nakhon Si Thammarat Data Atlas — SVG chart kit.
 * Declarative: `ChartRenderer` switches on AtlasChart.kind, so a new domain is
 * pure data. On-brand (teal/gold on near-black), no rounding/shadow/blur
 * (enforced globally), tabular-num readouts. Every chart is viewBox-based and
 * scales to its container width.
 */

// ── palette ─────────────────────────────────────────────────────────────────
const TEAL = "var(--accent)";
const GOLD = "var(--gold)";
const CATEGORICAL = [
  "var(--accent)", "var(--gold)", "var(--data)", "var(--good)",
  "#a78bfa", "#f472b6", "#22d3ee", "#fb923c", "#94a3b8", "#facc15",
];
const catColor = (i: number, explicit?: string) => explicit ?? CATEGORICAL[i % CATEGORICAL.length];

const STATUS_COLOR: Record<string, string> = {
  good: "var(--good)", watch: "var(--gold)", alert: "#fb923c",
  critical: "var(--bad)", neutral: "var(--text-2)",
};

// ── number formatting ─────────────────────────────────────────────────────────
function fmtNum(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (abs >= 1_000) return (n / 1_000).toFixed(abs >= 10_000 ? 0 : 1) + "k";
  if (!Number.isInteger(n)) return n.toFixed(abs < 10 ? 2 : 1);
  return n.toLocaleString("en-US");
}
function fmtVal(v: number | string): string {
  return typeof v === "number" ? fmtNum(v) : v;
}

// ── KPI card (Indicator) ──────────────────────────────────────────────────────
export function KpiCard({ ind }: { ind: Indicator }) {
  const statusColor = ind.status ? STATUS_COLOR[ind.status] : "var(--text)";
  const good = ind.goodDirection ?? "neutral";
  const deltaGood =
    !ind.delta || good === "neutral"
      ? null
      : (ind.delta.trend === "up") === (good === "up");
  const deltaColor = deltaGood == null ? "var(--text-2)" : deltaGood ? "var(--good)" : "var(--bad)";
  const arrow = ind.delta?.trend === "up" ? "▲" : ind.delta?.trend === "down" ? "▼" : "▸";

  return (
    <div className="atlas-kpi" style={{ borderTop: `2px solid ${statusColor}` }}>
      <div className="atlas-kpi-label eyebrow">{ind.label}</div>
      <div className="atlas-kpi-value mono" style={{ color: statusColor }}>
        {fmtVal(ind.value)}
        {ind.unit ? <span className="atlas-kpi-unit"> {ind.unit}</span> : null}
      </div>
      <div className="atlas-kpi-meta">
        {ind.rank ? (
          <span className="atlas-kpi-rank mono">#{ind.rank.pos}<span className="dim">/{ind.rank.of}</span></span>
        ) : null}
        {ind.benchmark != null ? (
          <span className="atlas-kpi-bench">{ind.benchmark.label} {fmtVal(ind.benchmark.value)}</span>
        ) : null}
        {ind.delta ? (
          <span className="mono" style={{ color: deltaColor }}>{arrow} {fmtNum(Math.abs(ind.delta.value))}{ind.delta.unit ?? ""}</span>
        ) : null}
      </div>
      <div className="atlas-kpi-src caption">
        {ind.source}{ind.year ? ` · ${ind.year}` : ""}{ind.note ? ` · ${ind.note}` : ""}
      </div>
    </div>
  );
}

// ── small svg helpers ──────────────────────────────────────────────────────────
const W = 360; // logical width; svg scales to container
function ChartFrame({ title, note, children, h = 200 }: { title: string; note?: string; children: React.ReactNode; h?: number }) {
  return (
    <figure className="atlas-chart">
      <figcaption className="atlas-chart-title eyebrow">{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${h}`} width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label={title}>
        {children}
      </svg>
      {note ? <div className="atlas-chart-note caption">{note}</div> : null}
    </figure>
  );
}
function Legend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <div className="atlas-legend">
      {items.map((it) => (
        <span key={it.name} className="atlas-legend-item caption">
          <i style={{ background: it.color }} /> {it.name}
        </span>
      ))}
    </div>
  );
}

// ── Donut ────────────────────────────────────────────────────────────────────
function Donut({ data, unit, centerLabel, title, note }: Extract<AtlasChart, { kind: "donut" }>) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 100, cy = 100, r = 72, sw = 30;
  let acc = 0;
  const C = 2 * Math.PI * r;
  return (
    <ChartFrame title={title} note={note} h={210}>
      <g transform={`translate(${cx - 100 + 100}, 5)`}>
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = `${frac * C} ${C}`;
          const off = -acc * C;
          acc += frac;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={catColor(i, d.color)}
              strokeWidth={sw} strokeDasharray={dash} strokeDashoffset={off}
              transform={`rotate(-90 ${cx} ${cy})`} />
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" className="atlas-svg-big" fill="var(--text)">{centerLabel ?? fmtNum(total)}</text>
        {unit ? <text x={cx} y={cy + 14} textAnchor="middle" className="atlas-svg-cap" fill="var(--text-2)">{unit}</text> : null}
      </g>
      <g>
        {data.map((d, i) => (
          <g key={i} transform={`translate(215, ${28 + i * 22})`}>
            <rect width="10" height="10" y="-9" fill={catColor(i, d.color)} />
            <text x="16" y="0" className="atlas-svg-cap" fill="var(--text-1)">{d.name}</text>
            <text x="145" y="0" textAnchor="end" className="atlas-svg-cap mono" fill="var(--text-2)">{Math.round((d.value / total) * 100)}%</text>
          </g>
        ))}
      </g>
    </ChartFrame>
  );
}

// ── Bar (vertical) ─────────────────────────────────────────────────────────────
function Bar({ data, unit, title, note }: Extract<AtlasChart, { kind: "bar" }>) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const pad = 28, base = 165, bw = (W - pad * 2) / data.length;
  return (
    <ChartFrame title={title} note={note} h={200}>
      <line x1={pad} y1={base} x2={W - pad} y2={base} stroke="var(--line)" />
      {data.map((d, i) => {
        const h = (d.value / max) * 120;
        const x = pad + i * bw + bw * 0.18;
        const w = bw * 0.64;
        return (
          <g key={i}>
            <rect x={x} y={base - h} width={w} height={h} fill={catColor(i, d.color)} />
            <text x={x + w / 2} y={base - h - 5} textAnchor="middle" className="atlas-svg-cap mono" fill="var(--text-1)">{fmtNum(d.value)}</text>
            <text x={x + w / 2} y={base + 14} textAnchor="middle" className="atlas-svg-tick" fill="var(--text-2)">{d.name}</text>
          </g>
        );
      })}
      {unit ? <text x={pad} y={16} className="atlas-svg-tick" fill="var(--text-3)">{unit}</text> : null}
    </ChartFrame>
  );
}

// ── HBar (horizontal, good for rankings) ────────────────────────────────────────
function HBar({ data, unit, title, note }: Extract<AtlasChart, { kind: "hbar" }>) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const rowH = 26, labelW = 120, x0 = labelW, h = data.length * rowH + 18;
  return (
    <ChartFrame title={title} note={note} h={h}>
      {data.map((d, i) => {
        const w = (d.value / max) * (W - x0 - 46);
        const y = 10 + i * rowH;
        return (
          <g key={i}>
            <text x={labelW - 6} y={y + 12} textAnchor="end" className="atlas-svg-cap" fill="var(--text-1)">{d.name}</text>
            <rect x={x0} y={y + 2} width={Math.max(w, 1)} height={14} fill={catColor(i, d.color)} />
            <text x={x0 + w + 5} y={y + 13} className="atlas-svg-cap mono" fill="var(--text-2)">{fmtNum(d.value)}{unit ? ` ${unit}` : ""}</text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

// ── Line / Area ────────────────────────────────────────────────────────────────
function LineArea({ series, unit, title, note, area }: Extract<AtlasChart, { kind: "line" | "area" }> & { area: boolean }) {
  const all = series.flatMap((s) => s.points);
  const xs = all.map((p) => Number(p.x));
  const ys = all.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const maxY = Math.max(...ys, 1), minY = Math.min(...ys, 0);
  const padL = 36, padR = 14, padT = 14, padB = 24, base = 170;
  const sx = (x: number) => padL + ((x - minX) / (maxX - minX || 1)) * (W - padL - padR);
  const sy = (y: number) => base - ((y - minY) / (maxY - minY || 1)) * (base - padT);
  return (
    <ChartFrame title={title} note={note} h={196}>
      {[0, 0.5, 1].map((f, i) => {
        const y = base - f * (base - padT);
        const v = minY + f * (maxY - minY);
        return <g key={i}><line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--line)" strokeDasharray="2 3" /><text x={4} y={y + 3} className="atlas-svg-tick" fill="var(--text-3)">{fmtNum(v)}</text></g>;
      })}
      {series.map((s, si) => {
        const col = s.color ?? catColor(si);
        const pts = s.points.map((p) => `${sx(Number(p.x))},${sy(p.y)}`).join(" ");
        const areaPts = `${sx(Number(s.points[0].x))},${base} ${pts} ${sx(Number(s.points[s.points.length - 1].x))},${base}`;
        return (
          <g key={si}>
            {area ? <polygon points={areaPts} fill={col} opacity={0.16} /> : null}
            <polyline points={pts} fill="none" stroke={col} strokeWidth={2} />
            {s.points.map((p, i) => <circle key={i} cx={sx(Number(p.x))} cy={sy(p.y)} r={2} fill={col} />)}
          </g>
        );
      })}
      {series[0].points.map((p, i) => i % Math.ceil(series[0].points.length / 6) === 0 ? (
        <text key={i} x={sx(Number(p.x))} y={base + 16} textAnchor="middle" className="atlas-svg-tick" fill="var(--text-3)">{p.x}</text>
      ) : null)}
      {unit ? <text x={padL} y={10} className="atlas-svg-tick" fill="var(--text-3)">{unit}</text> : null}
    </ChartFrame>
  );
}

// ── Population pyramid ───────────────────────────────────────────────────────────
function Pyramid({ bands, male, female, unit, title, note }: Extract<AtlasChart, { kind: "pyramid" }>) {
  const max = Math.max(...male, ...female, 1);
  const rowH = Math.min(20, 150 / bands.length), midGap = 46, cx = W / 2;
  const half = (W - midGap) / 2 - 30;
  const h = bands.length * rowH + 26;
  return (
    <ChartFrame title={title} note={note} h={h}>
      <Legend items={[{ name: "Male", color: TEAL }, { name: "Female", color: "var(--data)" }]} />
      {bands.map((b, i) => {
        const y = 8 + i * rowH;
        const mw = (male[i] / max) * half;
        const fw = (female[i] / max) * half;
        return (
          <g key={i}>
            <rect x={cx - midGap / 2 - mw} y={y} width={mw} height={rowH - 3} fill={TEAL} />
            <rect x={cx + midGap / 2} y={y} width={fw} height={rowH - 3} fill="var(--data)" />
            <text x={cx} y={y + rowH - 5} textAnchor="middle" className="atlas-svg-tick" fill="var(--text-2)">{b}</text>
          </g>
        );
      })}
      {unit ? <text x={4} y={h - 4} className="atlas-svg-tick" fill="var(--text-3)">{unit}</text> : null}
    </ChartFrame>
  );
}

// ── Radar ────────────────────────────────────────────────────────────────────────
function Radar({ axes, max, title, note }: Extract<AtlasChart, { kind: "radar" }>) {
  const cx = W / 2, cy = 110, r = 86;
  const m = max ?? Math.max(...axes.map((a) => a.value), 1);
  const n = axes.length;
  const pt = (i: number, frac: number) => {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(ang) * r * frac, cy + Math.sin(ang) * r * frac];
  };
  const poly = axes.map((a, i) => pt(i, a.value / m).join(",")).join(" ");
  return (
    <ChartFrame title={title} note={note} h={236}>
      {[0.25, 0.5, 0.75, 1].map((f, gi) => (
        <polygon key={gi} points={axes.map((_, i) => pt(i, f).join(",")).join(" ")} fill="none" stroke="var(--line)" strokeDasharray="2 3" />
      ))}
      {axes.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" />; })}
      <polygon points={poly} fill={TEAL} opacity={0.22} stroke={TEAL} strokeWidth={2} />
      {axes.map((a, i) => { const [x, y] = pt(i, 1.16); return <text key={i} x={x} y={y} textAnchor="middle" className="atlas-svg-tick" fill="var(--text-2)">{a.name}</text>; })}
    </ChartFrame>
  );
}

// ── Grouped bar ────────────────────────────────────────────────────────────────
function GroupedBar({ groups, unit, title, note }: Extract<AtlasChart, { kind: "grouped-bar" }>) {
  const max = Math.max(...groups.flatMap((g) => g.values.map((v) => v.value)), 1);
  const pad = 30, base = 158, gw = (W - pad * 2) / groups.length;
  const series = groups[0]?.values.map((v) => v.name) ?? [];
  return (
    <ChartFrame title={title} note={note} h={196}>
      <Legend items={series.map((n, i) => ({ name: n, color: catColor(i) }))} />
      <line x1={pad} y1={base} x2={W - pad} y2={base} stroke="var(--line)" />
      {groups.map((g, gi) => {
        const bw = (gw * 0.72) / g.values.length;
        return (
          <g key={gi}>
            {g.values.map((v, i) => {
              const h = (v.value / max) * 110;
              const x = pad + gi * gw + gw * 0.14 + i * bw;
              return <rect key={i} x={x} y={base - h} width={bw - 2} height={h} fill={catColor(i, v.color)} />;
            })}
            <text x={pad + gi * gw + gw / 2} y={base + 14} textAnchor="middle" className="atlas-svg-tick" fill="var(--text-2)">{g.label}</text>
          </g>
        );
      })}
      {unit ? <text x={pad} y={26} className="atlas-svg-tick" fill="var(--text-3)">{unit}</text> : null}
    </ChartFrame>
  );
}

// ── Timeline (discrete events, e.g. floods) ──────────────────────────────────────
function Timeline({ events, title, note }: Extract<AtlasChart, { kind: "timeline" }>) {
  return (
    <ChartFrame title={title} note={note} h={Math.max(70, events.length * 34 + 16)}>
      <line x1={20} y1={14} x2={20} y2={events.length * 34} stroke="var(--line)" />
      {events.map((e, i) => {
        const y = 18 + i * 34;
        const col = e.severity ? STATUS_COLOR[e.severity] : GOLD;
        return (
          <g key={i}>
            <circle cx={20} cy={y} r={4} fill={col} />
            <text x={34} y={y - 2} className="atlas-svg-cap" fill="var(--text)">{e.label}</text>
            <text x={34} y={y + 12} className="atlas-svg-tick" fill="var(--text-2)">{e.date}{e.value != null ? ` · ${fmtNum(e.value)}` : ""}{e.note ? ` · ${e.note}` : ""}</text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

// ── dispatcher ──────────────────────────────────────────────────────────────────
export function ChartRenderer({ chart }: { chart: AtlasChart }) {
  switch (chart.kind) {
    case "donut": return <Donut {...chart} />;
    case "bar": return <Bar {...chart} />;
    case "hbar": return <HBar {...chart} />;
    case "line": return <LineArea {...chart} area={false} />;
    case "area": return <LineArea {...chart} area />;
    case "pyramid": return <Pyramid {...chart} />;
    case "radar": return <Radar {...chart} />;
    case "grouped-bar": return <GroupedBar {...chart} />;
    case "timeline": return <Timeline {...chart} />;
    default: return null;
  }
}

// ── module view: KPI grid + charts grid ──────────────────────────────────────────
export function AtlasModuleView({ module }: { module: AtlasModule }) {
  return (
    <section className="atlas-module" id={`atlas-${module.id}`}>
      <header className="atlas-module-head">
        <h3>{module.title}{module.titleTh ? <span className="atlas-module-th"> {module.titleTh}</span> : null}</h3>
        <p className="atlas-module-summary caption">{module.summary}</p>
      </header>
      {module.indicators.length > 0 ? (
        <div className="atlas-kpi-grid">
          {module.indicators.map((ind) => <KpiCard key={ind.id} ind={ind} />)}
        </div>
      ) : null}
      {module.charts.length > 0 ? (
        <div className="atlas-chart-grid">
          {module.charts.map((c, i) => <ChartRenderer key={i} chart={c} />)}
        </div>
      ) : null}
    </section>
  );
}
