// Typography: one grotesque family, MoMA-style — Libre Franklin (Franklin
// Gothic revival, self-hosted in styles/fonts.css) for Latin, IBM Plex Sans
// Thai for Thai. Tabular numerals come from font-variant-numeric in tokens.css.
import "@fontsource/ibm-plex-sans-thai/400.css";
import "@fontsource/ibm-plex-sans-thai/500.css";
import "@fontsource/ibm-plex-sans-thai/600.css";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/layout.css";
import "./styles/atlas.css";
import "./styles/platform.css";
import "./styles/terminal.css";
import "maplibre-gl/dist/maplibre-gl.css";
// Panel/dialog styles composed from the system primitives.
import "./styles/panels-flood.css";
import "./styles/panels-city.css";
import "./styles/dialogs.css";
// Last on purpose: the shared primitives + accessibility floor override legacy rules.
import "./styles/system.css";

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
