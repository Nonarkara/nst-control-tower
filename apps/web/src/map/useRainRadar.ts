import { useEffect, useRef, useState } from "react";
import type { TileLayer } from "@deck.gl/geo-layers";
import { rainviewerRadarLayer } from "./layers";

/**
 * RainViewer live radar nowcast — the animated third precipitation layer
 * (beside GIBS IMERG rain-rate + Himawari storm clouds). Fetches the public
 * frame manifest (past + forecast frames), then walks them at ~1.1 s/frame.
 *
 * Like useFlowAnimation, the returned `layer` reference is the ONLY thing that
 * changes per frame — the caller appends it in `allLayers` OUTSIDE the big
 * `layers` useMemo so a radar tick never rebuilds the ~30 other layers.
 * Self-suspends when not visible; the manifest refreshes every 5 min.
 */

const MANIFEST_URL = "https://api.rainviewer.com/public/weather-maps.json";
const FRAME_MS = 1100; // RainViewer's own loop pace
const MANIFEST_REFRESH_MS = 5 * 60_000;
const PAST_FRAMES = 7; // last 7 past + all nowcast, per FloodDash

interface Frame {
  time: number;
  urlTemplate: string;
}

interface Result {
  layer: TileLayer | null;
  frameTime: number | null; // epoch seconds of the shown frame
  frameIsForecast: boolean;
}

export function useRainRadar(visible: boolean): Result {
  const [layer, setLayer] = useState<TileLayer | null>(null);
  const [frameTime, setFrameTime] = useState<number | null>(null);
  const [frameIsForecast, setForecast] = useState(false);
  const framesRef = useRef<Frame[]>([]);
  const nowcastStartRef = useRef<number>(Infinity);
  const idxRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  // Fetch + periodically refresh the manifest.
  useEffect(() => {
    if (!visible) {
      setLayer(null);
      framesRef.current = [];
      return;
    }
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(MANIFEST_URL, { signal: AbortSignal.timeout(15_000) });
        if (!res.ok) return;
        const j = (await res.json()) as {
          host: string;
          radar?: { past?: { time: number; path: string }[]; nowcast?: { time: number; path: string }[] };
        };
        if (!alive) return;
        const past = (j.radar?.past ?? []).slice(-PAST_FRAMES);
        const nowcast = j.radar?.nowcast ?? [];
        nowcastStartRef.current = nowcast[0]?.time ?? Infinity;
        framesRef.current = [...past, ...nowcast].map((f) => ({
          time: f.time,
          // size 256, color scheme 2 (universal blue→red), smooth+snow (1_1)
          urlTemplate: `${j.host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`,
        }));
        if (idxRef.current >= framesRef.current.length) idxRef.current = 0;
      } catch {
        /* transient — keep last frames, retry on next refresh */
      }
    };
    load();
    const refresh = window.setInterval(load, MANIFEST_REFRESH_MS);
    return () => {
      alive = false;
      window.clearInterval(refresh);
    };
  }, [visible]);

  // Advance frames.
  useEffect(() => {
    if (!visible) return;
    const tick = () => {
      const frames = framesRef.current;
      if (frames.length > 0) {
        const i = idxRef.current % frames.length;
        const frame = frames[i];
        setLayer(rainviewerRadarLayer(frame.urlTemplate));
        setFrameTime(frame.time);
        setForecast(frame.time >= nowcastStartRef.current);
        idxRef.current = (i + 1) % frames.length;
      }
      timerRef.current = window.setTimeout(tick, FRAME_MS);
    };
    timerRef.current = window.setTimeout(tick, FRAME_MS);
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [visible]);

  return { layer, frameTime, frameIsForecast };
}
