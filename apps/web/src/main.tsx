// Typography: Inter — the neo-grotesque voice (Rams DNA §2.1). One family for
// body, display, and tabular-numeral readouts; Sans Thai fills the one gap
// Inter has (no Thai glyphs) so bilingual copy still renders natively.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/ibm-plex-sans-thai/400.css";
import "@fontsource/ibm-plex-sans-thai/500.css";
import "@fontsource/ibm-plex-sans-thai/600.css";

import "./styles/tokens.css";
import "./styles/layout.css";
import "./styles/atlas.css";
import "./styles/platform.css";
import "./styles/terminal.css";
import "maplibre-gl/dist/maplibre-gl.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Root } from "./Root";
import { ErrorBoundary } from "./components/ErrorBoundary";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root element not found");
createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
);
