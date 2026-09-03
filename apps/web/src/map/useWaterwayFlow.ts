import { useEffect, useRef, useState } from "react";
import type { Layer } from "@deck.gl/core";
import {
  flattenRiverGlyphs,
  riverArrowLayer,
  type PreparedRiver,
} from "./riverArrows";

/**
 * Blinks downhill arrows along every prepared waterway.
 * Geometry is flattened once; the rAF tick only swaps the TextLayer color
 * trigger so a frame never reallocates thousands of glyph objects (that freeze
 * froze the FLOOD lens on CI software-WebGL).
 */
const UPDATE_INTERVAL_MS = 160;

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
    const glyphs = flattenRiverGlyphs(prepared);
    const start = performance.now();
    let lastUpdate = 0;
    const tick = (now: number) => {
      if (localPaused.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (now - lastUpdate >= UPDATE_INTERVAL_MS) {
        lastUpdate = now;
        setLayer(riverArrowLayer(glyphs, now - start) as Layer);
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
