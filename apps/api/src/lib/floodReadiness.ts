import { isCurrentObservation, type NormalizedFeed } from "@nst/shared";
export function assessFloodFeed<T extends { observedAt: string }>(feed: NormalizedFeed<T>, usable: (row: T) => boolean, now = Date.now()) {
  const current = feed.features.filter(row => isCurrentObservation(row.observedAt, now) && usable(row));
  const age = (now - Date.parse(feed.meta.fetchedAt)) / 60_000;
  const available = current.length > 0 && Number.isFinite(age) && age >= -5 && age <= 5 && feed.meta.ageMinutes <= 5 && (feed.meta.fallbackTier === "live" || feed.meta.fallbackTier === "cache");
  const ages = current.map(row => Math.max(0, (now - Date.parse(row.observedAt)) / 60_000));
  return { available, source: feed.meta.source, tier: feed.meta.fallbackTier,
    returned: feed.features.length, usableRecent: current.length,
    oldestObservationMinutes: ages.length ? Math.max(...ages) : null,
    sourceAgeMinutes: Math.max(age, feed.meta.ageMinutes), note: feed.meta.note ?? null };
}
