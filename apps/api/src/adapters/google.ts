import type { NormalizedFeed, SourceMeta } from "@nst/shared";
import { fetchJsonOrThrow } from "./common.js";

/**
 * Google Maps Platform adapters — server-side only. The key never reaches the
 * browser: routes read it from c.env.GOOGLE_MAPS_API_KEY and these functions
 * proxy the upstream calls. Covers Geocoding, Places (New), Air Quality, and
 * Street View metadata. All return NormalizedFeed so the SOURCES catalog and
 * freshness pills work uniformly.
 */

export interface GoogleOpts {
  GOOGLE_MAPS_API_KEY?: string;
}

export interface GeocodeResult {
  formattedAddress: string;
  lat: number;
  lng: number;
  placeId: string;
  types: string[];
}

export interface GooglePlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  rating: number | null;
  userRatingCount: number | null;
}

export interface GoogleAqReading {
  code: string;
  displayName: string;
  aqi: number | null;
  category: string;
  dominantPollutant: string;
}

export interface StreetViewMeta {
  available: boolean;
  lat: number | null;
  lng: number | null;
  date: string | null;
}

const NOW = (): string => new Date().toISOString();

function liveMeta(source: string): SourceMeta {
  return { source, fetchedAt: NOW(), ageMinutes: 0, fallbackTier: "live" };
}

function unavailable<T>(source: string, note: string): NormalizedFeed<T> {
  return {
    features: [],
    meta: { source, fetchedAt: NOW(), ageMinutes: 0, fallbackTier: "unavailable", note },
  };
}

const MISSING_KEY = "GOOGLE_MAPS_API_KEY not set — Google Maps Platform features disabled.";

// ── Geocoding ────────────────────────────────────────────────────────────────
interface GeocodeApiResponse {
  status?: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
    place_id?: string;
    types?: string[];
  }>;
}

export async function fetchGoogleGeocode(
  query: string,
  opts: GoogleOpts,
): Promise<NormalizedFeed<GeocodeResult>> {
  const source = "google.geocoding";
  if (!opts.GOOGLE_MAPS_API_KEY) return unavailable(source, MISSING_KEY);
  if (!query.trim()) return unavailable(source, "Empty geocode query.");

  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}` +
    `&region=th&language=en&key=${opts.GOOGLE_MAPS_API_KEY}`;
  const payload = await fetchJsonOrThrow<GeocodeApiResponse>(url);

  if (!payload || (payload.status && payload.status !== "OK")) {
    return unavailable(source, `Geocoding ${payload?.status ?? "unreachable"}${payload?.error_message ? ": " + payload.error_message : ""}`);
  }

  const features: GeocodeResult[] = (payload.results ?? [])
    .filter((r) => r.geometry?.location?.lat != null && r.geometry?.location?.lng != null)
    .map((r) => ({
      formattedAddress: r.formatted_address ?? "",
      lat: r.geometry!.location!.lat!,
      lng: r.geometry!.location!.lng!,
      placeId: r.place_id ?? "",
      types: r.types ?? [],
    }));

  return { features, meta: liveMeta(source) };
}

// ── Places (New) text search ───────────────────────────────────────────────────
interface PlacesApiResponse {
  error?: { message?: string };
  places?: Array<{
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    types?: string[];
    rating?: number;
    userRatingCount?: number;
  }>;
}

export async function fetchGooglePlaces(
  query: string,
  opts: GoogleOpts,
): Promise<NormalizedFeed<GooglePlace>> {
  const source = "google.places";
  if (!opts.GOOGLE_MAPS_API_KEY) return unavailable(source, MISSING_KEY);
  if (!query.trim()) return unavailable(source, "Empty places query.");

  const payload = await fetchJsonOrThrow<PlacesApiResponse>(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": opts.GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount",
      },
      body: JSON.stringify({ textQuery: query, languageCode: "en", regionCode: "TH" }),
    },
  );

  if (!payload || payload.error) {
    return unavailable(source, `Places ${payload?.error?.message ?? "unreachable"}`);
  }

  const features: GooglePlace[] = (payload.places ?? [])
    .filter((p) => p.location?.latitude != null && p.location?.longitude != null)
    .map((p) => ({
      name: p.displayName?.text ?? "",
      address: p.formattedAddress ?? "",
      lat: p.location!.latitude!,
      lng: p.location!.longitude!,
      types: p.types ?? [],
      rating: p.rating ?? null,
      userRatingCount: p.userRatingCount ?? null,
    }));

  return { features, meta: liveMeta(source) };
}

// ── Air Quality ────────────────────────────────────────────────────────────────
interface AqApiResponse {
  error?: { message?: string };
  indexes?: Array<{
    code?: string;
    displayName?: string;
    aqi?: number;
    category?: string;
    dominantPollutant?: string;
  }>;
}

export async function fetchGoogleAirQuality(
  lat: number,
  lng: number,
  opts: GoogleOpts,
): Promise<NormalizedFeed<GoogleAqReading>> {
  const source = "google.air-quality";
  if (!opts.GOOGLE_MAPS_API_KEY) return unavailable(source, MISSING_KEY);

  const payload = await fetchJsonOrThrow<AqApiResponse>(
    `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${opts.GOOGLE_MAPS_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: { latitude: lat, longitude: lng },
        extraComputations: ["LOCAL_AQI", "DOMINANT_POLLUTANT_CONCENTRATION"],
        languageCode: "en",
      }),
    },
  );

  if (!payload || payload.error) {
    return unavailable(source, `Air Quality ${payload?.error?.message ?? "unreachable"}`);
  }

  const features: GoogleAqReading[] = (payload.indexes ?? []).map((i) => ({
    code: i.code ?? "",
    displayName: i.displayName ?? "",
    aqi: i.aqi ?? null,
    category: i.category ?? "",
    dominantPollutant: i.dominantPollutant ?? "",
  }));

  return { features, meta: liveMeta(source) };
}

// ── Street View metadata (free; tells us whether a pano exists) ──────────────────
interface SvMetaApiResponse {
  status?: string;
  date?: string;
  location?: { lat?: number; lng?: number };
}

export async function fetchStreetViewMeta(
  lat: number,
  lng: number,
  opts: GoogleOpts,
): Promise<NormalizedFeed<StreetViewMeta>> {
  const source = "google.streetview";
  if (!opts.GOOGLE_MAPS_API_KEY) return unavailable(source, MISSING_KEY);

  const url =
    `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}` +
    `&key=${opts.GOOGLE_MAPS_API_KEY}`;
  const payload = await fetchJsonOrThrow<SvMetaApiResponse>(url);

  if (!payload) return unavailable(source, "Street View metadata unreachable.");

  const available = payload.status === "OK";
  return {
    features: [
      {
        available,
        lat: payload.location?.lat ?? null,
        lng: payload.location?.lng ?? null,
        date: payload.date ?? null,
      },
    ],
    meta: liveMeta(source),
  };
}

/**
 * Build the upstream Street View Static image URL. Used by the image-proxy
 * route so the key stays server-side — the browser only ever sees /api/streetview.
 */
export function streetViewImageUrl(
  params: { lat: number; lng: number; heading?: number; pitch?: number; fov?: number; size?: string },
  key: string,
): string {
  const size = params.size ?? "640x400";
  const heading = params.heading ?? 0;
  const pitch = params.pitch ?? 0;
  const fov = params.fov ?? 90;
  return (
    `https://maps.googleapis.com/maps/api/streetview?size=${size}` +
    `&location=${params.lat},${params.lng}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${key}`
  );
}
