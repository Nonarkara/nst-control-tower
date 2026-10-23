import { lazy, Suspense, useEffect, useState } from "react";
const App = lazy(() => import("./App"));
import { LocaleProvider } from "./hooks/useLocale";

/**
 * Top-level shell for the NST Control Tower — flips between the two systems:
 *   • "geo"      — the 3D geo control-tower (App)
 *   • "terminal" — the Watch Terminal (Bloomberg-style real-time + reference)
 * One button on each flips to the other. Mode persists across reloads.
 */
const TerminalDashboard = lazy(() =>
  import("./components/terminal/TerminalDashboard").then((m) => ({ default: m.TerminalDashboard })),
);

// /data — the open-data workbench (every data.go.th dataset for the province).
// Its own lazy chunk so the map bundle never carries it.
const DataWorkbenchPage = lazy(() => import("./components/data/DataWorkbenchPage"));

const FloodWatchPage = lazy(() => import("./components/FloodWatchPage"));
// The mayor's desk — this morning's situation, warnings and news in one
// screen. Its own lazy chunk, like every full surface here.
const MayorDesk = lazy(() => import("./components/MayorDesk"));

type Mode = "geo" | "terminal";

function isDataRoute(): boolean {
  return /^\/data(\/|$)/.test(window.location.pathname);
}

/**
 * What a route shows while its chunk is still arriving.
 *
 * This used to be a bare full-bleed rectangle in --paper (and, on /flood-ops,
 * a lone <p> with no way out). Both were a region with no job: the reader was
 * told nothing about where they were or what was happening, and a cold load can
 * sit here for 20 s+ because /api/water/gauges is slow on its first request.
 *
 * Three jobs, no more: name the place, name what is arriving, and — where the
 * URL is deep enough that the loaded route might not be what the reader wanted
 * — offer the way back. No progress bar: we have no honest percentage, and an
 * invented one would be a claim the code cannot support.
 */
function RouteFallback({
  place,
  what,
  backHref,
  backLabel,
}: {
  place: string;
  what: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <p className="route-fallback__place">{place}</p>
      <p className="route-fallback__what">{what}</p>
      {backHref && backLabel ? (
        <a className="route-fallback__back" href={backHref}>
          {backLabel}
        </a>
      ) : null}
    </div>
  );
}

export function Root() {
  if (/^\/mayor-desk(\/|$)/.test(window.location.pathname)) {
    return (
      <LocaleProvider>
        <Suspense
          fallback={
            <RouteFallback
              place="เทศบาลนครนครศรีธรรมราช · โต๊ะทำงานนายกฯ"
              what="Loading the mayor's desk…"
              backHref="/"
              backLabel="← Back to the map"
            />
          }
        >
          <MayorDesk />
        </Suspense>
      </LocaleProvider>
    );
  }
  if (/^\/flood-ops(\/|$)/.test(window.location.pathname)) {
    return (
      <LocaleProvider>
        <Suspense
          fallback={
            <RouteFallback
              place="เทศบาลนครนครศรีธรรมราช · Flood watch"
              what="Loading the flood watch centre…"
              backHref="/"
              backLabel="← Back to the map"
            />
          }
        >
          <FloodWatchPage />
        </Suspense>
      </LocaleProvider>
    );
  }
  if (isDataRoute()) {
    return (
      <LocaleProvider>
        <Suspense
          fallback={<RouteFallback place="Nakhon Si Thammarat City Municipality · Open data" what="Loading the open-data workbench…" />}
        >
          <DataWorkbenchPage />
        </Suspense>
      </LocaleProvider>
    );
  }
  return <Dashboard />;
}

function Dashboard() {
  // Always open on the map. The analyst terminal was remembered across visits,
  // so one stray tap in More turned the dashboard into a dense terminal on
  // every later load (and the only way out is a small button).
  const [mode, setMode] = useState<Mode>("geo");

  // Locale is app-wide (EN/TH/CN) so it wraps both systems — a language choice
  // made in the geo control-tower carries into the Watch Terminal too.
  const content = mode === "terminal" ? (
    <Suspense
      fallback={<RouteFallback place="Nakhon Si Thammarat City Municipality · Watch Terminal" what="Loading the watch terminal…" />}
    >
      <TerminalDashboard onFlip={() => setMode("geo")} />
    </Suspense>
  ) : (
    <Suspense
      fallback={
        <RouteFallback
          place="Nakhon Si Thammarat City Municipality · Control Tower"
          what="Loading the map and its layers…"
        />
      }
    >
      <App onFlip={() => setMode("terminal")} />
    </Suspense>
  );

  return <LocaleProvider>{content}</LocaleProvider>;
}
