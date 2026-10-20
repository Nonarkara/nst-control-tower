/** Reuses FloodDash's existing HII antecedent index, rain trend and official TMD
 * relay. Read-only; no extra historical scans and no duplicated ingestion. */
import type { FloodRelayContext } from "@nst/shared";
import { cachedWithStale } from "../lib/cache.js";
import { fetchJsonOrThrow } from "./common.js";

interface Wetness { updated?: string; provinces?: { province_code: string; api: number; band: string }[] }
interface Trend { generated_at?: string; provinces?: { province_code: string; ratio: number | null; band: string; series: { day: string; mm: number }[] }[] }
interface Weather { weather?: { forecast?: { fetched_at?: string; days?: NonNullable<FloodRelayContext["tmd"]>["days"] } } }

export async function fetchFloodContext(): Promise<FloodRelayContext> {
  return cachedWithStale("flood-operations-context", 300, async () => {
    const base = "https://flood.nonarkara.org";
    const [wet, trend, weather] = await Promise.allSettled([
      fetchJsonOrThrow<Wetness>(`${base}/api/wetness`, undefined, 10_000),
      fetchJsonOrThrow<Trend>(`${base}/api/rain/trend`, undefined, 10_000),
      fetchJsonOrThrow<Weather>(`${base}/api/weather/at?lat=8.43&lng=99.96`, undefined, 10_000),
    ]);
    const w = wet.status === "fulfilled" ? wet.value.provinces?.find(p => String(p.province_code) === "80") : null;
    const r = trend.status === "fulfilled" ? trend.value.provinces?.find(p => String(p.province_code) === "80") : null;
    const t = weather.status === "fulfilled" ? weather.value.weather?.forecast : null;
    return {
      fetchedAt: new Date().toISOString(),
      wetness: w && Number.isFinite(w.api) && wet.status === "fulfilled" && wet.value.updated ? { api: w.api, band: w.band, asOf: wet.value.updated } : null,
      rainTrend: r && trend.status === "fulfilled" && trend.value.generated_at ? { ratio: r.ratio, band: r.band, series: r.series, asOf: trend.value.generated_at } : null,
      tmd: t?.days?.length ? { fetchedAt: t.fetched_at ?? null, days: t.days } : null,
      errors: [wet.status === "rejected" ? "FloodDash antecedent index unavailable" : "", trend.status === "rejected" ? "FloodDash rain history unavailable" : "", weather.status === "rejected" ? "TMD relay unavailable" : ""].filter(Boolean),
    };
  }, 1800, true);
}
