import { useEffect, useRef, useState } from "react";
import type { ScatterplotLayer } from "@deck.gl/layers";
import { waterwayFlowDots, waterwayFlowLayer, type PreparedFlowLine, type WaterwayFlowDot } from "./layers";

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
 */
const UPDATE_INTERVAL_MS = 100; // ~10 Hz

export function useWaterwayFlow(prepared: PreparedFlowLine[], visible: boolean): {
  layer: ScatterplotLayer<WaterwayFlowDot> | null;
} {
  const [layer, setLayer] = useState<ScatterplotLayer<WaterwayFlowDot> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!visible || prepared.length === 0) {
      setLayer(null);
      return;
    }
    const start = performance.now();
    let lastUpdate = 0;
    const tick = (now: number) => {
      if (now - lastUpdate >= UPDATE_INTERVAL_MS) {
        lastUpdate = now;
        setLayer(waterwayFlowLayer(waterwayFlowDots(prepared, now - start)));
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
