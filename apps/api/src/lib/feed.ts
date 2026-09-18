import type { NormalizedFeed } from "@nst/shared";
import { recordAdapterSuccess, recordAdapterError } from "./health.js";

/**
 * Shared feed envelope helpers — used by index.ts and the mounted sub-routers
 * (flood-risk-villages, damage-hotspots) so every feed route gets the same
 * x-source/age/fallback headers + adapter-health recording. A route that
 * bypasses safeFeed is invisible in /health/detailed and turns a cold-start
 * throw into a raw 500 instead of a calm `unavailable` feed.
 */

interface FeedMeta {
  meta: { ageMinutes: number; fallbackTier: string; source: string };
}

type Ctx = {
  header: (k: string, v: string) => void;
  json: (obj: unknown, status?: number) => Response;
};

export function setMetaHeaders(c: { header: (k: string, v: string) => void }, feed: FeedMeta): void {
  c.header("x-source", feed.meta.source);
  c.header("x-age-minutes", String(feed.meta.ageMinutes));
  c.header("x-fallback-tier", feed.meta.fallbackTier);
}

export async function safeFeed<T>(
  c: Ctx,
  fetcher: () => Promise<NormalizedFeed<T>>,
  adapterName?: string,
): Promise<Response> {
  try {
    const feed = await fetcher();
    setMetaHeaders(c, feed);
    if (adapterName) {
      // Treat "unavailable" fallback tier as a health error so the SOURCES catalog
      // can surface missing-API-key conditions (and other silent failures) instead
      // of just showing a green dot for a feed that returns zero features.
      if (feed.meta.fallbackTier === "unavailable") {
        recordAdapterError(adapterName, feed.meta.note ?? `Adapter unavailable (${feed.meta.source})`);
      } else {
        recordAdapterSuccess(adapterName, feed.meta.ageMinutes);
      }
    }
    return c.json(feed);
  } catch (err) {
    const message = (err as Error).message ?? "Internal server error";
    console.error(`API error [${adapterName ?? "unknown"}]:`, message);
    if (adapterName) recordAdapterError(adapterName, message);
    return c.json({ error: message }, 500);
  }
}
