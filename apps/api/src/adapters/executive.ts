import type { ExecutiveSnapshot, NormalizedFeed } from "@nst/shared";

/**
 * Executive adapter — strategic data for Nakhon Si Thammarat City Municipality
 * mayor and leadership team.
 *
 * Data policy:
 *   - Rankings: public liveability / smart city indices.
 *   - Population / area: public DLA / NSO data.
 *   - Finance: PLACEHOLDER — wire to municipal ERP.
 *   - Initiatives: public municipal projects from official comms.
 *   - Peers: comparable Southern Thai municipalities for context.
 *   - Alerts: derived from live feeds (AQ, incidents, news sentiment).
 */

function meta(): NormalizedFeed<ExecutiveSnapshot>["meta"] {
  return {
    source: "nst-municipality-compendium",
    fetchedAt: new Date().toISOString(),
    ageMinutes: 0,
    fallbackTier: "reference",
  };
}

const SNAPSHOT: ExecutiveSnapshot = {
  updatedAt: new Date().toISOString(),

  rankings: [
    {
      system: "qs-world",
      label: "SLIC Smart City Index",
      rank: 0,
      total: 163,
      year: 2025,
      previousRank: 0,
      trend: "stable",
    },
    {
      system: "qs-asia",
      label: "Southern Thailand Sustainable Cities",
      rank: 0,
      total: 14,
      year: 2025,
      previousRank: 0,
      trend: "stable",
    },
  ],

  enrollment: {
    total: 102_152,      // city municipality registered population (DOPA 2019)
    undergraduate: 0,
    graduate: 0,
    international: 0,
    internationalPct: 0,
    faculties: 0,
    studentFacultyRatio: "—",
  },

  research: {
    publications2024: 0,
    citations2024: 0,
    hIndex: 0,
    topFields: ["Flood Risk Management", "Healthcare Access", "Circular Economy & Waste", "Smart City Governance"],
    researchFundingMThb: null,
    patentsFiled: 0,
  },

  finance: {
    annualBudgetBThb: null,
    researchGrantsMThb: null,
    endowmentBThb: null,
    note: "Municipal budget data — wire DLA / NST municipal ERP integration to populate.",
  },

  initiatives: [
    {
      id: "smart-city-nst",
      name: "NST Smart City Programme",
      status: "on-track",
      progressPct: 50,
      owner: "Mayor's Office",
      deadline: "2027-12",
      describe: "DEPA-backed smart city infrastructure: IoT flood sensors, open data platform, e-government services for 102,152 residents.",
    },
    {
      id: "flood-early-warning",
      name: "Khao Luang–Pak Phanang Flood Early-Warning",
      status: "at-risk",
      progressPct: 35,
      owner: "Environment & Disaster Division",
      deadline: "2026-09",
      describe: "River gauge network + GloFAS integration for the Tha Dee canal and Pak Phanang basin — the two primary flood vectors into the city. 2024 flood: 223,221 households impacted across 22 districts.",
    },
    {
      id: "digital-health-network",
      name: "Maharaj & City Hospital Digital Health",
      status: "on-track",
      progressPct: 55,
      owner: "Public Health Division",
      deadline: "2026-12",
      describe: "EHR integration across Maharaj Hospital (844 beds) and NST City Municipality Hospital (479 beds) — the province's two anchor health facilities.",
    },
    {
      id: "waste-to-energy-nst",
      name: "Thung Thalad Waste-to-Energy Facility",
      status: "at-risk",
      progressPct: 20,
      owner: "Public Works",
      deadline: "2028-06",
      describe: "Planned 20 MW WTE plant to replace the 22.16 ha Thung Thalad landfill (open since 1977). Province generates 368,388 t/yr; city 261 t/day with 51% imported from neighbouring areas.",
    },
    {
      id: "old-town-heritage",
      name: "Old Town Heritage & Education Corridor",
      status: "on-track",
      progressPct: 45,
      owner: "Culture & Tourism",
      deadline: "2027-06",
      describe: "Ratchadamnoen Road revitalisation, Wat Phra Mahathat heritage precinct and school outreach programme — anchoring NST as a UNESCO candidate cultural city.",
    },
  ],

  peers: [
    {
      name: "Surat Thani City Municipality",
      country: "TH",
      qsWorldRank: 0,
      theWorldRank: 0,
      studentsTotal: 130_000,
      internationalPct: 0,
      researchOutput: "—",
    },
    {
      name: "Hat Yai City Municipality",
      country: "TH",
      qsWorldRank: 0,
      theWorldRank: 0,
      studentsTotal: 160_000,
      internationalPct: 0,
      researchOutput: "—",
    },
    {
      name: "Trang Municipality",
      country: "TH",
      qsWorldRank: 0,
      theWorldRank: 0,
      studentsTotal: 75_000,
      internationalPct: 0,
      researchOutput: "—",
    },
  ],

  alerts: [], // populated dynamically from live feeds in the API route handler
};

export function fetchExecutiveSnapshot(): NormalizedFeed<ExecutiveSnapshot> {
  return {
    features: [{
      ...SNAPSHOT,
      rankings: SNAPSHOT.rankings.map((r) => ({ ...r })),
      initiatives: SNAPSHOT.initiatives.map((i) => ({ ...i })),
      peers: SNAPSHOT.peers.map((p) => ({ ...p })),
      research: { ...SNAPSHOT.research, topFields: [...(SNAPSHOT.research.topFields ?? [])] },
      updatedAt: new Date().toISOString(),
    }],
    meta: meta(),
  };
}

export function deriveAlerts(
  aqi: number | null,
  openIncidents: number,
  newsItems: Array<{ title: string; score: number; publishedAt: string }>,
): ExecutiveSnapshot["alerts"] {
  const alerts: ExecutiveSnapshot["alerts"] = [];
  let alertSeq = 0;

  if (aqi != null && aqi > 150) {
    alerts.push({
      id: `aq-${Date.now()}-${alertSeq++}`,
      level: aqi > 200 ? "critical" : "warning",
      category: "environment",
      title: "Air Quality Health Advisory",
      message: `NST AQI ${aqi} — exceeds WHO 24-hr guideline. Consider advisory for residents and outdoor workers.`,
      issuedAt: new Date().toISOString(),
      source: "Open-Meteo Air Quality",
      actionRequired: "Notify public health division, consider outdoor activity advisories.",
    });
  }

  if (openIncidents >= 5) {
    alerts.push({
      id: `inc-${Date.now()}-${alertSeq++}`,
      level: openIncidents >= 10 ? "warning" : "watch",
      category: "safety",
      title: "Elevated Incident Load",
      message: `${openIncidents} open citizen reports + traffic events in NST municipality. Review dispatch readiness.`,
      issuedAt: new Date().toISOString(),
      source: "Traffy Fondue + iTIC",
      actionRequired: openIncidents >= 10 ? "Brief operations chief" : undefined,
    });
  }

  const negativeNews = newsItems.filter(
    (n) =>
      n.score >= 500 &&
      /\b(scandal|protest|flood|fire|crash|death|injury|corruption|accident)\b/i.test(n.title),
  );
  if (negativeNews.length > 0) {
    const top = negativeNews[0];
    alerts.push({
      id: `rep-${Date.now()}-${alertSeq++}`,
      level: negativeNews.length >= 3 ? "warning" : "watch",
      category: "reputation",
      title: "Negative News Spike",
      message: `${negativeNews.length} high-relevance negative headline${negativeNews.length > 1 ? "s" : ""} in past 24h. Latest: "${top.title}"`,
      issuedAt: new Date().toISOString(),
      source: "Google News + Bangkok Post",
      actionRequired: negativeNews.length >= 3 ? "Comms team stand-up" : undefined,
    });
  }

  return alerts;
}
