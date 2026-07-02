import { useEffect, useRef, useState } from "react";
import type { ScatterplotLayer } from "@deck.gl/layers";
import { flowDotPositions, flowDotsLayer } from "./layers";

const DOT_COUNT = 5;
// Throttle React state updates hard — each tick re-renders App (memoized
// children make that shallow, but it isn't free on a phone). At an 8 s lap,
// 10 Hz still moves the dots ~1.2% of the path per step — visually smooth
// for a "low fidelity" cue, and deck.gl interpolates nothing in between
// anyway. rAF also self-suspends in background tabs, so an idle wall
// display costs zero.
const UPDATE_INTERVAL_MS = 100; // ~10fps

// A fixed, fast playback pace chosen purely for legibility — NOT a scaled
// version of the real flood-wave transit time. The actual physical transit
// (channel distance ÷ the 1.5–3.0 m/s celerity band in lib/watershed.ts) is
// on the order of 1.4–2.8 HOURS per the lead-time estimate already shown in
// UpstreamWatershed — playing the dots at anything close to that would look
// completely static on a dashboard glance, which defeats the point of a flow
// cue. This is deliberately a stylised "which way", not a real-time replay;
// the real number lives in the lead-time text, not in this animation's speed.
const CYCLE_MS = 8000;

interface Props {
  visible: boolean;
  /** Flow path in flow order (upstream → city) — see map/layers.ts's thaDeeFlowPath. */
  flowPath: [number, number][];
  /** RGB for the dots — callers pass the cascade's real live status color,
   *  not a new invented signal. */
  color: [number, number, number];
}

interface FlowAnimationResult {
  layer: ScatterplotLayer<[number, number]> | null;
}

/**
 * Animated flow-direction dots along a path — the low-fidelity "which way is
 * the water going" cue (RAMS-x-NYCTA-DNA — created for the Tha Dee cascade).
 * Owns its own requestAnimationFrame loop, isolated from React's render
 * cycle: the returned `layer` only changes at UPDATE_INTERVAL_MS, and only
 * that stable-until-changed reference should sit in the caller's `layers`
 * useMemo dependency array (mirrors how Tile3DLayer's `layer` is threaded)
 * — never a raw per-frame tick value, which would rebuild every other layer
 * in that memo on every animation frame.
 */
export function useFlowAnimation({ visible, flowPath, color }: Props): FlowAnimationResult {
  const [layer, setLayer] = useState<ScatterplotLayer<[number, number]> | null>(null);
  const rafRef = useRef<number | null>(null);

  // Stringify the small path/color so the effect only restarts (and resets
  // the animation clock) when the actual coordinates/color change — not on
  // every parent re-render that happens to construct a new array reference
  // with the same contents (e.g. a poll-driven summaries recompute).
  const pathKey = flowPath.map((p) => `${p[0]},${p[1]}`).join(";");
  const colorKey = color.join(",");

  useEffect(() => {
    if (!visible || flowPath.length < 2) {
      setLayer(null);
      return;
    }

    const start = performance.now();
    let lastUpdate = 0;

    const tick = (now: number) => {
      if (now - lastUpdate >= UPDATE_INTERVAL_MS) {
        lastUpdate = now;
        const t = ((now - start) % CYCLE_MS) / CYCLE_MS;
        setLayer(flowDotsLayer(flowDotPositions(flowPath, t, DOT_COUNT), color));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pathKey/colorKey are the real deps
  }, [visible, pathKey, colorKey]);

  return { layer };
}
