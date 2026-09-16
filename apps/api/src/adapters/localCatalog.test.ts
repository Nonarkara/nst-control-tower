import { describe, expect, test } from "vitest";
import { fetchLocalCatalog } from "./localCatalog";
import { LOCAL_DATASET_COUNT } from "../data/localDatasets";

describe("fetchLocalCatalog", () => {
  test("returns the full crawl index as a database-tier feed with provenance note", async () => {
    const feed = await fetchLocalCatalog();
    expect(feed.features.length).toBe(LOCAL_DATASET_COUNT);
    expect(feed.features.length).toBeGreaterThan(100);
    expect(feed.meta.fallbackTier).toBe("database");
    expect(feed.meta.note).toMatch(/provincial data\.go\.th datasets/);
    expect(feed.meta.note).toMatch(/buildDatasetManifest/);
  });

  test("every entry has an id, Thai title, org and a data.go.th URL", async () => {
    const feed = await fetchLocalCatalog();
    for (const d of feed.features) {
      expect(d.id.length).toBeGreaterThan(0);
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.url).toMatch(/^https:\/\/data\.go\.th\/dataset\//);
    }
  });

  test("provincial office dominates the catalog (sanity on crawl scope)", async () => {
    const feed = await fetchLocalCatalog();
    const provincial = feed.features.filter((d) => d.organization.includes("นครศรีธรรมราช"));
    expect(provincial.length).toBeGreaterThan(feed.features.length / 2);
  });
});
