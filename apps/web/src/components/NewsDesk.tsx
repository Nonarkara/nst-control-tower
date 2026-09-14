import type { IntelligenceItem } from "@nst/shared";
import { safeUrl } from "../lib/safeUrl";
import { PanelHeader } from './PanelHeader';
import { ago } from "../lib/time";
import { scoreStatus } from "../lib/newsDesk";
import { STATUS } from "../lib/status";
import { StatusText, statusStyle } from "../lib/cityStatus";

// Mayor's Action tag legend — 2-char code → short label, glyph, suggested action.
// Tags are categories, not status: neutral ink, except Emergency which carries critical.
const ACTION_TAG: Record<string, { label: string; glyph: string; do: string; critical?: boolean }> = {
  EM: { label: "Emergency",        glyph: "▲", do: "go to scene / coordinate response", critical: true },
  FU: { label: "Funeral",          glyph: "✚", do: "attend or send wreath" },
  PO: { label: "Police friction",  glyph: "◆", do: "consider mediation" },
  HO: { label: "Honour",           glyph: "★", do: "congratulate" },
  FE: { label: "Festival",         glyph: "✦", do: "attend opening" },
  IN: { label: "Infrastructure",   glyph: "▣", do: "chase department" },
  BZ: { label: "ธุรกิจ / Biz",     glyph: "◢", do: "attend signing" },
  PU: { label: "Public health",    glyph: "✚", do: "visit / congratulate staff" },
};

const ACTIONABLE_LIMIT = 8;
const OTHER_LIMIT = 6;
const VISIBLE_LIMIT = 14;

interface Props {
  items: IntelligenceItem[];
  loading: boolean;
  ageMinutes?: number;
  onRefresh?: () => void;
}

export function NewsDesk({ items, loading, ageMinutes, onRefresh }: Props) {
  if (loading && items.length === 0) {
    return (
      <section className="panel" aria-label="Mayor's desk" aria-busy="true">
        <h3 className="pc-label">MAYOR&apos;S DESK // NST</h3>
        <span className="skeleton pc-skeleton" />
        <span className="skeleton pc-skeleton pc-skeleton--short" />
        <span className="skeleton pc-skeleton pc-skeleton--short" />
      </section>
    );
  }

  // Split into actionable vs general — actionable items first
  const actionable = items.filter((it) => it.tags && it.tags.length > 0).slice(0, ACTIONABLE_LIMIT);
  const others = items.filter((it) => !it.tags || it.tags.length === 0).slice(0, OTHER_LIMIT);
  const visible = [...actionable, ...others].slice(0, VISIBLE_LIMIT);

  return (
    <section className="panel" aria-label="Mayor's desk" aria-busy={loading}>
      <PanelHeader
        title="MAYOR'S DESK // NST"
        ageMinutes={ageMinutes}
        actions={
          <>
            <span className="pc-meta num" title={`${actionable.length} actionable / ${items.length} total`}>
              {String(actionable.length).padStart(2, "0")}/{String(items.length).padStart(3, "0")}
              <span className="visually-hidden"> actionable of total</span>
            </span>
            {onRefresh && (
              <button
                type="button"
                className="btn btn--quiet pc-icon-btn"
                onClick={onRefresh}
                disabled={loading}
                title={ageMinutes != null ? `Refreshed ${ageMinutes}m ago — click to refresh` : "Refresh"}
                aria-label="Refresh news"
              >
                <span aria-hidden="true">{loading ? "…" : "↻"}</span>
              </button>
            )}
          </>
        }
      />
      {visible.length === 0 ? (
        <p className="note">No headlines yet — refreshes every 3 min.</p>
      ) : (
        <ol className="pc-list">
          {visible.map((it, i) => {
            const level = scoreStatus(it.score);
            return (
              <li key={it.id}>
                <a href={safeUrl(it.sourceUrl) ?? undefined} target="_blank" rel="noreferrer noopener" className="desk-item">
                  <span className="desk-item__head">
                    <span className="pc-meta num" aria-hidden="true">[{String(i + 1).padStart(3, "0")}]</span>
                    {(it.tags ?? []).map((t) => {
                      const a = ACTION_TAG[t];
                      if (!a) return null;
                      return (
                        <span
                          key={t}
                          className="desk-tag"
                          title={`${a.label} — ${a.do}`}
                          style={a.critical ? statusStyle("critical") : undefined}
                        >
                          <span className="pc-glyph" aria-hidden="true">{a.glyph}</span>
                          {t}
                          <span className="visually-hidden"> {a.label}</span>
                        </span>
                      );
                    })}
                    <span className="desk-item__score">
                      {level === "unknown" ? (
                        <span className="pc-status">REL·<span className="num">{it.score}</span></span>
                      ) : (
                        <StatusText level={level}>
                          REL·<span className="num">{it.score}</span>
                          <span className="visually-hidden"> {STATUS[level].en}</span>
                        </StatusText>
                      )}
                    </span>
                  </span>
                  <span className="desk-item__title">{it.title}</span>
                  <span className="pc-meta">
                    {it.source.toUpperCase()} · <span className="num">{ago(it.publishedAt)}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      )}
      {actionable.length > 0 && (
        <p className="pc-meta">
          Action legend: ▲EM emergency · ✚FU funeral · ◆PO police · ★HO honour · ✦FE festival · ▣IN infra · ◢BZ business · ✚PU health
        </p>
      )}
    </section>
  );
}
