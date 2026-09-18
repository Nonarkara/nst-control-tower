/**
 * TopBar — the shell's single header band.
 *
 * Left to right: who (city wordmark) · now (time, weather, air) · system
 * health · tools · settings. No logos, no ornament, no tickers: partner marks
 * live in the status bar, and every feed's detail lives in the source catalog.
 * Each control's visible text is contained in its accessible name (WCAG 2.5.3).
 */
import { useEffect, useRef, useState } from "react";
import { type AcademicSnapshot, type FallbackTier, CHONBURI } from "@nst/shared";
import { useTheme } from "../hooks/useTheme";
import { useLocale } from "../hooks/useLocale";
import { aqiBand } from "../lib/worldStrip";

interface FeedHealth {
  label: string;
  tier: FallbackTier | "loading";
  ageMinutes: number;
}

export interface TopBarConditions {
  tempC: number | null;
  condition: string | null;
  aqi: number | null;
}

interface Props {
  feeds: FeedHealth[];
  onOpenCatalog: () => void;
  catalogCount: number;
  viewMode: "2D" | "3D";
  onCycleViewMode: () => void;
  onOpenManual: () => void;
  onOpenShortcuts: () => void;
  onOpenWhitepaper: () => void;
  onOpenSheets: () => void;
  onOpenAtlas: () => void;
  onOpenPlatform: () => void;
  onOpenFloodGuide: () => void;
  onOpenCctvCommand: () => void;
  onOpenHeritage3D?: () => void;
  onFlip?: () => void;
  sheetsConfigured: boolean;
  /** Retained for API compatibility with the university fork; not shown. */
  academic?: AcademicSnapshot | null;
  systemStatus?: "healthy" | "degraded" | "down" | "unknown";
  conditions?: TopBarConditions | null;
}

const CLOCK_TICK_MS = 15_000;

function useClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * Feed health in words. It never says "all normal" unless every feed is
 * live: "All systems normal · 4/9 live" beside WATER ◆ ELEVATED was a
 * contradiction in the most prominent spot on the screen. Situation (is the
 * city OK?) lives in the rail's headline card; this button only answers
 * "can I trust the numbers?", worded from the worst case, not the count of
 * healthy feeds.
 */
export function feedHealthWord(
  systemStatus: NonNullable<Props["systemStatus"]>,
  live: number,
  total: number,
): { word: string; dot: "live" | "stale" | "unavailable" | "loading" } {
  if (systemStatus === "down") return { word: "Data server unreachable", dot: "unavailable" };
  if (total === 0 || systemStatus === "unknown") return { word: "Checking data feeds", dot: "loading" };
  if (live >= total) return { word: "All data feeds live", dot: "live" };
  if (live === 0) return { word: "No live data feeds", dot: "unavailable" };
  const notLive = total - live;
  return { word: `${notLive} of ${total} feeds not live`, dot: "stale" };
}

function MoreMenu({ items }: { items: Array<{ label: string; onSelect: () => void }> }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  return (
    <div className="topbar-more" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="btn"
        aria-expanded={open}
        aria-controls="topbar-more-menu"
        onClick={() => setOpen((v) => !v)}
      >
        More <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul id="topbar-more-menu" className="topbar-more__menu">
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                className="btn btn--quiet"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TopBar({
  feeds,
  onOpenCatalog,
  viewMode,
  onCycleViewMode,
  onOpenManual,
  onOpenShortcuts,
  onOpenWhitepaper,
  onOpenSheets,
  onOpenAtlas,
  onOpenFloodGuide,
  onOpenHeritage3D,
  onOpenCctvCommand,
  onFlip,
  sheetsConfigured,
  systemStatus = "unknown",
  conditions,
}: Props) {
  const now = useClock();
  const { theme, toggle } = useTheme();
  const { locale, toggle: toggleLocale } = useLocale();
  const liveCount = feeds.filter((f) => f.tier === "live").length;
  const health = feedHealthWord(systemStatus, liveCount, feeds.length);
  const air = aqiBand(conditions?.aqi ?? null);
  const nextView = viewMode === "2D" ? "3D" : "2D";
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <header className="topbar">
      <a className="topbar-id" href="https://www.nakhoncity.org" target="_blank" rel="noreferrer">
        <span className="topbar-id__city">{CHONBURI.name.en}</span>
        <span className="topbar-id__org" lang="th">เทศบาลนครนครศรีธรรมราช · Control Tower</span>
      </a>

      <dl className="topbar-now" aria-label="Now in the city">
        <div>
          <dt>Time</dt>
          <dd className="num">
            <time dateTime={now.toISOString()}>
              {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </time>{" "}
            <span className="topbar-now__sub">
              {now.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          </dd>
        </div>
        <div>
          <dt>Weather</dt>
          <dd>
            <span className="num">{conditions?.tempC != null ? `${Math.round(conditions.tempC)}°C` : "—"}</span>{" "}
            <span className="topbar-now__sub">{conditions?.condition ?? ""}</span>
          </dd>
        </div>
        <div>
          <dt>Air quality</dt>
          <dd>
            <span className="num">{conditions?.aqi ?? "—"}</span>{" "}
            <span className="topbar-now__sub">{conditions?.aqi != null ? air.label : ""}</span>
          </dd>
        </div>
      </dl>

      <div className="topbar-spacer" />

      <button
        type="button"
        className="btn topbar-health"
        onClick={onOpenCatalog}
        aria-label={`Data feeds: ${health.word}. Open feed details.`}
        title="Which data feeds are live, stale or down — opens the source catalog"
      >
        <span className={`dot ${health.dot}`} aria-hidden="true" />
        <span>{health.word}</span>
      </button>

      <nav className="topbar-nav" aria-label="Tools">
        <button
          type="button"
          className="btn topbar-cctv"
          onClick={onOpenCctvCommand}
          aria-label="Open CCTV command center — full-screen wall of live camera feeds"
        >
          CCTV
        </button>
        <button type="button" className="btn" onClick={onOpenCatalog} aria-label="Open source catalog">
          Source catalog
        </button>
        {/* Every data.go.th dataset for the province, parsed into tables. */}
        <a className="btn" href="/data" aria-label="Open data — every data.go.th dataset for Nakhon Si Thammarat as searchable tables">
          Data
        </a>
        <button type="button" className="btn" onClick={onOpenAtlas} aria-label="Open atlas — outcome indicators and data sources">
          Atlas
        </button>
        <button type="button" className="btn" onClick={onOpenFloodGuide} aria-label="Open flood guide — how flooding works and what this dashboard monitors">
          Flood guide
        </button>
        {onOpenHeritage3D && (
          <button
            type="button"
            className="btn topbar-heritage-3d"
            onClick={onOpenHeritage3D}
            aria-label="Open heritage 3D demo — photogrammetry viewer"
          >
            3D heritage
          </button>
        )}
        <MoreMenu
          items={[
            // The analyst data view stays reachable, but not as a top-level
            // "Terminal" button in a mayor's header.
            ...(onFlip ? [{ label: "Analyst data view", onSelect: onFlip }] : []),
            { label: sheetsConfigured ? "Google Sheet (live)" : "Connect Google Sheet", onSelect: onOpenSheets },
            { label: "User manual", onSelect: onOpenManual },
            { label: "Whitepaper", onSelect: onOpenWhitepaper },
            { label: "Keyboard shortcuts", onSelect: onOpenShortcuts },
          ]}
        />
      </nav>

      <div className="topbar-settings" role="group" aria-label="Display settings">
        <button type="button" className="btn" onClick={onCycleViewMode} aria-label={`Switch to ${nextView} view`}>
          {nextView}
        </button>
        <button
          type="button"
          className="btn"
          onClick={toggleLocale}
          aria-label={`Switch to ${locale === "en" ? "Thai" : "English"} interface`}
        >
          {locale === "en" ? "TH" : "EN"}
        </button>
        <button type="button" className="btn" onClick={toggle} aria-label={`Switch to ${nextTheme} theme`}>
          {nextTheme === "light" ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}
