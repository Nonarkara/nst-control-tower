import { test as base, expect } from "@playwright/test";
import type { BasinWaterBalance } from "@nst/shared";
import { stubHiiSurvey } from "./floodSmokeHelpers";
import { SOURCE_CATALOG } from "@nst/shared";

const basin: BasinWaterBalance = {
  basinId: "city_tha_dee", nameTh: "ลุ่มน้ำท่าดี (ข้อมูลทดสอบ)", nameEn: "Tha Dee (test fixture)",
  areaKm2: 100, areaProvenance: "UI test fixture", runoffCLo: 0.3, runoffCHi: 0.5,
  wetness: "unknown", soilMoisturePct: null, tidal: false, tideFactor: null,
  horizons: [{ horizonH: 24, rainObservedMm: 10, rainForecastMm: 20, inflowM3Lo: 900000,
    inflowM3Hi: 1500000, conveyanceM3: 2000000, reservoirHeadroomM3: 0,
    stressLo: 0.45, stressHi: 0.75, band: "ok" }],
  gauges: [], chokeStationCode: null, chokeUtilizationPct: null, worstEtaOvertopH: null,
  suggestedScenarioM: null, hasReservoir: false, reservoirs: [],
  verdictTh: "ข้อมูลจำลองสำหรับทดสอบ", verdictEn: "Synthetic UI test data", assumptions: ["UI test fixture"],
};

/** UI smoke tests are deterministic and never spend production provider quotas.
 * Individual tests can override these routes to exercise loading/failure states.
 * API adapter contracts are covered by the API suite.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await stubHiiSurvey(page);
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      let body: unknown = {
        features: [], items: [], events: [], count: 0,
        meta: { source: "smoke-fixture", fetchedAt: new Date().toISOString(), ageMinutes: 0, fallbackTier: "unavailable", note: "No upstream data in UI smoke tests" },
      };
      if (path === "/api/twin/predictions") body = { forecasts: [], count: 0 };
      if (path === "/api/health") body = { ok: true, env: "test", version: "smoke" };
      if (path === "/api/health/detailed") body = {
        system: { status: "healthy", healthy: 0, degraded: 0, down: 0, total: 0 },
        adapters: [], mqtt: { connected: false, messageCount: 0, lastError: null }, at: new Date().toISOString(),
      };
      if (path === "/api/water/balance") body = { features: [basin], meta: { source: "smoke-fixture", fetchedAt: new Date().toISOString(), ageMinutes: 0, fallbackTier: "scenario" } };
      if (path === "/api/sources") body = { sources: SOURCE_CATALOG };
      if (path === "/api/health/keys") body = { keys: [], configured: 0, total: 0 };
      await route.fulfill({ json: body, headers: { "Access-Control-Allow-Origin": "*" } });
    });
    await page.route("https://api.open-meteo.com/**", (route) => route.fulfill({
      json: { current: { temperature_2m: 28, weather_code: 3 }, daily: { time: [] } },
      headers: { "Access-Control-Allow-Origin": "*" },
    }));
    await use(page);
  },
});
export { expect };

export type { Page } from "@playwright/test";
