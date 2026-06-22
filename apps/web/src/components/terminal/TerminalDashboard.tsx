import { useEffect, useRef, useState } from "react";
import type { AtlasChart } from "@nst/shared";
import { API_BASE } from "../../lib/apiBase";
import { ChartRenderer } from "../atlas/charts";

/**
 * Nakhon Si Thammarat Watch Terminal (System B) — a Bloomberg-style "global watch" for Nakhon Si Thammarat
 * City Municipality + the Southern Thailand. Dense real-time panels, each juxtaposed
 * with the important static reference figure that makes the live number mean
 * something. Flips back to the geo dashboard via the header button.
 */

// ── data hook ────────────────────────────────────────────────────────────────
function useJSON<T = any>(path: string, refreshMs = 120_000): T | null {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(`${API_BASE}${path}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => alive && setData(j))
        .catch(() => {});
    load();
    const id = window.setInterval(load, refreshMs);
    return () => { alive = false; window.clearInterval(id); };
  }, [path, refreshMs]);
  return data;
}

const feat = (d: any) => (d?.features ?? [])[0] ?? null;
const num = (v: any): number | null => (typeof v === "number" && isFinite(v) ? v : null);
const fmt = (v: number | null, dp = 0) => (v == null ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: dp }));

// ── clock ───────────────────────────────────────────────────────────────────
function Clock() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const t = () => setNow(new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "Asia/Bangkok" }) + " ICT");
    t(); const id = window.setInterval(t, 1000); return () => window.clearInterval(id);
  }, []);
  return <span className="term-clock">{now}</span>;
}

// ── panel shell ──────────────────────────────────────────────────────────────
function Panel({ title, led, src, span2, children }: { title: string; led?: "live" | "warn" | "crit"; src?: string; span2?: boolean; children: React.ReactNode }) {
  return (
    <section className={`term-panel${span2 ? " span2" : ""}`}>
      <header className="term-panel-head">
        <span className={`term-led ${led ?? ""}`} />
        <h3>{title}</h3>
        {src ? <span className="term-src">{src}</span> : null}
      </header>
      <div className="term-panel-body">{children}</div>
    </section>
  );
}

const sevPill = (s: string, label: string) => <span className={`term-pill ${s}`}>{label}</span>;

export function TerminalDashboard({ onFlip }: { onFlip: () => void }) {
  const aq = useJSON("/api/air-quality", 5 * 60_000);
  const dam = useJSON("/api/flood/dam", 10 * 60_000);
  const gauges = useJSON("/api/flood/gauges", 10 * 60_000);
  const news = useJSON("/api/news", 3 * 60_000);
  const acled = useJSON("/api/security/incidents", 30 * 60_000);
  const secStatus = useJSON("/api/security/status", 60 * 60_000);
  const trends = useJSON("/api/trends", 30 * 60_000);
  const markets = useJSON("/api/markets", 60_000);
  const atlas = useJSON("/api/atlas", 60 * 60_000);
  const insights = useJSON("/api/insights", 30 * 60_000);
  const archive = useJSON("/api/archive", 5 * 60_000);
  const weather = useJSON("/api/weather", 30 * 60_000);

  // ── derived live values ────────────────────────────────────────────────────
  const pm25 = num(feat(aq)?.pm25);
  const aqi = num(feat(aq)?.aqi);
  const damF = feat(dam);
  const outflow = num(damF?.outflowCms);
  const gaugeList: any[] = gauges?.features ?? [];
  const worstGauge = gaugeList.find((g) => g.status === "flood" || g.status === "warning") ?? gaugeList[0];
  const newsItems: any[] = news?.features ?? [];
  const secNews = newsItems.filter((n) => Array.isArray(n.tags) && n.tags.includes("SEC")).length;
  const acledItems: any[] = acled?.features ?? [];
  const acledFatal = acledItems.reduce((s, i) => s + (num(i.fatalities) ?? 0), 0);
  const sec = feat(secStatus);
  const tnd = feat(trends);
  const tempC = num(feat(weather)?.tempC);

  // ── static reference (from the atlas) ──────────────────────────────────────
  const atlasModules: any[] = atlas?.modules ?? [];
  const indByLabel = (label: string) => {
    for (const m of atlasModules) for (const i of m.indicators) if (String(i.label).toLowerCase().includes(label.toLowerCase())) return i;
    return null;
  };
  const poverty = indByLabel("MPI poverty rate");
  const neet = indByLabel("NEET");
  const eduRank = indByLabel("HAI — Education");

  // ── ticker items ────────────────────────────────────────────────────────────
  const ticker: Array<{ lab: string; val: string; cls?: string }> = [
    { lab: "PM2.5", val: pm25 != null ? `${fmt(pm25, 1)} µg/m³` : "—", cls: pm25 != null && pm25 > 35 ? "down" : "up" },
    { lab: "AQI", val: aqi != null ? String(aqi) : "—" },
    { lab: "Dam outflow", val: outflow != null ? `${fmt(outflow, 1)} m³/s` : "—" },
    { lab: "River", val: worstGauge ? String(worstGauge.status).toUpperCase() : "—", cls: worstGauge?.status === "normal" ? "up" : "down" },
    { lab: "News 24h", val: String(newsItems.length) },
    { lab: "SEC-tagged", val: String(secNews), cls: secNews > 0 ? "down" : "flat" },
    { lab: "ACLED incidents", val: String(acledItems.length) },
    { lab: "Temp", val: tempC != null ? `${fmt(tempC, 1)}°C` : "—" },
    { lab: "MPI poverty", val: poverty ? `${poverty.value}%` : "20.83%", cls: "down" },
    { lab: "Edu HAI rank", val: eduRank ? `#${eduRank.rank?.pos ?? 66}/77` : "#66/77", cls: "down" },
    { lab: "Emergency Decree", val: sec?.emergencyDecree ? "ACTIVE" : "—", cls: "down" },
  ];

  // ── charts ──────────────────────────────────────────────────────────────────
  const trendSpark: AtlasChart | null = tnd?.interestOverTime?.length
    ? { kind: "area", title: "#Nakhon Si Thammarat search interest (Google Trends)", series: [{ name: "interest", points: tnd.interestOverTime.slice(-30).map((p: any, i: number) => ({ x: i, y: num(p.value) ?? num(p) ?? 0 })) }] }
    : null;
  const archiveSeries: any[] = archive?.series ?? [];
  const archiveCharts: AtlasChart[] = archiveSeries.slice(0, 3).map((s) => ({
    kind: "line" as const,
    title: `${s.label}${s.unit ? ` (${s.unit})` : ""}`,
    series: [{ name: s.label, points: s.points.slice(-40).map((p: any) => ({ x: p.ts.slice(11, 16), y: num(p.value) ?? 0 })) }],
  }));

  // ── Data Health — every live feed's freshness tier, at a glance ─────────────
  const TIER_COLOR: Record<string, string> = {
    live: "#10B981", database: "#F1BE48", cache: "#F1BE48",
    modelled: "#F59E0B", unavailable: "#EF4444", loading: "#64748B",
  };
  const dataHealth: AtlasChart | null = (() => {
    const feeds: Array<[string, any]> = [
      ["AQ", aq], ["Weather", weather], ["Dam", dam], ["Gauges", gauges],
      ["News", news], ["Security", acled], ["Trends", trends], ["Markets", markets],
    ];
    const byTier: Record<string, number> = {};
    let total = 0;
    for (const [, f] of feeds) {
      const tier = f?.meta?.fallbackTier;
      if (!tier) continue;
      byTier[tier] = (byTier[tier] ?? 0) + 1;
      total++;
    }
    if (!total) return null;
    const order = ["live", "database", "cache", "modelled", "unavailable", "loading"];
    const data = order.filter((t) => byTier[t]).map((t) => ({ name: t, value: byTier[t], color: TIER_COLOR[t] ?? "#64748B" }));
    return { kind: "donut", title: "Data health — feeds by freshness", data, centerLabel: `${byTier["live"] ?? 0}/${total}` };
  })();

  // ── What's breaking — incidents by type (ACLED), or news wire by tag ────────
  const breakdown: AtlasChart | null = (() => {
    const counts: Record<string, number> = {};
    for (const i of acledItems) {
      const t = i.eventType ?? i.event_type ?? i.type;
      if (t) counts[t] = (counts[t] ?? 0) + 1;
    }
    let title = "Incidents by type (ACLED)";
    if (!Object.keys(counts).length) {
      for (const n of newsItems) for (const t of Array.isArray(n.tags) ? n.tags : []) counts[t] = (counts[t] ?? 0) + 1;
      title = "News wire by tag (24h)";
    }
    const data = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
    return data.length ? { kind: "donut", title, data, centerLabel: String(data.reduce((s, d) => s + d.value, 0)) } : null;
  })();

  const insightList: any[] = insights?.insights ?? [];

  return (
    <div className="term">
      <header className="term-head">
        <span className="term-mark">NST <b>WATCH</b> TERMINAL</span>
        <span className="term-sub">NST-01 · Southern Thailand · live + reference</span>
        <Clock />
        <button className="term-flip" onClick={onFlip}>⇄ MAP</button>
      </header>

      <div className="term-ticker" aria-label="live ticker">
        <div className="term-ticker-track">
          {[...ticker, ...ticker].map((t, i) => (
            <span className="term-tick" key={i}>
              <span className="lab">{t.lab}</span><span className={`val ${t.cls ?? ""}`}>{t.val}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="term-body">
        <div className="term-grid">

          {/* AIR QUALITY */}
          <Panel title="Air Quality" led={pm25 != null && pm25 > 35 ? "warn" : "live"} src={feat(aq)?.source ?? "PCD/AQICN"}>
            <div className="term-readout">
              <span className="big" style={{ color: pm25 != null && pm25 > 35 ? "var(--gold)" : "var(--good)" }}>{fmt(pm25, 1)}</span>
              <span className="unit">µg/m³ PM2.5</span>
              {aqi != null ? <span className="delta">AQI {aqi}</span> : null}
            </div>
            <div className="term-rows">
              <div className="term-row"><span className="k">Station</span><span className="v">{feat(aq)?.station ?? "—"}</span></div>
              <div className="term-row"><span className="k">Category</span><span className="v">{feat(aq)?.category ?? "—"}</span></div>
            </div>
            <div className="term-jux">Annual avg <b>~21 µg/m³</b>; peaks each <b>September</b> from Indonesian transboundary haze. Live vs that baseline tells you if today is a haze event.</div>
          </Panel>

          {/* FLOOD WATCH */}
          <Panel title="Flood Watch" led={worstGauge && worstGauge.status !== "normal" ? "crit" : "live"} src="GloFAS · RID">
            <div className="term-readout">
              <span className="big">{fmt(outflow, 1)}</span><span className="unit">m³/s dam outflow</span>
              {damF?.status ? sevPill(damF.status === "low" || damF.status === "normal" ? "ok" : "warn", damF.status) : null}
            </div>
            <div className="term-rows">
              <div className="term-row"><span className="k">Khao Luang runoff</span><span className="v">{damF?.name ? "online" : "—"}</span></div>
              <div className="term-row"><span className="k">Worst river gauge</span><span className={`v ${worstGauge?.status === "normal" ? "up" : "down"}`}>{worstGauge ? worstGauge.status : "—"}</span></div>
            </div>
            <div className="term-jux">Reference: the <b>Dec 2023 50-year flood hit 15,457 households</b>. Rising dam outflow + a warning gauge is the early signal that precedes downstream inundation.</div>
          </Panel>

          {/* SECURITY PULSE */}
          <Panel title="Security Pulse (aggregate)" led={secNews > 2 ? "warn" : "live"} src="ACLED · DSW · news">
            <div className="term-rows">
              <div className="term-row"><span className="k">ACLED incidents (window)</span><span className="v">{acledItems.length}</span></div>
              <div className="term-row"><span className="k">Reported fatalities</span><span className="v down">{acledFatal}</span></div>
              <div className="term-row"><span className="k">SEC-tagged news (live)</span><span className={`v ${secNews > 0 ? "down" : "flat"}`}>{secNews}</span></div>
              <div className="term-row"><span className="k">Legal status</span><span className="v">{sec?.emergencyDecree ? sevPill("crit", "Emergency Decree") : "—"}</span></div>
            </div>
            {breakdown ? <ChartRenderer chart={breakdown} /> : null}
            <div className="term-jux">Baseline: <b>22,495+ incidents since 2004</b>, Nakhon Si Thammarat ≈ <b>28%</b> of the Southern Thailand — but violence has <b>significantly decreased since 2013</b>. Today's count read against that trend, never as points on a map.</div>
          </Panel>

          {/* TRENDS & VIBES */}
          <Panel title="Trends & Vibes" led="live" src="Google Trends">
            {trendSpark ? <ChartRenderer chart={trendSpark} /> : <div className="term-load">No trend data yet.</div>}
            {tnd?.relatedRising?.length ? (
              <div className="term-rows">
                {tnd.relatedRising.slice(0, 4).map((r: any, i: number) => (
                  <div className="term-row" key={i}><span className="k">↗ {r.query ?? r.topic ?? r}</span><span className="v up">{r.value ?? ""}</span></div>
                ))}
              </div>
            ) : null}
            <div className="term-jux">What Nakhon Si Thammarat is searching, rising fastest — the public-attention signal alongside the hard feeds.</div>
          </Panel>

          {/* OUTCOMES (static reference) */}
          <Panel title="Outcome Reference" src="Data Atlas">
            <div className="term-rows">
              <div className="term-row"><span className="k">MPI poverty</span><span className="v down">{poverty?.value ?? "20.83"}%</span></div>
              <div className="term-row"><span className="k">Youth NEET</span><span className="v down">{neet?.value ?? "30.8"}%</span></div>
              <div className="term-row"><span className="k">Education HAI rank</span><span className="v down">#{eduRank?.rank?.pos ?? 66}/77</span></div>
              <div className="term-row"><span className="k">Mental-health prevalence</span><span className="v down">9.6%</span></div>
            </div>
            <div className="term-jux">The slow-moving truths the live feeds sit on top of. A flood or haze event lands hardest where poverty is highest — pair this panel with Flood &amp; Air Quality.</div>
          </Panel>

          {/* MARKETS */}
          <Panel title="Markets" led={markets?.features?.length ? "live" : undefined} src="FMP · FRED">
            {markets?.features?.length ? (
              <div className="term-rows">
                {(markets.features as any[]).slice(0, 6).map((m, i) => (
                  <div className="term-row" key={i}><span className="k">{m.name ?? m.symbol}</span><span className={`v ${num(m.changePct) != null ? (m.changePct >= 0 ? "up" : "down") : ""}`}>{fmt(num(m.value), 2)} {m.changePct != null ? `(${m.changePct >= 0 ? "+" : ""}${fmt(num(m.changePct), 2)}%)` : ""}</span></div>
                ))}
              </div>
            ) : <div className="term-load">Awaiting market keys (SET, USD/THB, gold, oil). Set FMP_API_KEY / FRED_API_KEY to enable.</div>}
            <div className="term-jux">Regional macro context — rubber-export and border-trade exposure make Nakhon Si Thammarat sensitive to commodity + THB moves.</div>
          </Panel>

          {/* INSIGHTS */}
          <Panel title="Self-Learning Insights" led="live" src="insights engine">
            {insightList.length ? (
              <div className="term-rows">
                {insightList.slice(0, 5).map((ins, i) => (
                  <div className="term-row" key={i}><span className="k">{sevPill(ins.severity === "critical" ? "crit" : ins.severity === "alert" ? "warn" : "ok", ins.severity)} {ins.title}</span></div>
                ))}
              </div>
            ) : <div className="term-load">Computing…</div>}
            <div className="term-jux">{insights?.headline ?? "The system surfaces the signals that need attention, extracted from the atlas + live feeds."}</div>
          </Panel>

          {/* DATA HEALTH */}
          <Panel title="Data Health" led="live" src="all feeds">
            {dataHealth ? <ChartRenderer chart={dataHealth} /> : <div className="term-load">Reading feed status…</div>}
            <div className="term-jux">Every live feed's freshness at a glance — <b style={{ color: "#10B981" }}>green=live</b>, <b style={{ color: "#F1BE48" }}>gold=cached</b>, <b style={{ color: "#F59E0B" }}>amber=modelled</b>, <b style={{ color: "#EF4444" }}>red=down</b>. Tells operators which sources to trust right now.</div>
          </Panel>

          {/* ARCHIVE SPARKS */}
          {archiveCharts.length ? (
            <Panel title="Time Machine" led="live" src="archive">
              {archiveCharts.map((c, i) => <ChartRenderer key={i} chart={c} />)}
              <div className="term-jux">The Mac daemon records the city's signals every cycle — history accumulating into trend.</div>
            </Panel>
          ) : null}

          {/* NEWS WIRE */}
          <Panel title="Southern Thailand News Wire" led="live" src="multi-source" span2>
            <div className="term-wire">
              {newsItems.length ? newsItems.slice(0, 14).map((n, i) => (
                <div className="term-wire-item" key={i} onClick={() => n.sourceUrl && window.open(n.sourceUrl, "_blank", "noopener")}>
                  <span className="t">{n.publishedAt ? new Date(n.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : ""}</span>
                  {n.title}
                  {Array.isArray(n.tags) && n.tags.length ? <span className="tag">{n.tags.join(" ")}</span> : null}
                </div>
              )) : <div className="term-load">Loading wire…</div>}
            </div>
          </Panel>

        </div>
      </div>
    </div>
  );
}
