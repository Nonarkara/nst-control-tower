import type { NormalizedFeed } from "@nst/shared";
import { cacheAgeMinutes, cachedWithStale as cached } from "../lib/cache.js";
import { LOCAL_DATASETS, LOCAL_DATASET_COUNT, type LocalDatasetEntry } from "../data/localDatasets.js";

/**
 * Provincial open-data catalog — the slim checked-in index of the data.go.th
 * crawl (180 นครศรีธรรมราช datasets). Static snapshot, not a live CKAN
 * query: data.go.th CKAN is slow and rate-limited, and the 600 MB files/
 * cache can't ship to Workers — only metadata travels.
 *
 * Refresh: re-run the crawl (scripts/crawlDataGoTh.ts), then
 * `npx tsx scripts/buildDatasetManifest.ts --emit-ts` and redeploy.
 */

const SOURCE = "data.go.th-local-crawl";

export async function fetchLocalCatalog(): Promise<NormalizedFeed<LocalDatasetEntry>> {
  return cached("datago-local-catalog", 24 * 60 * 60, async () => {
    const fetchedAt = new Date().toISOString();
    return {
      features: LOCAL_DATASETS,
      meta: {
        source: SOURCE,
        fetchedAt,
        ageMinutes: cacheAgeMinutes(fetchedAt),
        fallbackTier: "database",
        note: `${LOCAL_DATASET_COUNT} provincial data.go.th datasets (static crawl snapshot — regenerate via scripts/buildDatasetManifest.ts --emit-ts)`,
      },
    };
  });
}
