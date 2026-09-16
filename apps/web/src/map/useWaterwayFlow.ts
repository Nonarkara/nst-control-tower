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
  /** The caller passes a pre-thinned trunk set at province/city zoom
   *  (lib/thaDee.ts isTrunkWaterway) and sets this so the LOD gate lifts —
   *  a few hundred dots on the main rivers is the "which way is the water
   *  going" cue the operator asked for; the full ~4k-dot network still waits
   *  for street zoom. */
  overview = false,
): {
  layer: ScatterplotLayer<WaterwayFlowDot> | null;
} {
  const [layer, setLayer] = useState<ScatterplotLayer<WaterwayFlowDot> | null>(null);
  const rafRef = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    // LOD: skip the heavy ~4k-dot animation at province/city scale (zoom 0/1)
    // unless the caller handed us the trunk subset. waterwayFlowLayer applies
    // the same gate, but stopping the rAF loop entirely saves the per-frame
    // work too.
    if (!visible || prepared.length === 0 || (zoomBucket !== 2 && !overview)) {
      setLayer(null);
      return;
    }
    const opts = { overview };
    if (reducedMotion) {
      setLayer(waterwayFlowLayer(waterwayFlowDots(prepared, 0), zoomBucket, opts));
      return;
    }
    const start = performance.now();
    let lastUpdate = 0;
    const tick = (now: number) => {
      if (now - lastUpdate >= UPDATE_INTERVAL_MS) {
        lastUpdate = now;
        setLayer(waterwayFlowLayer(waterwayFlowDots(prepared, now - start), zoomBucket, opts));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [visible, prepared, zoomBucket, reducedMotion, overview]);

  return { layer };
}
