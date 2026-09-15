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
import {
  getCaptureStats,
  subscribeCaptureStats,
  useWhepFrame,
  type FrameState,
} from "../lib/cctvCapturePool";

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

// Wall renders ALL filtered cameras in a single scrollable rail —
// no pagination. The slot manager (MAX 4 concurrent WebRTC streams)
// keeps the browser stable; the IntersectionObserver per cell mounts
// an iframe only when scrolled into view + a slot is free. The
// impression-of-density comes from seeing the full camera inventory
// scroll past, not from clicking through pages.

// Wall clock — Asia/Bangkok, HH:MM:SS. One shared formatter; the ticking value
// is computed once per second in the parent and passed down, so we never spin
// up an interval per cell.
const CLOCK_FMT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  timeZone: "Asia/Bangkok",
});
function nowClock(): string {
  return CLOCK_FMT.format(new Date());
}

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

// The wall no longer runs live WebRTC iframes per tile (100+ decoders freeze
// the tab). Instead each on-screen tile grabs ONE still frame via WHEP and
// caches it — the "guard tour" model. All of that lives in `cctvCapturePool`
// / `whepSnapshot`; this component just subscribes for stats and renders.

/** Format a captured-frame time as HH:MM:SS ICT for the tile overlay. */
function frameClock(capturedAt: number): string {
  return CLOCK_FMT.format(new Date(capturedAt));
}

/** Derive the WHEP endpoint from a camera's embed (reader-page) URL.
 *  Upstream embed is `…/cam/{id}_sub/`; the WHEP signaling endpoint is
 *  the same path + `whep`. */
function whepUrlFor(camera: CctvCamera): string | undefined {
  if (!camera.embedUrl) return undefined;
  return camera.embedUrl.replace(/\/?$/, "/") + "whep";
}

export function CctvCommandCenter({ cameras, side, highlightedId, onSelect, onExit }: Props) {
  const [category, setCategory] = useState<CctvCategory | "all">("all");
  const [status, setStatus] = useState<"all" | CctvStatus>("all");
  const [query, setQuery] = useState("");
  const searchId = useId();
  const wallRef = useRef<HTMLDivElement>(null);

  // Live counter for the capture pool — how many still-frame grabs are
  // running right now, and how many cameras have an image so far.
  const [capStats, setCapStats] = useState(() => getCaptureStats());
  useEffect(() => subscribeCaptureStats(() => setCapStats(getCaptureStats())), []);

  // Ticking wall clock — the "this is live" heartbeat. One interval for the
  // whole rail; the label is threaded to every streaming cell as a timestamp.
  const [now, setNow] = useState(nowClock);
  useEffect(() => {
    const t = window.setInterval(() => setNow(nowClock()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Half of the cameras for this rail. We filter THEN split (so parity
  // is stable across filter changes — same camera goes to the same rail
  // regardless of which categories the operator is currently viewing).
  const fullFiltered = useMemo(
    () => filterCameras(cameras, { category, query }).filter((c) => status === "all" ? true : (c.status ?? "unknown") === status),
    [cameras, category, query, status],
  );
  const myHalf = useMemo(() => splitByParity(fullFiltered, side), [fullFiltered, side]);
  const summary = useMemo(() => summarizeCctv(myHalf), [myHalf]);

  // Map→wall sync: find the matching tile and scrollIntoView. The wall
  // is a single scrollable column now (no pagination), so this just
  // scrolls the rail's overflow container — easy.
  useEffect(() => {
    if (!highlightedId || !wallRef.current) return;
    const raf = requestAnimationFrame(() => {
      const el = wallRef.current?.querySelector<HTMLElement>(`[data-cam-id="${cssEscape(highlightedId)}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(raf);
  }, [highlightedId, myHalf]);

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
        <div className="cctv-cc__streams mono" aria-live="polite">
          <span className="num">{capStats.imaged}</span>
          <span className="cctv-cc__streams-unit">imaged</span>
          {capStats.active > 0 && (
            <span className="cctv-cc__streams-queued num"> · {capStats.active}/{capStats.cap} capturing</span>
          )}
        </div>
        <div className="cctv-cc__clock mono" aria-hidden="true">
          <span className="cctv-cc__clock-dot" />
          <span className="cctv-cc__clock-label">LIVE</span>
          <span className="num cctv-cc__clock-time">{now}</span>
          <span className="cctv-cc__clock-tz">ICT</span>
        </div>
      </header>

      <div className="cctv-cc__chips" role="group" aria-label="Status filter">
        {STATUS_CHIP.filter((c) => c.value === "all" || countByStatus(summary, c.value) > 0).map((c) => (
          <button
            key={c.value}
            type="button"
            className={`cctv-cc__chip ${status === c.value ? "is-on" : ""}`}
            aria-pressed={status === c.value}
            onClick={() => { setStatus(c.value); }}
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
            onClick={() => { setCategory(category === c ? "all" : c); }}
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
          onChange={(e) => { setQuery(e.target.value); }}
          placeholder="Search…"
          aria-labelledby={searchId}
        />
      </label>

      {myHalf.length === 0 ? (
        <div className="cctv-cc__empty mono">No cameras.</div>
      ) : (
        <div className="cctv-cc__wall" ref={wallRef}>
          {myHalf.map((c) => (
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
  onClick: (camera: CctvCamera) => void;
}

function CameraCell({ camera, tone, highlighted, onClick }: CellProps) {
  const isOffline = camera.status === "offline";
  const whepUrl = whepUrlFor(camera);
  const hasStream = !isOffline && !!whepUrl;
  const viewportRef = useRef<HTMLDivElement>(null);

  // inView: IntersectionObserver says the viewport is on screen. A generous
  // rootMargin starts the capture just before the tile scrolls in. When the
  // tile leaves view we drop our interest (the pool stops refreshing it) but
  // the cached still frame is kept, so scrolling back is instant.
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "300px", threshold: 0.01 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // The capture pool does the work: while in view, it grabs a still frame via
  // WHEP and refreshes it on a slow cadence. `frame` is the latest captured
  // image (retained across scroll/filter); `kind` tells us what to show while
  // there isn't one yet.
  const frameState: FrameState = useWhepFrame(camera.id, whepUrl, inView && hasStream);
  const frame = frameState.frame;
  const isLive = !!frame; // a real captured image is on screen
  const category = camera.category ?? "other";

  return (
    <div
      role="button"
      tabIndex={0}
      className={`cctv-cell ${isOffline ? "is-offline" : "is-online"} ${highlighted ? "is-highlighted" : ""} ${frameState.kind === "error" && !frame ? "is-error" : ""} ${isLive ? "is-live" : ""}`}
      onClick={onClick ? () => onClick(camera) : undefined}
      onKeyDown={(e) => {
        // Enter opens the full-size live view (CctvStreamModal, which runs a
        // real WebRTC stream). The modal handles its own close.
        if (e.key === "Enter") onClick?.(camera);
      }}
      data-cam-id={camera.id}
      style={{
        ["--cell-tone" as never]: tone,
        ["--cell-cat" as never]: `var(--cctv-${category})`,
      }}
      title={`${camera.name} — click for live view · pulses on map`}
    >
      <div className="cctv-cell__viewport" ref={viewportRef}>
        {isLive && (
          <div className="cctv-cell__live" aria-hidden="true">
            <span className="cctv-cell__live-dot" />
            LIVE
          </div>
        )}
        {frame && (
          <div className="cctv-cell__ts mono" aria-hidden="true">{frameClock(frame.capturedAt)}</div>
        )}
        {frame ? (
          // A captured still. WebRTC frames aren't cross-origin-tainted, so the
          // data URL renders directly. It refreshes on the pool's cadence.
          <img src={frame.dataUrl} alt={camera.name} decoding="async" />
        ) : isOffline ? (
          <div className="cctv-cell__no-stream mono">OFFLINE</div>
        ) : !hasStream ? (
          <div className="cctv-cell__no-stream mono">NO STREAM</div>
        ) : frameState.kind === "error" ? (
          <div className="cctv-cell__no-stream mono">NO SIGNAL</div>
        ) : !inView ? (
          <div className="cctv-cell__standby mono">SCROLL TO LOAD</div>
        ) : (
          <div className="cctv-cell__standby cctv-cell__standby--load mono">LOADING</div>
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
    </div>
  );
}
