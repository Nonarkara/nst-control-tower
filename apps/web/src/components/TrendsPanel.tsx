import { useMemo, useState } from "react";
import { safeUrl } from "../lib/safeUrl";
import { PanelHeader } from "./PanelHeader";
import type { FallbackTier } from "@nst/shared";
import { seriesSummary } from "../lib/cityStatus";

interface TrendPoint { time: string; value: number }
interface RelatedQuery { query: string; value: number; link?: string | null }

export interface TrendsSnapshot {
  lang: "en" | "th" | "zh-CN";
  keyword: string;
  geo: string;
  interestOverTime: TrendPoint[];
  relatedTop: RelatedQuery[];
  relatedRising: RelatedQuery[];
  fetchedAt: string;
  err?: string;
}

interface Props {
  snapshots: TrendsSnapshot[];
  loading: boolean;
  ageMinutes: number;
  onRefresh: () => void;
  fallbackTier?: FallbackTier;
}

const LANGS: Array<{ id: TrendsSnapshot["lang"]; label: string; name: string }> = [
  { id: "en",    label: "EN", name: "English" },
  { id: "th",    label: "TH", name: "Thai" },
  { id: "zh-CN", label: "CN", name: "Chinese" },
];

const RELATED_LIMIT = 6;
const BREAKOUT = 5000;

function exploreUrl(q: RelatedQuery): string {
  return safeUrl(q.link) ?? `https://trends.google.com/trends/explore?q=${encodeURIComponent(q.query)}`;
}

function RelatedList({ title, queries, lang, rising }: { title: string; queries: RelatedQuery[]; lang: string; rising?: boolean }) {
  if (queries.length === 0) return null;
  return (
    <div className="pc-section">
      <h3 className="pc-label">{title}</h3>
      <ul className="pc-list">
        {queries.slice(0, RELATED_LIMIT).map((q, i) => (
          <li key={`${title}-${q.query}-${i}`}>
            <a className="trd-link" href={exploreUrl(q)} target="_blank" rel="noreferrer noopener">
              <span className="trd-link__q" lang={lang}>{q.query}</span>
              <span className="trd-link__v num">
                {rising ? (q.value >= BREAKOUT ? "Breakout" : `+${q.value}%`) : q.value}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Trends panel — top of the right rail. Shows what people are searching for
 * around the active "Nakhon Si Thammarat" keyword in each language, with the past-90-day
 * interest curve as a tiny sparkline.
 */
export function TrendsPanel({ snapshots, loading, ageMinutes, onRefresh, fallbackTier }: Props) {
  const [lang, setLang] = useState<TrendsSnapshot["lang"]>("en");
  const active = useMemo(
    () => snapshots.find((s) => s.lang === lang) ?? snapshots[0] ?? null,
    [snapshots, lang],
  );

  const sparkline = useMemo(() => {
    if (!active?.interestOverTime?.length) return null;
    const values = active.interestOverTime.map((p) => p.value);
    const maxV = Math.max(...values, 1);
    const w = 280;
    const h = 36;
    const denom = Math.max(1, values.length - 1);
    const pts = values
      .map((v, i) => {
        const x = (i / denom) * w;
        const y = h - (v / maxV) * h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    const peak = Math.max(...values);
    const last = values[values.length - 1];
    return { pts, w, h, peak, last, summary: seriesSummary(values) };
  }, [active]);

  const activeLang = active?.lang ?? lang;

  return (
    <section className="panel" aria-label="Google Trends" aria-busy={loading}>
      <PanelHeader
        title="TRENDS · #NST · 90 D"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
        source="google-trends"
        actions={
          <>
            {active && <span className="trd-keyword" lang={activeLang}>{active.keyword}</span>}
            <button
              type="button"
              className="btn btn--quiet pc-icon-btn"
              onClick={onRefresh}
              disabled={loading}
              aria-label={loading ? "Refreshing trends, please wait" : `Refresh Google Trends data — last refreshed ${ageMinutes}m ago`}
              title={`Refreshed ${ageMinutes}m ago — click to refresh`}
            >
              <span aria-hidden="true">{loading ? "…" : "↻"}</span>
            </button>
          </>
        }
      />

      <div className="segmented" role="group" aria-label="Search language">
        {LANGS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLang(l.id)}
            className="segmented__btn"
            aria-pressed={lang === l.id}
            aria-label={`${l.name} searches`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {active ? (
        <>
          {sparkline ? (
            <figure className="pc-section">
              <svg
                className="pc-spark"
                viewBox={`0 0 ${sparkline.w} ${sparkline.h}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polyline className="pc-spark__line" points={sparkline.pts} />
              </svg>
              <figcaption className="pc-spread">
                <span className="visually-hidden">Search interest, last 90 days: {sparkline.summary}</span>
                <span className="pc-meta num" aria-hidden="true">peak {sparkline.peak}</span>
                <span className="pc-meta num" aria-hidden="true">now {sparkline.last}</span>
              </figcaption>
            </figure>
          ) : (
            <p className="note">
              {active.err
                ? `Trends unavailable: ${active.err}`
                : "No interest data yet — refresh to retry."}
            </p>
          )}

          <RelatedList title="Top related" queries={active.relatedTop} lang={activeLang} />
          <RelatedList title="Rising ↑" queries={active.relatedRising} lang={activeLang} rising />
        </>
      ) : (
        <p className="note">Loading Google Trends…</p>
      )}
    </section>
  );
}
