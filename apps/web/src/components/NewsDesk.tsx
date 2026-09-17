import type { IntelligenceItem } from "@nst/shared";
import { safeUrl } from "../lib/safeUrl";
import { PanelHeader } from './PanelHeader';
import { ago } from "../lib/time";
import { scoreStatus } from "../lib/newsDesk";
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

// A story is "local" when it names the city, the province or one of its
// districts — or when the geocoder pinned it to a known NST place.
const LOCAL_RE = /นครศรีธรรมราช|นครศรีฯ|นครฯ|nakhon\s*si\s*thammarat|ปากพนัง|pak\s*phanang|ทุ่งสง|thung\s*song|ลานสกา|lan\s*saka|คีรีวง|khiri\s*wong|ท่าศาลา|tha\s*sala|สิชล|sichon|ขนอม|khanom|ร่อนพิบูลย์|ชะอวด|cha\s*uat|หัวไทร|hua\s*sai/i;

export function isLocalStory(it: Pick<IntelligenceItem, "title" | "summary" | "lat">): boolean {
  return it.lat != null || LOCAL_RE.test(`${it.title} ${it.summary ?? ""}`);
}

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
      <section className="panel" aria-label="News" aria-busy="true">
        <h3 className="pc-label">NEWS</h3>
        <span className="skeleton pc-skeleton" />
        <span className="skeleton pc-skeleton pc-skeleton--short" />
        <span className="skeleton pc-skeleton pc-skeleton--short" />
      </section>
    );
  }

  // Nakhon Si Thammarat stories first; then tagged national items; then the rest.
  const local = items.filter(isLocalStory);
  const rest = items.filter((it) => !isLocalStory(it));
  const actionable = rest.filter((it) => it.tags && it.tags.length > 0).slice(0, ACTIONABLE_LIMIT);
  const others = rest.filter((it) => !it.tags || it.tags.length === 0).slice(0, OTHER_LIMIT);
  const visible = [...local, ...actionable, ...others].slice(0, VISIBLE_LIMIT);
  const title = local.length > 0 ? `NEWS · ${local.length} ABOUT NAKHON SI THAMMARAT` : "NEWS · THAILAND";

  return (
    <section className="panel" aria-label="News" aria-busy={loading}>
      <PanelHeader
        title={title}
        ageMinutes={ageMinutes}
        actions={
          <>
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
          {visible.map((it) => {
            const level = scoreStatus(it.score);
            return (
              <li key={it.id}>
                <a href={safeUrl(it.sourceUrl) ?? undefined} target="_blank" rel="noreferrer noopener" className="desk-item">
                  {(() => {
                    // One tag, spelled out. Five two-letter codes on one
                    // national budget story read as noise.
                    const tag = (it.tags ?? []).map((t) => ACTION_TAG[t]).find(Boolean);
                    const urgent = level === "critical";
                    if (!tag && !urgent) return null;
                    return (
                      <span className="desk-item__head">
                        {tag && (
                          <span
                            className="desk-tag"
                            title={`Suggested: ${tag.do}`}
                            style={tag.critical ? statusStyle("critical") : undefined}
                          >
                            <span className="pc-glyph" aria-hidden="true">{tag.glyph}</span> {tag.label}
                          </span>
                        )}
                        {urgent && <StatusText level="critical">Top story</StatusText>}
                      </span>
                    );
                  })()}
                  <span className="desk-item__title">{it.title}</span>
                  <span className="pc-meta">
                    {it.source} · <span className="num">{ago(it.publishedAt)}</span>
                    {isLocalStory(it) ? " · Nakhon Si Thammarat" : ""}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
