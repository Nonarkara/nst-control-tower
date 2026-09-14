import { useEffect, useRef, useState } from "react";
import type { ScatterplotLayer } from "@deck.gl/layers";
import { waterwayFlowDots, waterwayFlowLayer, type PreparedFlowLine, type WaterwayFlowDot } from "./layers";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

/**
 * Animates flow dots along EVERY waterway (direction + speed), generalising the
 * single Tha Dee cascade in useFlowAnimation. Same isolation contract: owns its
 * own rAF loop, and the returned `layer` reference is the ONLY thing that
 * changes per frame — the caller appends it in `allLayers` OUTSIDE the big
 * `layers` useMemo so a tick never rebuilds the ~30 other layers.
 *
 * The expensive geometry digest (prepareWaterwayFlows) is done by the caller and
 * passed in as `prepared`; this hook only advances the shared clock. Prepared
 * changes only when the waterway set or gauge state changes, restarting the loop.
 *
 * prefers-reduced-motion: the dots render once as a still frame (direction is
 * still legible from dot spacing along the line) and no loop runs.
 */
const UPDATE_INTERVAL_MS = 100; // ~10 Hz

export function useWaterwayFlow(
  prepared: PreparedFlowLine[],
  visible: boolean,
  zoomBucket: 0 | 1 | 2 = 2,
): {
  layer: ScatterplotLayer<WaterwayFlowDot> | null;
} {
  const [layer, setLayer] = useState<ScatterplotLayer<WaterwayFlowDot> | null>(null);
  const rafRef = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    // LOD: skip the heavy ~4k-dot animation at province/city scale (zoom 0/1).
    // waterwayFlowLayer also returns null when zoomBucket !== 2, but stopping
    // the rAF loop entirely saves the per-frame work too.
    if (!visible || prepared.length === 0 || zoomBucket !== 2) {
      setLayer(null);
      return;
    }
    if (reducedMotion) {
      setLayer(waterwayFlowLayer(waterwayFlowDots(prepared, 0), zoomBucket));
      return;
    }
    const start = performance.now();
    let lastUpdate = 0;
    const tick = (now: number) => {
      if (now - lastUpdate >= UPDATE_INTERVAL_MS) {
        lastUpdate = now;
        setLayer(waterwayFlowLayer(waterwayFlowDots(prepared, now - start), zoomBucket));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [visible, prepared, zoomBucket, reducedMotion]);

  return { layer };
}
