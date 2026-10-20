import type { SourceMeta, WaterGauge, RainfallStation } from "./index.js";

export interface RainWindPoint {
  key: string; nameTh: string; lat: number; lng: number;
  rain6hMm: number | null; rain12hMm: number | null; rain24hMm: number | null;
  peakHourMm: number | null; peakAt: string | null; windFromDeg: number | null; windKmh: number | null;
  hours: { at: string; rainMm: number | null; windFromDeg: number | null; windKmh: number | null }[];
}
export interface FloodRelayContext {
  fetchedAt: string; wetness: { api: number; band: string; asOf: string } | null;
  rainTrend: { ratio: number | null; band: string; series: { day: string; mm: number }[]; asOf: string } | null;
  tmd: { fetchedAt: string | null; days: { date: string; rain_pct: number | null; wind_dir_deg: number | null; wind_kmh: number | null; cond_th: string }[] } | null;
  errors: string[];
}
export interface FloodOperations {
  generatedAt: string;
  gauges: WaterGauge[]; rain: RainfallStation[];
  waterMeta: SourceMeta; rainMeta: SourceMeta;
  weather: RainWindPoint[]; weatherFetchedAt: string | null;
  tide: { peakAt: string; peakMslM: number; hours: { at: string; mslM: number }[] } | null;
  context: FloodRelayContext;
  cameraCounts: { total: number; online: number; unknown: number };
  gaps: string[];
}
