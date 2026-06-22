/**
 * AirLabs flights adapter — arrivals + departures for NST (VTSF).
 *
 * Endpoint: https://airlabs.co/api/v9/schedules
 * Auth: AIRLABS_API_KEY env var. Without a key the feed degrades gracefully
 *       with a note explaining how to enable it.
 *
 * Free tier: 1,000 req/month. We fetch arr + dep in one cache cycle (2 HTTP
 * calls) with a 90-min TTL → ~32 cycles/day × 2 = ~64 calls/day × 30 = ~960
 * requests/month, safely within the free limit.
 *
 * NST airport: IATA NST · ICAO VTSF · Nakhon Si Thammarat
 * Primary routes: FD (Thai AirAsia) DMK↔NST · DD (Nok Air) DMK↔NST
 */

import type { NormalizedFeed, FlightFids } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { fetchJsonOrThrow } from "./common.js";

const BASE = "https://airlabs.co/api/v9/schedules";
const NST_IATA = "NST";
const TTL = 90 * 60; // 90 minutes keeps us within the 1,000 req/month free tier

// ---- Static lookups ----

const AIRLINE_NAMES: Record<string, string> = {
  FD: "Thai AirAsia",
  DD: "Nok Air",
  SL: "Thai Lion Air",
  TG: "Thai Airways",
  BKP: "Bangkok Airways",
  PG: "Bangkok Airways",
  WE: "Thai Smile",
  IQ: "Indigo (Thailand)",
};

const AIRPORT_NAMES: Record<string, string> = {
  DMK: "Bangkok (Don Mueang)",
  BKK: "Bangkok (Suvarnabhumi)",
  HKT: "Phuket",
  CNX: "Chiang Mai",
  USM: "Koh Samui",
  CEI: "Chiang Rai",
  HDY: "Hat Yai",
  URT: "Surat Thani",
  KBV: "Krabi",
  NST: "Nakhon Si Thammarat",
};

// ---- AirLabs response shape ----

interface AirLabsEntry {
  flight_iata?: string;
  flight_number?: string;
  airline_iata?: string;
  dep_iata?: string;
  arr_iata?: string;
  dep_time?: string;
  dep_estimated?: string | null;
  dep_actual?: string | null;
  dep_delayed?: number | null;
  arr_time?: string;
  arr_estimated?: string | null;
  arr_actual?: string | null;
  arr_delayed?: number | null;
  status?: string;
  duration?: number | null;
  arr_terminal?: string | null;
  dep_terminal?: string | null;
  arr_gate?: string | null;
  dep_gate?: string | null;
  arr_baggage?: string | null;
}

interface AirLabsResponse {
  response?: AirLabsEntry[];
  error?: { code: string; message: string };
}

// ---- Mappers ----

function toStatus(raw: string | undefined): FlightFids["status"] {
  switch (raw) {
    case "scheduled": return "scheduled";
    case "active":    return "active";
    case "landed":    return "landed";
    case "cancelled": return "cancelled";
    default:          return "unknown";
  }
}

function toLocalIso(localStr: string | null | undefined): string | null {
  if (!localStr) return null;
  // AirLabs returns "YYYY-MM-DD HH:mm" local Thai time — convert to ISO with +07:00
  return localStr.replace(" ", "T") + ":00+07:00";
}

function mapEntry(e: AirLabsEntry, direction: FlightFids["direction"]): FlightFids {
  const isDep = direction === "departure";
  return {
    flightNumber: e.flight_iata ?? e.flight_number ?? "—",
    airlineIata:  e.airline_iata ?? "—",
    airlineName:  AIRLINE_NAMES[e.airline_iata ?? ""] ?? e.airline_iata ?? "—",
    otherIata:    isDep ? (e.arr_iata ?? "—") : (e.dep_iata ?? "—"),
    otherName:    AIRPORT_NAMES[isDep ? (e.arr_iata ?? "") : (e.dep_iata ?? "")] ?? (isDep ? e.arr_iata : e.dep_iata) ?? "—",
    direction,
    scheduledTime:  toLocalIso(isDep ? e.dep_time : e.arr_time) ?? new Date().toISOString(),
    estimatedTime:  toLocalIso(isDep ? e.dep_estimated : e.arr_estimated),
    actualTime:     toLocalIso(isDep ? e.dep_actual : e.arr_actual),
    delayMinutes:   (isDep ? e.dep_delayed : e.arr_delayed) ?? null,
    status:         toStatus(e.status),
    terminal:       isDep ? (e.dep_terminal ?? null) : (e.arr_terminal ?? null),
    gate:           isDep ? (e.dep_gate ?? null) : (e.arr_gate ?? null),
    baggage:        direction === "arrival" ? (e.arr_baggage ?? null) : null,
    durationMin:    e.duration ?? null,
  };
}

// ---- Main fetch ----

export async function fetchFlights(env: { AIRLABS_API_KEY?: string }): Promise<NormalizedFeed<FlightFids>> {
  return cached("flights-nst", TTL, async () => {
    const fetchedAt = new Date().toISOString();

    if (!env.AIRLABS_API_KEY) {
      return {
        features: [],
        meta: {
          source: "airlabs-fids",
          fetchedAt,
          ageMinutes: 0,
          fallbackTier: "unavailable",
          note: "Missing AIRLABS_API_KEY env var — register free at airlabs.co (1,000 req/month)",
        },
      };
    }

    const key = env.AIRLABS_API_KEY;

    const [arrResp, depResp] = await Promise.allSettled([
      fetchJsonOrThrow<AirLabsResponse>(`${BASE}?arr_iata=${NST_IATA}&api_key=${key}`),
      fetchJsonOrThrow<AirLabsResponse>(`${BASE}?dep_iata=${NST_IATA}&api_key=${key}`),
    ]);

    // Surface API-level errors
    const firstResp = arrResp.status === "fulfilled" ? arrResp.value : null;
    if (firstResp?.error) {
      return {
        features: [],
        meta: {
          source: "airlabs-fids",
          fetchedAt,
          ageMinutes: 0,
          fallbackTier: "unavailable",
          note: `AirLabs error ${firstResp.error.code}: ${firstResp.error.message}`,
        },
      };
    }

    const arrivals:   AirLabsEntry[] = arrResp.status === "fulfilled" ? (arrResp.value?.response ?? []) : [];
    const departures: AirLabsEntry[] = depResp.status === "fulfilled" ? (depResp.value?.response ?? []) : [];

    const features: FlightFids[] = [
      ...arrivals.map((e) => mapEntry(e, "arrival")),
      ...departures.map((e) => mapEntry(e, "departure")),
    ];

    // Sort chronologically by scheduled time
    features.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    return {
      features,
      meta: {
        source: "airlabs-fids",
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: features.length > 0 ? "live" : "unavailable",
        ...(features.length === 0 ? { note: "AirLabs returned no flights for NST today" } : {}),
      },
    };
  });
}
