/**
 * CctvCommandCenter — the "epic" full-screen CCTV wall.
 *
 * One click in the topbar fires `openCctvCommandCenter`:
 *   - both rails collapse
 *   - the map flies out to a bbox covering every camera + the city centre
 *   - this overlay takes over the viewport with a grid of live thumbnails,
 *     status + category chips, and a search field
 *   - clicking a thumbnail opens the existing CctvStreamModal
 *
 * Design language follows the rest of the dashboard: zero-radius chrome,
 * hairline frame, status via the closed colour set, one accent. The wall
 * itself is intentionally dense — "epic" comes from the cascade of live
 * views, not from decoration. Status colour drives the border tint:
 *   online  → --good    watch  → --warn
 *   offline → --bad     unknown → --ink-3
 *
 * Honour prefers-reduced-motion: thumbnail entrance fades only, no slide;
 * the iframe embeds the upstream MediaMTX player directly (no JS video
 * plumbing) so we don't add per-frame cost of our own.
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
  /** Centre lng/lat for the bbox fit (defaults to the NST city centre). */
  cityCenter?: { lng: number; lat: number };
  onClose: () => void;
  /** Open the existing stream modal for the given camera. */
  onSelect: (camera: CctvCamera) => void;
}

const STATUS_CHIP: { value: "all" | CctvStatus; label: string; tone: string }[] = [
  { value: "all", label: "All", tone: "var(--ink-2)" },
  { value: "online", label: "Online", tone: "var(--good)" },
  { value: "offline", label: "Offline", tone: "var(--bad)" },
  { value: "unknown", label: "Unknown", tone: "var(--ink-3)" },
];

function statusTone(s: CctvStatus | undefined): string {
  if (s === "online") return "var(--good)";
  if (s === "offline") return "var(--bad)";
  return "var(--ink-3)";
}

/** CctvSummary only tracks online/offline counts; derive `unknown` (= total
 *  minus the two known buckets) on the fly so the chip filter shows
 *  cameras whose status endpoint hasn't reported yet. */
function countByStatus(summary: { total: number; online: number; offline: number }, value: "all" | CctvStatus): number {
  if (value === "all") return summary.total;
  if (value === "online") return summary.online;
  if (value === "offline") return summary.offline;
  return Math.max(0, summary.total - summary.online - summary.offline);
}

export function CctvCommandCenter({ cameras, onClose, onSelect }: Props) {
  const [category, setCategory] = useState<CctvCategory | "all">("all");
  const [status, setStatus] = useState<"all" | CctvStatus>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const searchId = useId();

  const summary = useMemo(() => summarizeCctv(cameras), [cameras]);
  const filtered = useMemo(
    () =>
      filterCameras(cameras, { category, query }).filter((c) =>
        status === "all" ? true : (c.status ?? "unknown") === status,
      ),
    [cameras, category, query, status],
  );

  const PAGE_SIZE = 32;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="cctv-cc" role="dialog" aria-modal="true" aria-label="CCTV command center">
      {/* Top command strip */}
      <header className="cctv-cc__head">
        <div className="cctv-cc__head-left">
          <span className="cctv-cc__eyebrow mono">CCTV COMMAND CENTER</span>
          <h1 className="cctv-cc__title">
            <span className="num">{summary.online}</span>
            <span className="cctv-cc__title-sep">/</span>
            <span className="num">{summary.total}</span>
            <span className="cctv-cc__title-unit">cameras live</span>
          </h1>
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
        </div>
        <div className="cctv-cc__head-right">
          <label className="cctv-cc__search">
            <span id={searchId} className="visually-hidden">Search cameras</span>
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder="Search name or camera id…"
              aria-labelledby={searchId}
            />
          </label>
          <button
            type="button"
            className="cctv-cc__close mono"
            onClick={onClose}
            aria-label="Close command center"
          >
            ESC · CLOSE
          </button>
        </div>
      </header>

      {/* The wall */}
      {filtered.length === 0 ? (
        <div className="cctv-cc__empty mono">
          No cameras match the current filter.
        </div>
      ) : (
        <div className="cctv-cc__wall">
          {pageItems.map((c) => (
            <CameraCell
              key={c.id}
              camera={c}
              tone={statusTone(c.status)}
              onClick={() => onSelect(c)}
            />
          ))}
        </div>
      )}

      {/* Footer pager */}
      <footer className="cctv-cc__foot">
        <span className="mono cctv-cc__foot-meta">
          {safePage * PAGE_SIZE + 1}–{Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)} of {filtered.length}
        </span>
        <div className="cctv-cc__pager">
          <button
            type="button"
            className="cctv-cc__pager-btn mono"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          >
            ← PREV
          </button>
          <span className="mono num cctv-cc__pager-label">
            {safePage + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="cctv-cc__pager-btn mono"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage(safePage + 1)}
          >
            NEXT →
          </button>
        </div>
      </footer>
    </div>
  );
}

// ── Single camera cell ────────────────────────────────────────────────────

interface CellProps {
  camera: CctvCamera;
  tone: string;
  onClick: () => void;
}

function CameraCell({ camera, tone, onClick }: CellProps) {
  const isOffline = camera.status === "offline";
  const hasStream = !isOffline && (camera.embedUrl || camera.hlsUrl || camera.imageUrl);
  return (
    <button
      type="button"
      className={`cctv-cell ${isOffline ? "is-offline" : "is-online"}`}
      onClick={onClick}
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
