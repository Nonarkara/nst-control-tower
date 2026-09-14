/**
 * CCTV directory — every camera the city publishes (nstcctv.nakhoncity.org)
 * plus Longdo public cameras: filter by purpose, search by name or id, open a
 * live view, or watch four at a time on the wall.
 */

import { useId, useMemo, useState } from "react";
import type { FallbackTier } from "@nst/shared";
import type { CctvCamera, CctvCategory } from "../map/layers";
import { PanelHeader } from "./PanelHeader";
import {
  CCTV_CATEGORIES,
  CCTV_CATEGORY_LABEL,
  filterCameras,
  statusLabel,
  summarizeCctv,
  wallCandidates,
} from "../lib/cctv";

interface Props {
  cameras: CctvCamera[];
  ageMinutes?: number | null;
  fallbackTier?: FallbackTier;
  note?: string;
  onOpen: (camera: CctvCamera) => void;
}

const LIST_PREVIEW = 40;
const WALL_SIZE = 4;

export function CctvDirectory({ cameras, ageMinutes, fallbackTier, note, onOpen }: Props) {
  const [category, setCategory] = useState<CctvCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "wall">("list");
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(0);
  const searchId = useId();

  const summary = useMemo(() => summarizeCctv(cameras), [cameras]);
  const filtered = useMemo(() => filterCameras(cameras, { category, query }), [cameras, category, query]);
  const wall = useMemo(() => wallCandidates(filtered), [filtered]);
  const pages = Math.max(1, Math.ceil(wall.length / WALL_SIZE));
  const safePage = Math.min(page, pages - 1);
  const wallCams = wall.slice(safePage * WALL_SIZE, safePage * WALL_SIZE + WALL_SIZE);
  const rows = showAll ? filtered : filtered.slice(0, LIST_PREVIEW);

  const chooseCategory = (c: CctvCategory | "all") => {
    setCategory(c);
    setPage(0);
    setShowAll(false);
  };

  return (
    <section className="panel" aria-label="CCTV cameras">
      <PanelHeader title="CCTV" source="nstcctv · longdo" ageMinutes={ageMinutes} fallbackTier={fallbackTier} />

      <p className="stat-line">
        <span className="stat-line__value num">{summary.online}</span>
        <span className="stat-line__label">of {summary.total} cameras online</span>
      </p>
      {note && summary.total === 0 && <p className="note">{note}</p>}

      <div className="chip-row" role="group" aria-label="Camera purpose">
        <button type="button" className="chip" aria-pressed={category === "all"} onClick={() => chooseCategory("all")}>
          All <span className="num">{summary.total}</span>
        </button>
        {CCTV_CATEGORIES.filter((c) => summary.byCategory[c] > 0).map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={category === c} onClick={() => chooseCategory(c)}>
            <span className={`swatch swatch--cctv-${c}`} aria-hidden="true" />
            {CCTV_CATEGORY_LABEL[c].en} <span className="num">{summary.byCategory[c]}</span>
          </button>
        ))}
      </div>

      <div className="field-row">
        <label className="field">
          <span className="field__label" id={searchId}>Search</span>
          <input
            className="field__input"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Name or camera ID"
            aria-labelledby={searchId}
          />
        </label>
        <div className="segmented" role="group" aria-label="View">
          <button type="button" className="segmented__btn" aria-pressed={view === "list"} onClick={() => setView("list")}>
            List
          </button>
          <button type="button" className="segmented__btn" aria-pressed={view === "wall"} onClick={() => setView("wall")}>
            Wall
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="note">No cameras match.</p>
      ) : view === "list" ? (
        <>
          <ul className="row-list">
            {rows.map((c) => (
              <li key={c.id}>
                <button type="button" className="row-btn" onClick={() => onOpen(c)}>
                  <span className={`status-glyph status-glyph--${c.status ?? "unknown"}`} aria-hidden="true" />
                  <span className="row-btn__id num">{c.sourceId ?? c.id}</span>
                  <span className="row-btn__name" lang="th">{c.name}</span>
                  <span className="row-btn__meta">
                    <span className="visually-hidden">{CCTV_CATEGORY_LABEL[c.category ?? "other"].en}, </span>
                    {statusLabel(c)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {filtered.length > LIST_PREVIEW && (
            <button type="button" className="btn btn--quiet" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show fewer" : `Show all ${filtered.length}`}
            </button>
          )}
        </>
      ) : (
        <>
          <div className="cctv-wall">
            {wallCams.map((c) => (
              <figure key={c.id} className="cctv-wall__cell">
                {c.embedUrl ? (
                  <iframe src={c.embedUrl} title={`Live view: ${c.name}`} loading="lazy" allow="autoplay" />
                ) : (
                  <video src={c.hlsUrl} autoPlay muted playsInline aria-label={`Live view: ${c.name}`} />
                )}
                <figcaption>
                  <button type="button" className="row-btn" onClick={() => onOpen(c)}>
                    <span className="row-btn__id num">{c.sourceId ?? c.id}</span>
                    <span className="row-btn__name" lang="th">{c.name}</span>
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="pager">
            <button type="button" className="btn" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
              Previous
            </button>
            <span className="pager__label num" aria-live="polite">
              {safePage * WALL_SIZE + 1}–{Math.min(wall.length, (safePage + 1) * WALL_SIZE)} of {wall.length}
            </span>
            <button type="button" className="btn" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
