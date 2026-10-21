/**
 * mapFraming — where the map looks when the page first opens.
 *
 * The default camera is City Hall at street zoom, so the gauge that matters
 * (the headline gauge) was often off-screen and a mayor's first map showed
 * grey streets and no water at all. We frame the city AND the worst gauge
 * together, once, and never fight a user who has already touched the map.
 */
import type { WaterGauge } from "@nst/shared";

export interface Framing {
  lng: number;
  lat: number;
  zoom: number;
}

export const MAX_GAUGE_DISTANCE_KM = 25;
const MIN_ZOOM = 10.5;
const MAX_ZOOM = 14;
const PADDING = 1.8;

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const kx = 111.32 * Math.cos((((aLat + bLat) / 2) * Math.PI) / 180);
  return Math.hypot((aLat - bLat) * 110.57, (aLng - bLng) * kx);
}

/** The gauge to show: highest situation level (≥ 4), fullest channel first. */
export function worstGauge(gauges: readonly WaterGauge[]): WaterGauge | null {
  let best: WaterGauge | null = null;
  for (const g of gauges) {
    const level = g.situationLevel ?? 0;
    if (level < 4) continue;
    if (!Number.isFinite(g.lat) || !Number.isFinite(g.lng)) continue;
    const bestLevel = best?.situationLevel ?? 0;
    if (
      !best ||
      level > bestLevel ||
      (level === bestLevel && (g.fullnessPct ?? 0) > (best.fullnessPct ?? 0))
    ) best = g;
  }
  return best;
}

/** Centre between the city and its worst gauge, zoomed to hold both.
 *  null = nothing worth reframing for (no alarming gauge, or one too far away
 *  to be "the city's river"). */
export function frameCityAndWorstGauge(
  gauges: readonly WaterGauge[],
  city: { lng: number; lat: number },
  viewportPx = 900,
): Framing | null {
  const g = worstGauge(gauges);
  if (!g) return null;
  if (distanceKm(city.lat, city.lng, g.lat, g.lng) > MAX_GAUGE_DISTANCE_KM) return null;
  const span = Math.max(Math.abs(g.lng - city.lng), Math.abs(g.lat - city.lat) * 1.5, 0.005) * PADDING;
  const zoom = Math.log2((360 * viewportPx) / (256 * span));
  return {
    lng: (g.lng + city.lng) / 2,
    lat: (g.lat + city.lat) / 2,
    zoom: Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom)) * 10) / 10,
  };
}
