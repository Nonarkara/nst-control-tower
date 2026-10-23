import { isCurrentObservation, type WaterGauge, type RainfallStation, type EwsStation } from "@nst/shared";

/** Provincial observations only. No administrative-area rainfall is routed to
 * the city and no municipal evacuation stage is generated from this summary. */
export function summarizeFloodEvidence(gauges: WaterGauge[], rain: RainfallStation[], ews: EwsStation[], now = Date.now()) {
  const water = gauges.filter(g => isCurrentObservation(g.observedAt, now));
  const rainfall = rain.filter(r => isCurrentObservation(r.observedAt, now) && r.rain24h != null && Number.isFinite(r.rain24h) && r.rain24h >= 0);
  const warnings = ews.filter(e => !e.stale && isCurrentObservation(e.observedAt, now));
  return {
    waterCount: water.length,
    assessedWaterCount: water.filter(g => Number.isFinite(g.situationLevel) || Number.isFinite(g.diffFromBank)).length,
    overbankCount: water.filter(g => (g.situationLevel ?? 0) >= 5 || (g.diffFromBank != null && g.diffFromBank >= 0)).length,
    rainCount: rainfall.length,
    rain24hMax: rainfall.length ? Math.max(...rainfall.map(r => r.rain24h!)) : null,
    warnings: [...warnings].sort((a,b) => b.status - a.status),
  };
}
