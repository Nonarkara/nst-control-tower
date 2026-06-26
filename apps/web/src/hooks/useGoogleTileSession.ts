import { useEffect, useState } from "react";
import { getGoogleSession, type GoogleTileType } from "../lib/googleTiles";

/**
 * Returns a Google Map Tiles session token for the given map type, minted lazily
 * the first time the layer is enabled. Null while pending, missing a key, or on
 * failure — callers should render the raster source only when it is non-null.
 */
export function useGoogleTileSession(type: GoogleTileType, enabled: boolean): string | null {
  const [session, setSession] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || session) return;
    let alive = true;
    getGoogleSession(type).then((s) => {
      if (alive) setSession(s);
    });
    return () => {
      alive = false;
    };
  }, [type, enabled, session]);

  return session;
}
