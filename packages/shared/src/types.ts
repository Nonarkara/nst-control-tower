import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson";

export type Coordinates = [number, number];
export type LatLng = [number, number];

export type Locale = "en" | "th" | "zh";

export type FallbackTier =
  | "live"
  | "database"
  | "cache"
  | "scenario"
  | "reference"
  | "unavailable";

export interface SourceMeta {
  source: string;
  fetchedAt: string;
  ageMinutes: number;
  fallbackTier: FallbackTier;
  /**
   * Human-readable reason set when `fallbackTier` is "unavailable" or "scenario" —
   * surfaced by `/api/health/detailed` and shown inline in the SOURCES catalog so
   * operators can distinguish missing API keys from upstream outages.
   * Example: "Missing GEMINI_API_KEY env var — adapter disabled".
   */
  note?: string;
}

export interface NormalizedFeed<T> {
  features: T[];
  meta: SourceMeta;
}

// ---- Incidents ----

export type IncidentCategory =
  | "traffic-accident"
  | "traffic-congestion"
  | "construction"
  | "flooding"
  | "waste"
  | "lighting"
  | "sidewalk"
  | "drainage"
  | "trees"
  | "other";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentStatus =
  | "received"
  | "assigned"
  | "in-progress"
  | "resolved";

export interface IncidentFeature {
  id: string;
  ticketNumber?: string;
  lat: number;
  lng: number;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description?: string;
  reportedAt: string;
  resolvedAt?: string;
  imageUrl?: string;
  /** Public URL of the original report, so an operator can click an incident
   *  and jump to where it was reported (e.g. the Traffy Fondue ticket page) to
   *  go fix it. Omitted when the source exposes no public permalink. */
  sourceUrl?: string;
  reporterPlatform: "traffy" | "city-reporter" | "itic" | "internal";
  zoneId?: string;
  raw?: Record<string, unknown>;
}

// ---- Traffic ----

export interface TrafficSample {
  lat: number;
  lng: number;
  intensity: number;
  roadClass: "arterial" | "collector" | "local" | "campus-internal";
}

export interface TrafficCorridor {
  id: string;
  name: string;
  segments: Coordinates[];
  roadClass: TrafficSample["roadClass"];
}

// ---- Environment ----

export interface AirQualityPoint {
  lat: number;
  lng: number;
  station: string;
  aqi: number | null;
  pm25: number | null;
  category: "good" | "moderate" | "unhealthy-sg" | "unhealthy" | "very-unhealthy" | "hazardous" | null;
  observedAt: string;
  source: string;
}

export interface WeatherSnapshot {
  tempC: number | null;
  feelsLikeC: number | null;
  humidity: number | null;
  windKmh: number | null;
  precipMm: number | null;
  condition: string;
  observedAt: string;
}

export interface PrecipNowcast {
  /** mm in the current 15-min interval (≈ rate at observation time). */
  nowMm: number;
  /** Cumulative mm forecast across the next 2 hours. */
  total2hMm: number;
  /** Max single-interval mm in the next 2 hours. */
  peakMm: number;
  /** ISO timestamp of the peak interval, or null if dry. */
  peakAt: string | null;
  /** ISO timestamp of the first interval with ≥ 0.5 mm, or null if none. */
  firstSignificantAt: string | null;
  /** Minutes from now to the first significant interval (multiple of 15), or null. */
  minutesToSignificant: number | null;
  /** Coarse bucket for UI colouring. */
  intensity: "dry" | "light" | "moderate" | "heavy";
  /** Per-15-min forecast points covering the next ~2 hours. */
  points: Array<{ at: string; mm: number; prob: number }>;
}

/** A PrecipNowcast for one upstream watershed zone — see WATERSHED_FORECAST_POINTS. */
export interface ZonePrecipNowcast extends PrecipNowcast {
  zoneKey: string;
}

/** One forecast day of WRF-ROMS 24-h rain, averaged over the NST windows
 *  (HII model, ~3 km grid, tiservice.hii.or.th/opendata/wrf-roms). */
export interface WrfRainDay {
  /** 1–3 = today-ish..+2 (the run's day1/day2/day3 file). */
  day: 1 | 2 | 3;
  /** Model run id, e.g. "2026-07-01_12UTC" — publication can lag by days;
   *  the UI derives and DISPLAYS the run's age from this so an old run is
   *  never mistaken for a fresh 3-day outlook. */
  runId: string;
  /** ISO date the 24-h total is valid for (run date + day − 1, UTC+7 framing). */
  validDate: string;
  /** Khao Luang–Tha Dee upstream catchment box. */
  catchmentMeanMm: number;
  catchmentMaxMm: number;
  /** City + coastal lowland box. */
  cityMeanMm: number;
  cityMaxMm: number;
}

/** Compact province sub-grid of one WRF-ROMS forecast day, for map rendering.
 *  Row-major from the NORTH-WEST corner (values[r*ncols+c]); cell centres at
 *  (lngMin + (c+0.5)·cellDeg, latMax − (r+0.5)·cellDeg). */
export interface WrfRainGrid {
  day: 1 | 2 | 3;
  validDate: string;
  lngMin: number;
  latMax: number;
  cellDeg: number;
  ncols: number;
  nrows: number;
  /** 24-h rain per cell (mm); −1 = model NODATA. */
  valuesMm: number[];
}

export interface AcademicPhase {
  /** ISO date when this phase starts. */
  start: string;
  /** ISO date when this phase ends. */
  end: string;
  /** Stable id — used by the UI for icon/colour mapping. */
  id:
    | "semester-1"
    | "semester-1-finals"
    | "semester-2"
    | "semester-2-finals"
    | "summer-term"
    | "break"
    | "freshy-week"
    | "graduation"
    | "holiday";
  /** Short human label, EN. */
  label: string;
  /** One-sentence description of operational impact ("expect higher campus traffic" etc.). */
  describe: string;
}

export interface AcademicSnapshot {
  current: AcademicPhase | null;
  next: AcademicPhase | null;
  /** Days from today (UTC) to `next.start`. Negative if `current` is the next event itself. */
  daysToNext: number | null;
  /** Convenience: campus operational tempo derived from current phase. */
  tempo: "low" | "normal" | "high" | "peak";
}

// ---- News / Vibes ----

export type IntelligenceKind =
  | "news"
  | "social"
  | "incident"
  | "weather"
  | "movement";

export interface IntelligenceItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  tags: string[];
  score: number;
  kind: IntelligenceKind;
  imageUrl?: string;
  /** Geocoded latitude when a known place is mentioned in the story */
  lat: number | null;
  /** Geocoded longitude when a known place is mentioned in the story */
  lng: number | null;
  /** Name of the matched place (e.g. "Talat Chonburi") */
  placeName: string | null;
}

// ---- Deep South security (conflict incidents) ----

export type ConflictEventType =
  | "armed-clash"
  | "bombing-ied"
  | "shooting"
  | "arson"
  | "raid-arrest"
  | "abduction"
  | "remote-violence"
  | "other";

/**
 * A geocoded violent-conflict event in the Deep South. Sourced primarily from
 * ACLED (the machine-readable proxy for the Deep South Incident Database / DSW),
 * scoped to admin1 = Yala (+ Pattani / Narathiwat for regional context).
 */
export interface ConflictIncident {
  id: string;
  lat: number;
  lng: number;
  eventType: ConflictEventType;
  /** Free-text actors involved, as reported. */
  actors: string;
  fatalities: number;
  /** ISO date of the event. */
  date: string;
  province: "Yala" | "Pattani" | "Narathiwat" | "Songkhla" | string;
  district?: string;
  notes: string;
  source: string;
  sourceUrl?: string;
}

/** Martial-law / Emergency-Decree legal status banner (verify quarterly). */
export interface SecurityStatus {
  martialLaw: boolean;
  emergencyDecree: boolean;
  /** Human label, e.g. "Martial Law + Emergency Decree active in most districts". */
  label: string;
  /** ISO date this status was last verified against the Royal Gazette / press. */
  verifiedAt: string;
  note: string;
}

// ---- Flood / hydrology ----

/** River / canal gauge reading for flood monitoring (Pattani River etc.). */
export interface FloodGauge {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** Water level in metres above datum, or null if unavailable. */
  levelM: number | null;
  /** Bank-full / warning threshold in metres, if known. */
  warningM: number | null;
  status: "normal" | "watch" | "warning" | "flood" | "unknown";
  observedAt: string;
  source: string;
}

/** Dam / reservoir status (Bang Lang Dam sits upstream of Yala city). */
export interface DamStatus {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** Current storage as % of capacity, or null. */
  storagePct: number | null;
  /** Outflow (m³/s) if reported — rising outflow precedes downstream flooding. */
  outflowCms: number | null;
  status: "low" | "normal" | "high" | "spilling" | "unknown";
  observedAt: string;
  source: string;
}

/**
 * Real telemetry gauge from HII ThaiWater (api-v3.thaiwater.net).
 * 26 stations in NST province, updating every ~10 minutes.
 * situation_level: 1=drought, 2=low, 3=normal, 4=high, 5=overbank/flood
 */
export interface WaterGauge {
  id: string;
  name: string;
  lat: number;
  lng: number;
  levelMsl: number | null;
  levelPrev: number | null;
  warningMsl: number | null;
  criticalMsl: number | null;
  /** Metres above bank (positive = overbank/flooding) or below bank (negative = freeboard). */
  diffFromBank: number | null;
  /** 1=critical drought · 2=low · 3=normal · 4=high · 5=overbank/flood */
  situationLevel: 1 | 2 | 3 | 4 | 5;
  trend: "rising" | "falling" | "stable";
  riverName: string;
  amphoe: string;
  observedAt: string;
  isKeyStation: boolean;
}

/** 24h/1h rainfall telemetry from HII ThaiWater (130 stations in NST province). */
export interface RainfallStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rain1h: number | null;
  rain24h: number | null;
  amphoe: string;
  observedAt: string;
}

/**
 * DWR Early Warning System station (ews.dwr.go.th) — community flash-flood
 * & landslide telemetry, concentrated in upland/headwater areas. Carries an
 * official 0-3 alert status and soil-moisture (a flash-flood precursor the
 * gauge networks lack).
 */
export interface EwsStation {
  id: string;            // station code, e.g. "STN0079"
  name: string;
  lat: number;
  lng: number;
  /** RF = rainfall/soil station, WL = water-level station. */
  type: "rain" | "water" | "unknown";
  tambon: string;
  amphoe: string;
  basin: string;
  /** 0 = normal · 1 = watch (เฝ้าระวัง) · 2 = prepare (เตรียมพร้อม) · 3 = critical (วิกฤติ). */
  status: 0 | 1 | 2 | 3;
  /** Current rainfall (mm). */
  rain: number | null;
  /** Rainfall last 12 hours (mm). */
  rain12h: number | null;
  /** Rainfall since 07:00 today (mm). */
  rain07h: number | null;
  /** Water level (m), or null for rainfall-only stations. */
  waterLevel: number | null;
  /** Soil moisture (%) — saturation primes flash floods. */
  soilMoisture: number | null;
  /** Soil moisture at 07:00 today (%), for trend. */
  soil07h: number | null;
  /** Station alert thresholds, where reported. */
  alertMin: number | null;
  alertMax: number | null;
  /** Warning text (null if none). */
  warn: string | null;
  observedAt: string;
}

/** Reservoir snapshot from RID (Royal Irrigation Department) public API. */
export interface RidReservoir {
  id: string;
  name: string;
  storageMcm: number | null;
  volumeMcm: number | null;
  storagePct: number | null;
  inflowMcm: number | null;
  outflowMcm: number | null;
  observedAt: string;
}

// ---- Flights FIDS ----

/** Arrival or departure entry from AirLabs /schedules for NST airport. */
export interface FlightFids {
  flightNumber: string;
  airlineIata: string;
  airlineName: string;
  otherIata: string;
  otherName: string;
  direction: "arrival" | "departure";
  scheduledTime: string;
  estimatedTime: string | null;
  actualTime: string | null;
  delayMinutes: number | null;
  status: "scheduled" | "active" | "landed" | "cancelled" | "unknown";
  terminal: string | null;
  gate: string | null;
  baggage: string | null;
  durationMin: number | null;
}

// ---- Campus GeoJSON ----

export interface CampusZoneProperties {
  zoneId: string;
  name: { en: string; th: string; zh: string };
  zoneType:
    | "academic"
    | "residential"
    | "athletic"
    | "park"
    | "commercial"
    | "service"
    | "perimeter";
  color?: string;
  height?: number | null;
}

export type CampusZoneFeature = Feature<Polygon | MultiPolygon, CampusZoneProperties>;
export type CampusZoneCollection = FeatureCollection<Polygon | MultiPolygon, CampusZoneProperties>;

// ---- Executive / Strategic ----

export interface RankingEntry {
  system: "qs-world" | "qs-asia" | "the-world" | "the-asia";
  label: string;
  rank: number;
  total: number;
  year: number;
  previousRank: number;
  trend: "up" | "down" | "stable";
}

export interface EnrollmentSnapshot {
  total: number;
  undergraduate: number;
  graduate: number;
  international: number;
  internationalPct: number;
  faculties: number;
  studentFacultyRatio: string;
}

export interface ResearchSnapshot {
  publications2024: number;
  citations2024: number;
  hIndex: number;
  topFields: string[];
  researchFundingMThb: number | null;
  patentsFiled: number;
}

export interface FinancialSnapshot {
  annualBudgetBThb: number | null;
  researchGrantsMThb: number | null;
  endowmentBThb: number | null;
  note: string;
}

export interface StrategicInitiative {
  id: string;
  name: string;
  status: "on-track" | "at-risk" | "delayed" | "completed";
  progressPct: number;
  owner: string;
  deadline: string;
  describe: string;
}

export interface PeerSnapshot {
  name: string;
  country: string;
  qsWorldRank: number;
  theWorldRank: number;
  studentsTotal: number;
  internationalPct: number;
  researchOutput: string;
}

export interface StrategicAlert {
  id: string;
  level: "info" | "watch" | "warning" | "critical";
  category: "environment" | "safety" | "reputation" | "operations" | "finance";
  title: string;
  message: string;
  issuedAt: string;
  source: string;
  actionRequired?: string;
}

export interface ExecutiveSnapshot {
  rankings: RankingEntry[];
  enrollment: EnrollmentSnapshot;
  research: ResearchSnapshot;
  finance: FinancialSnapshot;
  initiatives: StrategicInitiative[];
  peers: PeerSnapshot[];
  alerts: StrategicAlert[];
  updatedAt: string;
}

// ── Global markets — FMP (live ticks) + FRED (macro series) ─────────
export interface MarketTick {
  symbol: string;
  name: string;
  group: "index" | "forex" | "commodity" | "macro";
  value: number | null;
  changePct: number | null;
  asOf: string;
}

export interface MarketSnapshot {
  ticks: MarketTick[];
  thb: { vs: "USD" | "EUR" | "JPY" | "CNY"; rate: number | null }[];
}

// ── Digital Twin ────────────────────────────────────────────────────

export type TwinKind =
  | "building"
  | "sensor"
  | "road"
  | "reservoir"
  | "vessel"
  | "zone"
  | "poi"
  | "bridge"
  | "ferry"
  | "port";

export type TwinRelationPredicate =
  | "contains"
  | "monitors"
  | "adjacent_to"
  | "connected_to"
  | "serves"
  | "located_in"
  | "part_of";

export interface TwinObject {
  id: string;
  kind: TwinKind;
  name: string;
  nameTh?: string;
  nameEn?: string;
  lat: number;
  lng: number;
  geom?: unknown;
  properties: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TwinRelation {
  id: string;
  subjectId: string;
  predicate: TwinRelationPredicate;
  objectId: string;
  properties?: Record<string, unknown>;
  createdAt: string;
}

export interface TwinStatePoint {
  time: string;
  objectId: string;
  metric: string;
  value: number;
  source: string;
  properties?: Record<string, unknown>;
}

export type AdapterStatus = "healthy" | "degraded" | "down" | "unknown";

export interface AdapterHealth {
  name: string;
  status: AdapterStatus;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  consecutiveFailures: number;
  totalCalls: number;
  totalErrors: number;
  ageMinutes: number | null;
}

// ── GISTDA (Thailand Geo-Informatics & Space Technology) ────────────

export interface GistdaPoi {
  id: number;
  name: string;
  nameEn: string;
  category:
    | "government"
    | "school"
    | "temple"
    | "hospital"
    | "hotel"
    | "bank"
    | "restaurant"
    | "shopping"
    | "transport"
    | "sport"
    | "agency"
    | "other";
  subcat: number;
  road: string;
  roadEn: string;
  lat: number;
  lng: number;
  disabled: string;
}

export interface GistdaSolarBuilding {
  id: number;
  height: number;
  area: number;
  solarIrr: number; // kWh/m² monthly
  roofType: string;
  buildType: string;
  month: string;
  monthNum: number;
  lat: number;
  lng: number;
}

export interface GistdaLandUse {
  id: number;
  code: string;
  name: string;
  nameEn: string;
  area: number;
  lat: number;
  lng: number;
}

/**
 * Satellite-derived climate readings at Chonburi centroid.
 * Source: NASA POWER API (MERRA-2 reanalysis + satellite obs), ~3-day latency.
 * No API key required.
 */
export interface NasaEarthReadings {
  tempC: number | null;
  precipMmDay: number | null;
  solarMJm2: number | null;
  solarKWhm2: number | null;    // solarMJm2 / 3.6
  clearnessIndex: number | null; // ALLSKY_KT 0–1
  dataDate: string;              // YYYYMMDD
  source: "nasa-power-merra2";
}

// ── Isochrone (Geoapify) ─────────────────────────────────────────────────────

export type IsochroneMode = "walk" | "bicycle" | "drive" | "approximated_transit";

export interface IsochroneResult {
  lng: number;
  lat: number;
  minutes: number;
  mode: IsochroneMode;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  areaKm2: number | null;
}

// ── CV / CCTV detection events ───────────────────────────────────────────────

export interface CvBoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CvDetection {
  class: string;
  confidence: number;
  bbox?: CvBoundingBox;
}

export interface CvDetectionEvent {
  cameraId: string;
  timestamp: string;
  detections: CvDetection[];
  snapshotUrl?: string;
  model?: string;
  counts: Record<string, number>;
}

/** Facebook page post — mirrors the API adapter's FacebookPost interface. */
export interface FacebookPost {
  id: string;
  message: string;
  permalink: string;
  createdAt: string;
  image?: string;
  reactions?: number;
  comments?: number;
  shares?: number;
}
