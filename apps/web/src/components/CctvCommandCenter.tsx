/**
 * CctvCommandCenter — the rail-mode CCTV wall.
 *
 * Mounted INSIDE the left and right rails (not full-screen): the map stays
 * visible in the centre. Each rail gets half the cameras (`side: "even" |
 * "odd"`) so they read as one continuous wall wrapping around the map.
 *
 * Map↔wall sync (old-school blink):
 *   - Click a CCTV dot on the map → App.tsx sets `highlightedId` → both the
 *     matching deck.gl halo AND this cell blink for ~2.4 s.
 *   - Click a tile here → App.tsx opens the stream modal AND triggers the
 *     same blink on the matching map dot.
 *
 * Status tint drives each cell border + the status pill. Offline cells are
 * desaturated. Honour prefers-reduced-motion (CSS animation disabled; the
 * deck.gl halo keeps rAF because it animates a non-CSS property).
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CctvCamera, CctvCategory, CctvStatus } from "../map/layers";
import {
  CCTV_CATEGORIES,
  CCTV_CATEGORY_LABEL,
  filterCameras,
  statusLabel,
  summarizeCctv,
} from "../lib/cctv";

interface Props {
  cameras: CctvCamera[];
  /** Which half of the wall this rail renders. `even` = 0,2,4…  `odd` = 1,3,5…
   *  Set both rails to the same `cameras` prop — App.tsx will pass
   *  `side: "even"` to the left and `side: "odd"` to the right. */
  side: "even" | "odd";
  /** Camera id that was just clicked on the map. Auto-clears after 2.4 s. */
  highlightedId?: string | null;
  /** Open the existing stream modal for the given camera. */
  onSelect: (camera: CctvCamera) => void;
  /** Close CCTV mode — restores the normal rail content. */
  onExit: () => void;
}

const STATUS_CHIP: { value: "all" | CctvStatus; label: string; tone: string }[] = [
  { value: "all", label: "All", tone: "var(--ink-2)" },
  { value: "online", label: "Online", tone: "var(--good)" },
  { value: "offline", label: "Offline", tone: "var(--bad)" },
  { value: "unknown", label: "Unknown", tone: "var(--ink-3)" },
];

const PAGE_SIZE = 16;  // smaller per-page count for rail height budget

function statusTone(s: CctvStatus | undefined): string {
  if (s === "online") return "var(--good)";
  if (s === "offline") return "var(--bad)";
  return "var(--ink-3)";
}

function countByStatus(
  summary: { total: number; online: number; offline: number },
  value: "all" | CctvStatus,
): number {
  if (value === "all") return summary.total;
  if (value === "online") return summary.online;
  if (value === "offline") return summary.offline;
  return Math.max(0, summary.total - summary.online - summary.offline);
}

/** Split a camera list in two by stable order. Each rail gets a stable
 *  half so the camera-to-position mapping stays the same across re-renders. */
function splitByParity(cameras: CctvCamera[], side: "even" | "odd"): CctvCamera[] {
  const out: CctvCamera[] = [];
  for (let i = 0; i < cameras.length; i++) {
    if ((i % 2 === 0 && side === "even") || (i % 2 === 1 && side === "odd")) out.push(cameras[i]!);
  }
  return out;
}

/** Escape characters that would break a CSS attribute selector. The upstream
 *  prefixes camera ids "nstcctv-" or "longdo-", but the escape is cheap. */
function cssEscape(s: string): string {
  return s.replace(/["\\]/g, "\\$&");
}

export function CctvCommandCenter({ cameras, side, highlightedId, onSelect, onExit }: Props) {
  const [category, setCategory] = useState<CctvCategory | "all">("all");
  const [status, setStatus] = useState<"all" | CctvStatus>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const searchId = useId();
  const wallRef = useRef<HTMLDivElement>(null);

  // Half of the cameras for this rail. We filter THEN split (so parity
  // is stable across filter changes — same camera goes to the same rail
  // regardless of which categories the operator is currently viewing).
  const fullFiltered = useMemo(
    () => filterCameras(cameras, { category, query }).filter((c) => status === "all" ? true : (c.status ?? "unknown") === status),
    [cameras, category, query, status],
  );
  const myHalf = useMemo(() => splitByParity(fullFiltered, side), [fullFiltered, side]);
  const summary = useMemo(() => summarizeCctv(myHalf), [myHalf]);

  const totalPages = Math.max(1, Math.ceil(myHalf.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = myHalf.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  // Map→wall sync: find the matching tile, jump to its page, scroll into
  // view. CSS keyframe on `.cctv-cell.is-highlighted` does the blink.
  useEffect(() => {
    if (!highlightedId || !wallRef.current) return;
    const idx = myHalf.findIndex((c) => c.id === highlightedId);
    if (idx === -1) return;  // not on this rail — leave the other rail to handle it
    const targetPage = Math.floor(idx / PAGE_SIZE);
    if (targetPage !== page) setPage(targetPage);
    const raf = requestAnimationFrame(() => {
      const el = wallRef.current?.querySelector<HTMLElement>(`[data-cam-id="${cssEscape(highlightedId)}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(raf);
  }, [highlightedId, myHalf, page]);

  return (
    <div className="cctv-cc" aria-label={`CCTV wall — ${side} rail`}>
      <header>
        <div className="cctv-cc__eyebrow mono">CCTV · {side === "even" ? "LEFT WALL" : "RIGHT WALL"}</div>
        <h2 className="cctv-cc__title">
          <span className="num">{summary.online}</span>
          <span className="cctv-cc__title-sep">/</span>
          <span className="num">{summary.total}</span>
          <span className="cctv-cc__title-unit">live</span>
        </h2>
      </header>

      <div className="cctv-cc__chips" role="group" aria-label="Status filter">
        {STATUS_CHIP.filter((c) => c.value === "all" || countByStatus(summary, c.value) > 0).map((c) => (
          <button
            key={c.value}
            type="button"
            className={`cctv-cc__chip ${status === c.value ? "is-on" : ""}`}
            aria-pressed={status === c.value}
            onClick={() => { setStatus(c.value); setPage(0); }}
            style={{ ["--chip-tone" as never]: c.tone }}
          >
            <span className="cctv-cc__chip-dot" aria-hidden="true" />
            {c.label}
            <span className="num">{countByStatus(summary, c.value)}</span>
          </button>
        ))}
        {CCTV_CATEGORIES.filter((c) => summary.byCategory[c] > 0).map((c) => (
          <button
            key={c}
            type="button"
            className={`cctv-cc__chip cctv-cc__chip--cat ${category === c ? "is-on" : ""}`}
            aria-pressed={category === c}
            onClick={() => { setCategory(category === c ? "all" : c); setPage(0); }}
            style={{ ["--chip-tone" as never]: `var(--cctv-${c})` }}
          >
            <span className="cctv-cc__chip-swatch" aria-hidden="true" />
            {CCTV_CATEGORY_LABEL[c].en}
            <span className="num">{summary.byCategory[c]}</span>
          </button>
        ))}
      </div>

      <label className="cctv-cc__search">
        <span id={searchId} className="visually-hidden">Search cameras</span>
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          placeholder="Search…"
          aria-labelledby={searchId}
        />
      </label>

      {pageItems.length === 0 ? (
        <div className="cctv-cc__empty mono">No cameras.</div>
      ) : (
        <div className="cctv-cc__wall" ref={wallRef}>
          {pageItems.map((c) => (
            <CameraCell
              key={c.id}
              camera={c}
              tone={statusTone(c.status)}
              highlighted={c.id === highlightedId}
              onClick={() => onSelect(c)}
            />
          ))}
        </div>
      )}

      <footer className="cctv-cc__foot">
        <span className="mono cctv-cc__foot-meta">
          {myHalf.length === 0
            ? "0"
            : `${safePage * PAGE_SIZE + 1}–${Math.min(myHalf.length, (safePage + 1) * PAGE_SIZE)} of ${myHalf.length}`}
        </span>
        <div className="cctv-cc__pager">
          <button
            type="button"
            className="cctv-cc__pager-btn mono"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
            aria-label="Previous page"
          >
            ←
          </button>
          <span className="mono num cctv-cc__pager-label">
            {safePage + 1}/{totalPages}
          </span>
          <button
            type="button"
            className="cctv-cc__pager-btn mono"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage(safePage + 1)}
            aria-label="Next page"
          >
            →
          </button>
        </div>
      </footer>

      <button
        type="button"
        className="cctv-cc__exit mono"
        onClick={onExit}
        aria-label="Exit CCTV command center"
      >
        EXIT CCTV MODE
      </button>
    </div>
  );
}

interface CellProps {
  camera: CctvCamera;
  tone: string;
  highlighted: boolean;
  onClick: () => void;
}

function CameraCell({ camera, tone, highlighted, onClick }: CellProps) {
  const isOffline = camera.status === "offline";
  const hasStream = !isOffline && (camera.embedUrl || camera.hlsUrl || camera.imageUrl);
  return (
    <button
      type="button"
      className={`cctv-cell ${isOffline ? "is-offline" : "is-online"} ${highlighted ? "is-highlighted" : ""}`}
      onClick={onClick}
      data-cam-id={camera.id}
      style={{ ["--cell-tone" as never]: tone }}
      title={camera.name}
    >
      <div className="cctv-cell__viewport">
        {hasStream ? (
          camera.embedUrl ? (
            <iframe
              src={camera.embedUrl}
              title={camera.name}
              loading="lazy"
              allow="autoplay"
            />
          ) : camera.hlsUrl ? (
            <video
              src={camera.hlsUrl}
              autoPlay
              muted
              playsInline
              aria-label={camera.name}
            />
          ) : (
            <img src={camera.imageUrl} alt={camera.name} loading="lazy" />
          )
        ) : (
          <div className="cctv-cell__no-stream mono">OFFLINE</div>
        )}
      </div>
      <div className="cctv-cell__meta">
        <span className="cctv-cell__id num">{camera.sourceId ?? camera.id}</span>
        <span className="cctv-cell__name" lang="th">{camera.name}</span>
        <span className="cctv-cell__status mono">
          <span className="cctv-cell__status-dot" aria-hidden="true" />
          {statusLabel(camera)}
        </span>
      </div>
    </button>
  );
}
