import { lazy, Suspense, useEffect, useState } from "react";
import App from "./App";
import { LocaleProvider } from "./hooks/useLocale";

/**
 * Top-level shell for the Yala Super Dashboard — flips between the two systems:
 *   • "geo"      — the 3D geo control-tower (App)
 *   • "terminal" — the Watch Terminal (Bloomberg-style real-time + reference)
 * One button on each flips to the other. Mode persists across reloads.
 */
const TerminalDashboard = lazy(() =>
  import("./components/terminal/TerminalDashboard").then((m) => ({ default: m.TerminalDashboard })),
);

type Mode = "geo" | "terminal";
const KEY = "nst:mode";

export function Root() {
  const [mode, setMode] = useState<Mode>(() => {
    try { return (localStorage.getItem(KEY) as Mode) || "geo"; } catch { return "geo"; }
  });
  useEffect(() => { try { localStorage.setItem(KEY, mode); } catch {} }, [mode]);

  // Locale is app-wide (EN/TH/CN) so it wraps both systems — a language choice
  // made in the geo control-tower carries into the Watch Terminal too.
  const content = mode === "terminal" ? (
    <Suspense fallback={<div style={{ position: "fixed", inset: 0, background: "var(--paper)" }} />}>
      <TerminalDashboard onFlip={() => setMode("geo")} />
    </Suspense>
  ) : (
    <App onFlip={() => setMode("terminal")} />
  );

  return <LocaleProvider>{content}</LocaleProvider>;
}
