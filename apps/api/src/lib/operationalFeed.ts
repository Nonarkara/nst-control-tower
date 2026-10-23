import type { NormalizedFeed } from "@nst/shared";

/** Apply after every cache layer: serving a snapshot never renews its clock. */
export function ageOperationalFeed<T>(feed: NormalizedFeed<T>, now = Date.now()): NormalizedFeed<T> {
  const elapsed = now - Date.parse(feed.meta.fetchedAt);
  const valid = Number.isFinite(elapsed) && elapsed >= -5 * 60_000 && elapsed <= 2 * 3600_000;
  const ageMinutes = Number.isFinite(elapsed) ? Math.max(0, Math.floor(elapsed / 60_000)) : feed.meta.ageMinutes;
  if (!valid) return { features: [], meta: { ...feed.meta, ageMinutes, fallbackTier: "unavailable",
    note: "Source snapshot expired or its retrieval clock is invalid. Current observations unavailable; retrying." } };
  const cached = elapsed >= 60_000 && feed.meta.fallbackTier === "live";
  return { ...feed, meta: { ...feed.meta, ageMinutes,
    fallbackTier: cached ? "cache" : feed.meta.fallbackTier,
    ...(cached ? { note: `${feed.meta.note ? `${feed.meta.note} · ` : ""}Last-good source snapshot; refreshing — not live.` } : {}),
  } };
}
