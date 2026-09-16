/**
 * LocalCatalogPanel — the 180 provincial data.go.th datasets about
 * Nakhon Si Thammarat, as a searchable rail list.
 *
 * Static crawl snapshot (see /api/datago/local-catalog) — titles link out to
 * the live data.go.th page. No row previews: most resources are ZIP/PDF, so
 * the honest unit here is the dataset, not its bytes.
 */

import { useId, useMemo, useState } from "react";
import { PanelHeader } from "./PanelHeader";
import type { FallbackTier } from "@nst/shared";

export interface LocalCatalogEntry {
  id: string;
  title: string;
  organization: string;
  notes: string;
  tags: string[];
  formats: string[];
  url: string;
  updatedAt: string;
  resourceCount: number;
  localFiles: number;
}

interface Props {
  entries: LocalCatalogEntry[];
  loading: boolean;
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
  note?: string;
}

const LIST_PREVIEW = 15;

export function LocalCatalogPanel({ entries, loading, ageMinutes, fallbackTier, note }: Props) {
  const [query, setQuery] = useState("");
  const [org, setOrg] = useState<string>("all");
  const [showAll, setShowAll] = useState(false);
  const searchId = useId();

  const orgs = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) m.set(e.organization || "—", (m.get(e.organization || "—") ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) =>
      (org === "all" || (e.organization || "—") === org) &&
      (!q ||
        e.title.toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))),
    );
  }, [entries, org, query]);

  const rows = showAll ? filtered : filtered.slice(0, LIST_PREVIEW);

  if (loading && entries.length === 0) {
    return (
      <section className="panel" aria-label="Provincial open data" aria-busy="true">
        <PanelHeader title="OPEN DATA · NST" source="data.go.th" fallbackTier={fallbackTier} />
        <span className="skeleton pc-skeleton pc-skeleton--tall" />
        <span className="skeleton pc-skeleton" />
      </section>
    );
  }

  return (
    <section className="panel" aria-label="Provincial open data">
      <PanelHeader
        title="OPEN DATA · NST"
        source="data.go.th"
        ageMinutes={ageMinutes}
        fallbackTier={fallbackTier}
      />

      <p className="stat-line">
        <span className="stat-line__value num">{entries.length}</span>
        <span className="stat-line__label">provincial datasets on data.go.th</span>
      </p>
      {note ? <p className="note">{note}</p> : null}

      <label className="field">
        <span className="field__label" id={searchId}>Search datasets</span>
        <input
          className="field__input"
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowAll(false); }}
          placeholder="แรงงาน, น้ำท่วม, งบประมาณ…"
          aria-labelledby={searchId}
        />
      </label>

      {orgs.length > 1 && (
        <div className="chip-row" role="group" aria-label="Filter by publisher">
          <button
            type="button"
            className="chip"
            aria-pressed={org === "all"}
            onClick={() => { setOrg("all"); setShowAll(false); }}
          >
            All <span className="num">{entries.length}</span>
          </button>
          {orgs.slice(0, 5).map(([name, n]) => (
            <button
              key={name}
              type="button"
              className="chip"
              aria-pressed={org === name}
              onClick={() => { setOrg(org === name ? "all" : name); setShowAll(false); }}
              title={name}
            >
              {name.length > 18 ? `${name.slice(0, 18)}…` : name} <span className="num">{n}</span>
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="note">No datasets match.</p>
      ) : (
        <>
          <ul className="row-list">
            {rows.map((e) => (
              <li key={e.id}>
                <a
                  className="row-btn row-btn--compact"
                  href={e.url}
                  target="_blank"
                  rel="noreferrer"
                  title={e.notes || e.title}
                >
                  <span className="row-btn__name" lang="th">{e.title}</span>
                  <span className="row-btn__meta">
                    {e.formats.slice(0, 3).join(" · ")}
                    {e.formats.length > 0 ? " · " : ""}{e.resourceCount} {e.resourceCount === 1 ? "file" : "files"}
                    {e.updatedAt ? ` · ${e.updatedAt}` : ""}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          {filtered.length > LIST_PREVIEW && (
            <button type="button" className="btn btn--quiet" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show fewer" : `Show all ${filtered.length}`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
