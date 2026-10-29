import type { FloodOperations, NormalizedFeed, RainWindPoint } from "@nst/shared";
import { cachedWithStale } from "../lib/cache.js";
import { fetchJsonOrThrow } from "./common.js";
import { fetchRelay, relaySnapshotMeta, mapRelayWater, mapRelayRain } from "./floodDashRelay.js";
import { fetchNstCctv } from "./cctvNst.js";
import { fetchFloodContext } from "./floodContext.js";

export const RAIN_TRANSECT = [
  { key: "ridge", nameTh: "เขาหลวง–ต้นน้ำท่าดี", lat: 8.52, lng: 99.77 },
  { key: "lan-saka", nameTh: "ลานสกา–คีรีวง", lat: 8.43, lng: 99.81 },
  { key: "city", nameTh: "ตัวเมืองนครศรีธรรมราช", lat: 8.43, lng: 99.96 },
  { key: "coast", nameTh: "ปากนคร–ทางออกทะเล", lat: 8.44, lng: 100.03 },
  { key: "pak-phanang", nameTh: "ลุ่มน้ำปากพนัง (แยกลุ่มน้ำ)", lat: 8.25, lng: 100.12 },
  { key: "klai", nameTh: "คลองกลาย–นบพิตำ (แยกลุ่มน้ำ)", lat: 8.72, lng: 99.82 },
];
interface HourlyWeather {
  hourly?: { time?: number[]; precipitation?: (number | null)[]; wind_speed_10m?: (number | null)[]; wind_direction_10m?: (number | null)[] };
}
const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

/** Keep optional model retries or a stuck shared upstream request from blocking
 * the whole watch page beyond the browser's 25-second cold-request budget. */
export async function withinOperationsDeadline<T>(work: Promise<T>, timeoutMs = 18_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Operational source deadline exceeded")), timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
}

/** Unix timestamps avoid mixing Thai wall time with Worker UTC. Only complete
 * future hours are summed. Missing values never become zero rain. */
export function summarizeRainWind(raw: HourlyWeather, now: number): Omit<RainWindPoint, "key" | "nameTh" | "lat" | "lng"> {
  const h = raw.hourly;
  const hours = (h?.time ?? []).map((t, i) => ({ at: new Date(t * 1000).toISOString(), rainMm: finite(h?.precipitation?.[i]) && h!.precipitation![i]! >= 0 ? h!.precipitation![i] : null, windFromDeg: finite(h?.wind_direction_10m?.[i]) ? h!.wind_direction_10m![i] : null, windKmh: finite(h?.wind_speed_10m?.[i]) ? h!.wind_speed_10m![i] : null })).filter(p => Date.parse(p.at) >= now && Date.parse(p.at) < now + 24 * 3600_000).slice(0, 24);
  const sum = (n: number) => hours.length >= n && hours.slice(0, n).every(p => p.rainMm != null) ? Math.round(hours.slice(0, n).reduce((s, p) => s + p.rainMm!, 0) * 10) / 10 : null;
  const peak = hours.filter(p => p.rainMm != null).sort((a, b) => b.rainMm! - a.rainMm!)[0];
  return { hours, rain6hMm: sum(6), rain12hMm: sum(12), rain24hMm: sum(24), peakHourMm: peak?.rainMm ?? null, peakAt: peak?.at ?? null, windFromDeg: hours[0]?.windFromDeg ?? null, windKmh: hours[0]?.windKmh ?? null };
}

export async function fetchFloodWeather(): Promise<{ points: RainWindPoint[]; fetchedAt: string }> {
  return cachedWithStale("flood-ops-hourly-weather", 600, async () => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${RAIN_TRANSECT.map(p => p.lat).join(",")}&longitude=${RAIN_TRANSECT.map(p => p.lng).join(",")}&hourly=precipitation,wind_speed_10m,wind_direction_10m&forecast_days=3&timeformat=unixtime&timezone=UTC`;
    const result = await fetchJsonOrThrow<HourlyWeather[]>(url, undefined, 12_000);
    if (!Array.isArray(result) || result.length !== RAIN_TRANSECT.length) throw new Error("Incomplete forecast transect");
    return { points: result.map((r, i) => ({ ...RAIN_TRANSECT[i], ...summarizeRainWind(r, Date.now()) })), fetchedAt: new Date().toISOString() };
  }, 1800, true);
}
async function fetchTide(): Promise<FloodOperations["tide"]> {
  return cachedWithStale("flood-ops-tide", 900, async () => {
    const r = await fetchJsonOrThrow<{ hourly?: { time?: number[]; sea_level_height_msl?: (number | null)[] } }>("https://marine-api.open-meteo.com/v1/marine?latitude=8.45&longitude=100.2&hourly=sea_level_height_msl&forecast_days=3&timeformat=unixtime&timezone=UTC", undefined, 12_000);
    const now = Date.now();
    const hours = (r.hourly?.time ?? []).flatMap((t, i) => {
      const v = r.hourly?.sea_level_height_msl?.[i];
      return t * 1000 >= now && t * 1000 < now + 12 * 3600_000 && finite(v) ? [{ at: new Date(t * 1000).toISOString(), mslM: v }] : [];
    });
    if (hours.length < 10) return null;
    const peak = [...hours].sort((a, b) => b.mslM - a.mslM)[0];
    return { hours, peakAt: peak.at, peakMslM: peak.mslM };
  }, 1800, true);
}

/** Critical observations are shared independently of optional context/cameras. */
export async function fetchFloodObservations() {
  const relay = await fetchRelay();
  const { gauges } = mapRelayWater(relay.water);
  const { stations } = mapRelayRain(relay.rain);
  const excludedWater = relay.water.length - gauges.length;
  const excludedRain = relay.rain.length - stations.length;
  const meta = { source: "HII via FloodDash", ...relaySnapshotMeta(relay), note: "Observation times are retained per station; FloodDash relays HII readings" };
  return {
    water: { features: gauges, meta: { ...meta, excludedStationCount: excludedWater, note: excludedWater ? `${meta.note} · ${excludedWater} station(s) excluded; conditions unconfirmed` : meta.note, fallbackTier: gauges.length ? meta.fallbackTier : "unavailable" as const } },
    rain: { features: stations, meta: { ...meta, excludedStationCount: excludedRain, note: excludedRain ? `${meta.note} · ${excludedRain} station(s) excluded; conditions unconfirmed` : meta.note, fallbackTier: stations.length ? meta.fallbackTier : "unavailable" as const } },
  };
}

export async function fetchFloodOperations(): Promise<NormalizedFeed<FloodOperations>> {
  return cachedWithStale("flood-operations", 60, async () => {
    // One existing province relay supplies both observations. HII's direct
    // endpoint is blocked from Worker egress; avoid two failed direct requests
    // followed by duplicate relay reads. Keep initial fan-out within Workers'
    // six outgoing connections (relay + forecast + tide + three context reads).
    const observedWork = withinOperationsDeadline(fetchFloodObservations());
    const weatherWork = withinOperationsDeadline(fetchFloodWeather());
    const tideWork = withinOperationsDeadline(fetchTide());
    const cameraWork = withinOperationsDeadline(Promise.allSettled([observedWork, weatherWork, tideWork]).then(() => fetchNstCctv()));
    const [observations, weather, tide, context, cameras] = await Promise.allSettled([
      observedWork, weatherWork, tideWork, withinOperationsDeadline(fetchFloodContext()), cameraWork,
    ]);
    const unavailable = (source: string) => ({ source, fetchedAt: new Date().toISOString(), ageMinutes: 0, fallbackTier: "unavailable" as const });
    const gaps: string[] = [];
    const result = <T>(r: PromiseSettledResult<T>, name: string): T | null => { if (r.status === "fulfilled") return r.value; gaps.push(name); return null; };
    const observed = result(observations, "HII province relay unavailable");
    const w = observed?.water; const r = observed?.rain;
    const f = result(weather, "Hourly rain/wind model unavailable"); const t = result(tide, "Coastal model unavailable");
    const c = result(context, "FloodDash context unavailable"); const cams = result(cameras, "Municipal camera inventory unavailable")?.features.filter(c => c.category === "water") ?? [];
    if (!w?.features.length) gaps.push("No usable river-gauge observations");
    if (!r?.features.length) gaps.push("No usable rain-gauge observations");
    if (w?.meta.fallbackTier === "cache" || r?.meta.fallbackTier === "cache") gaps.push("HII observations from last-good cache; source refresh pending or unavailable — verify station timestamps");
    if (w?.meta.excludedStationCount) gaps.push(`${w.meta.excludedStationCount} river station(s) excluded; conditions unconfirmed`);
    if (r?.meta.excludedStationCount) gaps.push(`${r.meta.excludedStationCount} rain station(s) excluded; conditions unconfirmed`);
    const now = new Date().toISOString();
    const feature: FloodOperations = { generatedAt: now, gauges: w?.features ?? [], rain: r?.features ?? [], waterMeta: w?.meta ?? unavailable("thaiwater"), rainMeta: r?.meta ?? unavailable("thaiwater"), weather: f?.points ?? [], weatherFetchedAt: f?.fetchedAt ?? null, tide: t, context: c ?? { fetchedAt: now, wetness: null, rainTrend: null, tmd: null, errors: ["FloodDash context unavailable"] }, cameraCounts: { total: cams.length, online: cams.filter(c => c.status === "online").length, unknown: cams.filter(c => c.status !== "online" && c.status !== "offline").length }, gaps: [...gaps, ...(c?.errors ?? [])] };
    return { features: [feature], meta: { source: "HII via FloodDash; TMD via FloodDash; Open-Meteo models", fetchedAt: now, ageMinutes: 0, fallbackTier: "scenario", note: "Operational synthesis, not an official warning or calibrated inundation prediction" } };
  }, 600, true);
}
