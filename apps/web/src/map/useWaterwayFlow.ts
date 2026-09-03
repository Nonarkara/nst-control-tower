import { useEffect, useRef, useState } from "react";
import type { Layer } from "@deck.gl/core";
import {
  riverArrowGlyphs,
  riverArrowLayer,
  type PreparedRiver,
} from "./riverArrows";

/**
 * Animates blinking downhill arrows along every prepared waterway.
 * Same isolation contract as the old flow-dot hook: owns its own rAF loop,
 * and the returned `layer` reference is the ONLY thing that changes per
 * frame — the caller appends it in `allLayers` OUTSIDE the big `layers`
 * useMemo so a tick never rebuilds the rest of the map.
 *
 * Geometry + gauge matching (prepareRiverArrows) is done by the caller and
 * passed in as `prepared`. Prepared changes only when the waterway set or
 * gauge state changes, restarting the loop.
 */
const UPDATE_INTERVAL_MS = 100; // ~10 Hz

export function useWaterwayFlow(
  prepared: PreparedRiver[],
  visible: boolean,
  pausedRef?: { current: boolean },
): {
  layer: Layer | null;
} {
  const [layer, setLayer] = useState<Layer | null>(null);
  const rafRef = useRef<number | null>(null);
  const localPaused = pausedRef ?? { current: false };

  useEffect(() => {
    if (!visible || prepared.length === 0) {
      setLayer(null);
      return;
    }
    const start = performance.now();
    let lastUpdate = 0;
    const tick = (now: number) => {
      if (localPaused.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (now - lastUpdate >= UPDATE_INTERVAL_MS) {
        lastUpdate = now;
        setLayer(riverArrowLayer(riverArrowGlyphs(prepared, now - start)) as Layer);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [visible, prepared]);

  return { layer };
}
