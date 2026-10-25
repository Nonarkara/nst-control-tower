/**
 * TopBar — the shell's single header band.
 *
 * Left to right: who (city wordmark) · now (time, weather, air) · system
 * health · tools · settings. No logos, no ornament, no tickers: partner marks
 * live in the status bar, and every feed's detail lives in the source catalog.
 * Each control's visible text is contained in its accessible name (WCAG 2.5.3).
 */
import { useEffect, useRef, useState } from "react";
import { type AcademicSnapshot, type FallbackTier, NST } from "@nst/shared";
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
  if (total === 0 || systemStatus === "unknown") return { word: "Checking data sources", dot: "loading" };
  if (live >= total) return { word: "All data sources live", dot: "live" };
  if (live === 0) return { word: "No live data sources", dot: "unavailable" };
  const notLive = total - live;
  return { word: `${notLive} of ${total} data sources not live`, dot: "stale" };
}

/**
 * The same worst-case state in one word, for headers too narrow for the full
 * sentence. A bare status dot says nothing — the mayor cannot tell whether
 * the numbers can be trusted — so the narrow header keeps the state word and
 * drops the sentence. The long form stays the accessible name.
 *
 * When some feeds are stale the short form carries the count too, in the
 * sibling war room's shape ("ฟีด 14/17"): "STALE 5/9" tells the mayor how
 * much of the dashboard is untrustworthy, where a bare "STALE" only tells him
 * that something is wrong. The count is bounded — the product has a fixed
 * number of feeds — so the label cannot grow with the news and reflow the
 * bar on the morning the mayor needs it most.
 */
export function feedHealthShort(
  dot: "live" | "stale" | "unavailable" | "loading",
  notLive = 0,
  total = 0,
): string {
  switch (dot) {
    case "live": return "LIVE";
    case "stale": return total > 0 && notLive > 0 ? `STALE ${notLive}/${total}` : "STALE";
    case "unavailable": return "DOWN";
    case "loading": return "CHECK";
  }
}

/**
 * The identity line, in the three widths the header actually has room for.
 * The full municipality name does not fit a phone header — when it was
 * squeezed in, the browser truncated it to "Nakhon Si T…", which is a name
 * that identifies nothing. Each tier below is a complete name, not a cut one.
 */
const CITY_FULL = NST.name.en;                     // desktop
const CITY_MID = "Nakhon Si Thammarat";            // tablet
const CITY_SHORT = "NST-01";                       // phone

function MoreMenu({ items }: { items: Array<{ label: string; ariaLabel?: string; mobileOnly?: boolean; prefsOnly?: boolean; group?: string; onSelect: () => void }> }) {
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
          {items.map((item, index) => (
            <li
              key={item.label}
              className={
                item.mobileOnly ? "topbar-more__mobile-only"
                : item.prefsOnly ? "topbar-more__prefs-only"
                : undefined
              }
            >
              {item.group && item.group !== items[index - 1]?.group && <div className="topbar-more__group">{item.group}</div>}
              <button
                type="button"
                className="btn btn--quiet"
                aria-label={item.ariaLabel}
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
  const notLive = feeds.length - liveCount;
  const healthLabel = feedHealthShort(health.dot, notLive, feeds.length);
  const air = aqiBand(conditions?.aqi ?? null);
  const nextView = viewMode === "2D" ? "3D" : "2D";
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <header className="topbar">
      <a
        className="topbar-id"
        href="https://www.nakhoncity.org"
        target="_blank"
        rel="noreferrer"
        aria-label={`${CITY_SHORT} · ${NST.name.en} · ${NST.name.th} · Control Tower`}
      >
        <span className="topbar-id__city">
          <span className="topbar-id__tier topbar-id__tier--full">{CITY_FULL}</span>
          <span className="topbar-id__tier topbar-id__tier--mid" aria-hidden="true">{CITY_MID}</span>
          <span className="topbar-id__tier topbar-id__tier--short" aria-hidden="true">{CITY_SHORT}</span>
        </span>
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
        aria-label={`${healthLabel} — ${health.word}. Open source details.`}
        title="Which data feeds are live, stale or down — opens the source catalog"
      >
        <span className={`dot ${health.dot}`} aria-hidden="true" />
        <span className="topbar-health__short">{healthLabel}</span>
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
        <a href="/flood-ops" className="btn" aria-label="Open flood operations briefing">FLOOD WATCH</a>
        <a
          href="/mayor-desk"
          className="btn btn--primary topbar-desk"
          aria-label="Open the mayor's desk — this morning's situation, warnings and news in one screen"
        >
          DESK
        </a>
        <MoreMenu
          items={[
            // Phones hide the header buttons; the mayor still needs the flood briefing.
            { label: "Flood watch / เฝ้าระวังน้ำท่วม", group: "Operations", mobileOnly: true, onSelect: () => window.location.assign("/flood-ops") },
            { label: "Mayor's desk / โต๊ะทำงานนายกฯ", group: "Operations", mobileOnly: true, ariaLabel: "Open the mayor's desk — this morning's situation, warnings and news in one screen", onSelect: () => window.location.assign("/mayor-desk") },
            // The display preferences are preferences, not tasks. Below 1440px
            // the bar has no room for them, so they move into this menu —
            // a deliberate arrangement change, not a squeezed one. The task
            // cluster (CCTV, FLOOD WATCH, DESK) keeps its one-click place.
            { label: nextView === "2D" ? "3D view" : "2D view", group: "Display", prefsOnly: true, ariaLabel: `Switch to ${nextView} view`, onSelect: onCycleViewMode },
            { label: locale === "en" ? "ภาษาไทย / Thai" : "English", group: "Display", prefsOnly: true, ariaLabel: `Switch to ${locale === "en" ? "Thai" : "English"} interface`, onSelect: toggleLocale },
            { label: nextTheme === "light" ? "Light theme" : "Dark theme", group: "Display", prefsOnly: true, ariaLabel: `Switch to ${nextTheme === "light" ? "light" : "dark"} theme`, onSelect: toggle },
            { label: "Flood guide", group: "Help", ariaLabel: "Open flood guide — how flooding works and what this dashboard monitors", onSelect: onOpenFloodGuide },
            { label: "Source catalog", group: "Data", ariaLabel: "Open source catalog", onSelect: onOpenCatalog },
            { label: "Data tables", group: "Data", ariaLabel: "Open data — every data.go.th dataset for Nakhon Si Thammarat as searchable tables", onSelect: () => window.location.assign("/data") },
            { label: "Atlas", group: "Data", ariaLabel: "Open atlas — outcome indicators and data sources", onSelect: onOpenAtlas },
            ...(onOpenHeritage3D ? [{ label: "3D heritage — Phra Borommathat Chedi", group: "City", ariaLabel: "Open heritage 3D demo — photogrammetry viewer", onSelect: onOpenHeritage3D }] : []),
            // The analyst data view stays reachable, but not as a top-level
            // "Terminal" button in a mayor's header.
            ...(onFlip ? [{ label: "Analyst data view", group: "Data", onSelect: onFlip }] : []),
            { label: sheetsConfigured ? "Google Sheet (live)" : "Connect Google Sheet", group: "Data", onSelect: onOpenSheets },
            { label: "User manual", group: "Help", onSelect: onOpenManual },
            { label: "Whitepaper", group: "Help", onSelect: onOpenWhitepaper },
            { label: "Keyboard shortcuts", group: "Help", onSelect: onOpenShortcuts },
          ].sort((a, b) => ["Operations", "Display", "Data", "City", "Help"].indexOf(a.group) - ["Operations", "Display", "Data", "City", "Help"].indexOf(b.group))}
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
