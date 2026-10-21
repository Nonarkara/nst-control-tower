/** Observation age and synthesis age are separate checks. Invalid/future clocks
 * cannot turn a missing source into current evidence. */
export function freshTimestamp(value: string | null | undefined, now: number, maxAgeMs: number): boolean {
  const timestamp = value ? Date.parse(value) : NaN;
  return Number.isFinite(timestamp) && timestamp <= now + 300_000 && now - timestamp <= maxAgeMs;
}
