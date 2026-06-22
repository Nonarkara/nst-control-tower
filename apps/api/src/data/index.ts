import type { AtlasModule, AtlasSnapshot } from "@nst/shared";
import { demographicsModule } from "./demographics.js";
import { fiscalModule } from "./fiscal.js";
import { outcomesModule } from "./outcomes.js";
import { educationModule } from "./education.js";
import { healthModule } from "./health.js";
import { climateModule } from "./climate.js";
import { economyModule } from "./economy.js";
import { securityModule } from "./security.js";
import { governanceModule } from "./governance.js";
import { ATLAS_SOURCES } from "./sourceCatalog.js";

/**
 * NST Data Atlas — assembled snapshot of every outcome-data module + the full
 * source catalogue, digitized from the NST Municipal Data Source Bible. Static
 * reference data, so it works identically on Node and Workers.
 *
 * Order = the narrative the dashboard tells: who we serve → money → outcomes →
 * the domains → governance strength.
 */
export const ATLAS_MODULES: AtlasModule[] = [
  demographicsModule,
  fiscalModule,
  outcomesModule,
  educationModule,
  healthModule,
  climateModule,
  economyModule,
  securityModule,
  governanceModule,
];

export { ATLAS_SOURCES };

export function buildAtlasSnapshot(): AtlasSnapshot {
  return {
    modules: ATLAS_MODULES,
    sources: ATLAS_SOURCES,
    generatedAt: "2026-06-19T00:00:00.000Z",
    meta: {
      source: "nst-data-bible",
      fetchedAt: "2026-06-19T00:00:00.000Z",
      ageMinutes: 0,
      fallbackTier: "reference",
      note: "Static outcome-data atlas digitized from the NST Municipal Data Source Bible (Jun 2026).",
    },
  };
}

export function getAtlasModule(id: string): AtlasModule | undefined {
  return ATLAS_MODULES.find((m) => m.id === id);
}
