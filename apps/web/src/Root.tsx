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

type Mode = "geo" | "terminal";

function isDataRoute(): boolean {
  return /^\/data(\/|$)/.test(window.location.pathname);
}

export function Root() {
  if (/^\/flood-ops(\/|$)/.test(window.location.pathname)) {
    return <Suspense fallback={<p lang="th">กำลังโหลดศูนย์เฝ้าระวังน้ำท่วม…</p>}><FloodWatchPage /></Suspense>;
  }
  if (isDataRoute()) {
    return (
      <LocaleProvider>
        <Suspense fallback={<div style={{ position: "fixed", inset: 0, background: "var(--paper)" }} />}>
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
    <Suspense fallback={<div style={{ position: "fixed", inset: 0, background: "var(--paper)" }} />}>
      <TerminalDashboard onFlip={() => setMode("geo")} />
    </Suspense>
  ) : (
    <Suspense fallback={<div style={{ position: "fixed", inset: 0, background: "var(--paper)" }} />}>
      <App onFlip={() => setMode("terminal")} />
    </Suspense>
  );

  return <LocaleProvider>{content}</LocaleProvider>;
}
