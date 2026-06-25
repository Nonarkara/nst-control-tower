import { useState, useCallback } from "react";
import { Tile3DLayer } from "@deck.gl/geo-layers";
import { Tiles3DLoader } from "@loaders.gl/3d-tiles";
import { GOOGLE_MAPS_API_KEY } from "../lib/googleKey";

/** Google Photorealistic 3D Tiles root. Key goes in the URL query (a CORS-simple
 *  request — a custom header would trigger a preflight Google rejects in-browser).
 *  loaders.gl propagates the key + session token to child tiles automatically. */
const GOOGLE_3D_ROOT = "https://tile.googleapis.com/v1/3dtiles/root.json";

interface Props {
  visible: boolean;
  /** "google" → Google Photorealistic 3D Tiles; or an explicit tileset.json URL. */
  source?: "google" | string;
}

interface Tile3DResult {
  layer: Tile3DLayer | null;
  /** Data attribution string Google requires us to display while tiles render. */
  attribution: string;
  /** True once the tileset metadata has loaded — drives the on-map badge. */
  loaded: boolean;
}

/**
 * Photorealistic 3D Tiles via deck.gl Tile3DLayer. For Google tiles the content
 * is textured glTF, so we must NOT override fill/line colours — that would paint
 * the photoreal mesh flat grey. We only collect the copyright string Google
 * requires and surface it for an attribution badge.
 *
 * A fresh Tile3DLayer instance is created every render (the canonical deck.gl
 * pattern — deck diffs by `id` and preserves the Tileset3D in internal state).
 *
 * Coverage: full photoreal mesh over Bangkok and major metros; provincial Thai
 * towns may return only coarse terrain. Degrades gracefully (empty) when there
 * is no key or no coverage.
 */
export function useTile3DLayer({ visible, source = "google" }: Props): Tile3DResult {
  const [loaded, setLoaded] = useState(false);
  const [attribution, setAttribution] = useState("");

  const isGoogle = source === "google";
  const tilesetUrl = isGoogle
    ? (GOOGLE_MAPS_API_KEY ? `${GOOGLE_3D_ROOT}?key=${GOOGLE_MAPS_API_KEY}` : "")
    : source;

  // Google sends per-tile data-provider credits in the copyright field; surface
  // them so the attribution badge reflects the imagery actually on screen.
  const onTilesetLoad = useCallback((tileset: { credits?: { html?: string } }) => {
    setLoaded(true);
    const html = tileset?.credits?.html ?? "";
    const text = html.replace(/<[^>]*>/g, "").trim();
    if (text) setAttribution(text);
  }, []);

  const layer = !visible || !tilesetUrl
    ? null
    : new Tile3DLayer({
        id: isGoogle ? "google-3d-tiles" : "tile-3d-layer",
        data: tilesetUrl,
        loader: Tiles3DLoader,
        onTilesetLoad,
        onTileError: (err: unknown) => {
          if (import.meta.env.DEV) console.error("[Tile3DLayer] tile error", err);
        },
        pickable: false,
        opacity: 1,
        // Higher MSE = fewer tiles in flight → smoother panning on big scenes.
        maximumScreenSpaceError: 16,
      });

  return {
    layer,
    attribution: attribution || (isGoogle ? "Imagery © Google" : ""),
    loaded,
  };
}
