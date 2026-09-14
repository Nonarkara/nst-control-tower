import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  SearchResponse, SearchResult, SearchDocType,
  AcademyLesson, Insight, InsightDigest, ConciergeAnswer,
  ArchiveSnapshot, AtlasChart,
} from "@nst/shared";
import { API_BASE } from "../../lib/apiBase";
import { Markdown } from "./markdown";
import { ChartRenderer } from "../atlas/charts";
import { Dialog } from "../Dialog";

/**
 * Nakhon Si Thammarat Knowledge Platform — a full-bleed overlay that complements the dashboard
 * with five tools: Search (the whole corpus), Learn (the academy), Insights
 * (the self-learning digest), Ask (the AI concierge), and Archive (time
 * machine). Deep-links into the dashboard's lenses and Data Atlas.
 */

type Tab = "search" | "learn" | "insights" | "ask" | "archive";
type Jump = { kind: "lens" | "atlasModule" | "lesson" | "url" | "source"; id: string };

interface Props {
  onClose: () => void;
  onOpenLens: (lensId: string) => void;
  onOpenAtlas: (moduleId?: string) => void;
  initialTab?: Tab;
}

const TABS: Array<{ id: Tab; label: string; ic: string }> = [
  { id: "search", label: "Search", ic: "⌕" },
  { id: "learn", label: "Academy", ic: "✦" },
  { id: "insights", label: "Insights", ic: "◈" },
  { id: "ask", label: "Ask AI", ic: "✺" },
  { id: "archive", label: "Archive", ic: "◷" },
];

const TYPE_FILTERS: Array<SearchDocType | "all"> = ["all", "indicator", "source", "lesson", "glossary"];

async function getJSON<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API_BASE}${path}`);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch { return null; }
}

// ── Search tab ───────────────────────────────────────────────────────────────
function SearchTab({ jump }: { jump: (j: Jump) => void }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<SearchDocType | "all">("all");
  const [res, setRes] = useState<SearchResponse | null>(null);
  const t = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!q.trim()) { setRes(null); return; }
    window.clearTimeout(t.current);
    t.current = window.setTimeout(async () => {
      const url = `/api/search?q=${encodeURIComponent(q)}${type !== "all" ? `&type=${type}` : ""}`;
      setRes(await getJSON<SearchResponse>(url));
    }, 220);
    return () => window.clearTimeout(t.current);
  }, [q, type]);

  return (
    <div className="kp-content-inner">
      <div className="kp-search-box">
        <input type="search" aria-label="Search the knowledge base" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search indicators, sources, lessons, glossary…  e.g. poverty, Khao Luang runoff, MPI, pondok" />
      </div>
      <div className="kp-chips" role="group" aria-label="Filter by type">
        {TYPE_FILTERS.map((f) => (
          <button key={f} type="button" className={type === f ? "on" : ""} aria-pressed={type === f} onClick={() => setType(f)}>{f}</button>
        ))}
      </div>
      {!q.trim() ? (
        <p className="kp-hint">Try: <em>poverty, flood, Southern Thailand, O-NET, Khao Luang runoff, ITA, choropleth, NEET, rubber, GDX</em>. Searches 280+ indicators, 215 sources, the academy, and the glossary.</p>
      ) : res && res.results.length === 0 ? (
        <p className="kp-hint">No matches for “{q}”.</p>
      ) : (
        res?.results.map((r) => (
          <button
            key={r.id}
            type="button"
            className="kp-result"
            disabled={!r.deepLink}
            onClick={() => r.deepLink && jump(r.deepLink)}
          >
            <span className="kp-result-type">{r.type}</span>
            <span>
              <span className="kp-result-title">{r.title}</span>
              {r.snippet ? <span className="kp-result-snip">{r.snippet}</span> : null}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

// ── Academy tab ──────────────────────────────────────────────────────────────
interface TrackInfo { id: string; title: string; lessons: AcademyLesson[]; }
function LearnTab({ jump }: { jump: (j: Jump) => void }) {
  const [tracks, setTracks] = useState<TrackInfo[] | null>(null);
  const [lesson, setLesson] = useState<AcademyLesson | null>(null);
  const [reveal, setReveal] = useState<Record<number, number>>({});

  useEffect(() => { getJSON<{ tracks: TrackInfo[] }>("/api/academy").then((d) => setTracks(d?.tracks ?? [])); }, []);

  if (lesson) {
    return (
      <div className="kp-content-inner kp-lesson">
        <button type="button" className="kp-back" onClick={() => { setLesson(null); setReveal({}); }}>← All lessons</button>
        <h2>{lesson.title}</h2>
        <div className="kp-lesson-meta">{lesson.titleTh ? `${lesson.titleTh} · ` : ""}{lesson.level} · {lesson.durationMin} min read</div>
        {lesson.keyFacts.length ? (
          <ul className="kp-keyfacts">{lesson.keyFacts.map((f, i) => <li key={i}>{f}</li>)}</ul>
        ) : null}
        <Markdown source={lesson.body} />
        {lesson.links.length ? (
          <div className="kp-lesson-links">
            {lesson.links.map((l, i) => (
              <button key={i} type="button" onClick={() => {
                if (l.lens) jump({ kind: "lens", id: l.lens });
                else if (l.atlasModule) jump({ kind: "atlasModule", id: l.atlasModule });
                else if (l.url) window.open(l.url, "_blank", "noopener");
              }}>{l.label} →</button>
            ))}
          </div>
        ) : null}
        {lesson.quiz.length ? (
          <div className="kp-quiz">
            <h4>Check your understanding</h4>
            {lesson.quiz.map((qz, qi) => (
              <div key={qi} className="kp-quiz-q">
                <div className="q">{qi + 1}. {qz.q}</div>
                {qz.choices.map((ch, ci) => {
                  const picked = reveal[qi];
                  const cls = picked == null ? "" : ci === qz.answer ? "correct" : ci === picked ? "wrong" : "";
                  return <button key={ci} type="button" className={`kp-quiz-choice ${cls}`} aria-pressed={reveal[qi] === ci} onClick={() => setReveal((r) => ({ ...r, [qi]: ci }))}>{ch}</button>;
                })}
                {reveal[qi] != null ? <div className="kp-quiz-explain">{qz.explain}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="kp-content-inner">
      {!tracks ? <p className="kp-hint">Loading academy…</p> : (
        <div className="kp-tracks">
          {tracks.map((tr) => (
            <div key={tr.id} className="kp-track">
              <h3>{tr.title}</h3>
              {tr.lessons.map((l) => (
                <button key={l.id} type="button" className="kp-lesson-row" onClick={() => setLesson(l)}>
                  <span className="kp-lesson-title">{l.title}</span>
                  <span className="kp-lesson-dur">{l.durationMin}m</span>
                  <span className="kp-lesson-level">{l.level}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Insights tab ─────────────────────────────────────────────────────────────
function InsightsTab({ jump }: { jump: (j: Jump) => void }) {
  const [digest, setDigest] = useState<InsightDigest | null>(null);
  useEffect(() => { getJSON<InsightDigest>("/api/insights").then(setDigest); }, []);
  if (!digest) return <div className="kp-content-inner"><p className="kp-hint">Computing insights…</p></div>;
  return (
    <div className="kp-content-inner">
      <p className="kp-hint kp-hint--headline">{digest.headline}</p>
      {digest.insights.map((ins: Insight) => (
        // Pointer users can click the whole card; keyboard users get the title button.
        <div
          key={ins.id}
          className={`kp-insight ${ins.severity}${ins.deepLink ? " kp-insight--link" : ""}`}
          onClick={() => ins.deepLink && jump(ins.deepLink)}
        >
          <div className="kp-insight-head">
            <span className={`kp-insight-sev kp-insight-sev--${ins.severity}`}>{ins.severity}</span>
            <h4>
              {ins.deepLink ? (
                <button
                  type="button"
                  className="kp-insight-link"
                  onClick={(e) => { e.stopPropagation(); if (ins.deepLink) jump(ins.deepLink); }}
                >
                  {ins.title}
                </button>
              ) : ins.title}
            </h4>
          </div>
          <div className="kp-insight-body">{ins.body}</div>
          <div className="kp-insight-ev">{ins.evidence.map((e, i) => <span key={i}>· {e}</span>)}</div>
        </div>
      ))}
    </div>
  );
}

// ── Ask (concierge) tab ──────────────────────────────────────────────────────
function AskTab({ jump }: { jump: (j: Jump) => void }) {
  const [q, setQ] = useState("");
  const [log, setLog] = useState<Array<{ role: "user" | "bot"; text: string; cites?: SearchResult[]; usedLLM?: boolean }>>([]);
  const [busy, setBusy] = useState(false);

  const send = useCallback(async () => {
    const question = q.trim();
    if (!question || busy) return;
    setQ("");
    setLog((l) => [...l, { role: "user", text: question }]);
    setBusy(true);
    const ans = await getJSON<ConciergeAnswer>(`/api/concierge?q=${encodeURIComponent(question)}`);
    setBusy(false);
    setLog((l) => [...l, { role: "bot", text: ans?.answer ?? "The concierge is unavailable right now.", cites: ans?.citations, usedLLM: ans?.usedLLM }]);
  }, [q, busy]);

  return (
    <div className="kp-content-inner">
      <p className="kp-hint kp-hint--lede">Ask anything grounded in the Nakhon Si Thammarat knowledge base. Answers cite their sources. Synthesized answers need a Gemini key; otherwise you get ranked retrievals.</p>
      <div className="kp-ask-log" role="log" aria-live="polite">
        {log.map((m, i) => (
          <div key={i} className={`kp-ask-msg ${m.role}`}>
            <div>{m.text}</div>
            {m.cites?.length ? (
              <div className="kp-ask-cites">
                {m.cites.slice(0, 5).map((c, ci) => (
                  <button key={ci} type="button" className="kp-ask-cite" disabled={!c.deepLink} onClick={() => c.deepLink && jump(c.deepLink)}>[{ci + 1}] {c.title}</button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {busy ? <div className="kp-ask-msg bot">…</div> : null}
      </div>
      <div className="kp-ask-box">
        <input aria-label="Your question" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="e.g. Why is Nakhon Si Thammarat's education ranked low? What's the flood risk from Khao Luang runoff?" />
        <button type="button" onClick={send} disabled={busy}>ASK</button>
      </div>
    </div>
  );
}

// ── Archive tab ──────────────────────────────────────────────────────────────
function ArchiveTab() {
  const [snap, setSnap] = useState<ArchiveSnapshot | null>(null);
  useEffect(() => { getJSON<ArchiveSnapshot>("/api/archive").then(setSnap); }, []);
  if (!snap) return <div className="kp-content-inner"><p className="kp-hint">Loading archive…</p></div>;
  if (snap.series.length === 0) {
    return (
      <div className="kp-content-inner">
        <div className="kp-archive-empty">
          <p>The time machine has no history yet.</p>
          <p className="kp-hint">{snap.meta.note}</p>
        </div>
      </div>
    );
  }
  const charts: AtlasChart[] = snap.series.map((s) => ({
    kind: "line" as const,
    title: `${s.label}${s.unit ? ` (${s.unit})` : ""}`,
    series: [{ name: s.label, points: s.points.map((p) => ({ x: p.ts.slice(5, 16).replace("T", " "), y: p.value })) }],
  }));
  return (
    <div className="kp-content-inner">
      <p className="kp-hint kp-hint--meta">{snap.snapshots} snapshots · {snap.oldest?.slice(0, 10)} → {snap.newest?.slice(0, 10)}. The platform records the city's live signals over time.</p>
      <div className="atlas-chart-grid">{charts.map((c, i) => <ChartRenderer key={i} chart={c} />)}</div>
    </div>
  );
}

export function PlatformView({ onClose, onOpenLens, onOpenAtlas, initialTab = "search" }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const jump = useCallback((j: Jump) => {
    if (j.kind === "lens") { onOpenLens(j.id); onClose(); }
    else if (j.kind === "atlasModule") { onOpenAtlas(j.id); onClose(); }
    else if (j.kind === "lesson") { setTab("learn"); }
    else if (j.kind === "url") window.open(j.id, "_blank", "noopener");
  }, [onOpenLens, onOpenAtlas, onClose]);

  return (
    <Dialog
      open
      onClose={onClose}
      size="full"
      className="dialog--platform"
      title={<>Nakhon Si Thammarat Knowledge Platform <span lang="th">ฐานความรู้เมืองนครศรีธรรมราช</span></>}
      description="search · learn · ask · archive — complementing the dashboard"
    >
      <div className="kp-body">
        <nav className="kp-rail" aria-label="Platform tools">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`kp-tab ${tab === t.id ? "on" : ""}`}
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              <span className="kp-tab-ic" aria-hidden="true">{t.ic}</span>{t.label}
            </button>
          ))}
        </nav>
        <div className="kp-content">
          {tab === "search" && <SearchTab jump={jump} />}
          {tab === "learn" && <LearnTab jump={jump} />}
          {tab === "insights" && <InsightsTab jump={jump} />}
          {tab === "ask" && <AskTab jump={jump} />}
          {tab === "archive" && <ArchiveTab />}
        </div>
      </div>
    </Dialog>
  );
}
