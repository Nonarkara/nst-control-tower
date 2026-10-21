import { useEffect, useRef } from "react";
import { requestFrames, getCachedFrame } from "../lib/cctvCapturePool";
import { analyzeHaze, isDaylightICT, pickEyesTargets, recordHazeSweep, type HazeOutcome } from "../lib/cameraEyes";
import type { CctvCamera } from "../map/layers";
import {
  analyzeCandidate,
  pickGaugeCandidates,
  recordLocalRiseEvent,
  recordSweep,
  type AnalysisOutcome,
} from "../lib/gaugeWatch";

/**
 * useGaugeWatch — the CCTV water-gauge sampler.
 *
 * Every SWEEP_MS (when `enabled`, i.e. a water lens is on screen) it asks
 * pickGaugeCandidates for WL cameras with fresh pooled stills, analyses up
 * to 3, and records local `water-rising` previews on significant climbs. Everything is
 * bounded and silent: no upstream requests of its own, no UI breakage, no
 * work at night.
 */

const SWEEP_MS = 10 * 60_000;
// Ask for stills ourselves — a mayor who never opens the camera wall must still
// get the cameras' reading. Bounded: a handful of cameras, once per sweep.
const FRAME_WAIT_MS = 45_000;

export function useGaugeWatch(cameras: CctvCamera[], _apiBase: string, enabled: boolean): void {
  const argsRef = useRef({ cameras, enabled });
  argsRef.current = { cameras, enabled };

  useEffect(() => {
    let cancelled = false;
    let running = false;
    let sweepNo = 0;

    const sweep = async () => {
      if (cancelled || running) return;
      const { cameras: cams, enabled: on } = argsRef.current;
      if (!on || cams.length === 0) return;
      if (typeof document !== "undefined" && document.hidden) return;
      if (!isDaylightICT()) return; // both readers are meaningless on night/IR frames
      running = true;
      try {
        const targets = pickEyesTargets(cams, sweepNo++);
        await requestFrames(targets.map((t) => ({ id: t.camera.id, whepUrl: t.whepUrl })), FRAME_WAIT_MS);
        if (cancelled) return;

        // Haze: every camera we managed to image.
        const hazeOutcomes: HazeOutcome[] = [];
        for (const t of targets) {
          const frame = getCachedFrame(t.camera.id);
          if (!frame) continue;
          hazeOutcomes.push(await analyzeHaze(t.camera, frame.dataUrl));
        }
        recordHazeSweep(hazeOutcomes);

        const cands = pickGaugeCandidates(cams);
        const results: Array<{ outcome: AnalysisOutcome; previewed: boolean }> = [];
        for (const c of cands) {
          if (cancelled) break;
          const outcome = await analyzeCandidate(c);
          if (cancelled) break;
          // Preview on the EVENT (first crossing / further climb), not on the
          // state — steady high water must not re-alert every 5 minutes.
          const alert = outcome.status === "read" && outcome.decision.shouldAlert;
          if (alert) {
            recordLocalRiseEvent(c.camera.id, outcome.decision.confidence);
          }
          results.push({ outcome, previewed: alert });
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
