import { useEffect, useRef } from "react";
import type { CctvCamera } from "../map/layers";
import {
  analyzeCandidate,
  pickGaugeCandidates,
  postRiseEvent,
  recordSweep,
  type AnalysisOutcome,
} from "../lib/gaugeWatch";

/**
 * useGaugeWatch — the CCTV water-gauge sampler.
 *
 * Every SWEEP_MS (when `enabled`, i.e. a water lens is on screen) it asks
 * pickGaugeCandidates for WL cameras with fresh pooled stills, analyses up
 * to 3, and POSTs `water-rising` events on significant climbs. Everything is
 * bounded and silent: no upstream requests of its own, no UI breakage, no
 * work at night.
 */

const SWEEP_MS = 5 * 60_000;

export function useGaugeWatch(cameras: CctvCamera[], apiBase: string, enabled: boolean): void {
  const argsRef = useRef({ cameras, apiBase, enabled });
  argsRef.current = { cameras, apiBase, enabled };

  useEffect(() => {
    let cancelled = false;
    let running = false;

    const sweep = async () => {
      if (cancelled || running) return;
      const { cameras: cams, apiBase: base, enabled: on } = argsRef.current;
      if (!on || cams.length === 0) return;
      running = true;
      try {
        const cands = pickGaugeCandidates(cams);
        const results: Array<{ outcome: AnalysisOutcome; posted: boolean }> = [];
        for (const c of cands) {
          if (cancelled) break;
          const outcome = await analyzeCandidate(c);
          if (cancelled) break;
          const rising = outcome.status === "read" && outcome.decision.rising;
          if (outcome.status === "read" && outcome.decision.rising) {
            await postRiseEvent(base, c.camera.id, outcome.decision.rise, outcome.decision.confidence);
          }
          results.push({ outcome, posted: rising });
        }
        recordSweep(results);
      } finally {
        running = false;
      }
    };

    const id = window.setInterval(sweep, SWEEP_MS);
    // First sweep shortly after the lens opens (lets the wall capture first).
    const kick = window.setTimeout(sweep, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.clearTimeout(kick);
    };
  }, []);
}
