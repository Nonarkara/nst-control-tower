/** Operational display freshness policy, not an official alert expiry rule.
 * Fetch/cache time never renews an observation. Two hours accommodates HII's
 * reporting cadence; older records remain historical evidence, not current state.
 */
export const OPERATIONAL_OBSERVATION_MAX_MIN = 120;
export function isCurrentObservation(observedAt: string | null | undefined, now = Date.now()): boolean {
  const age = now - Date.parse(observedAt ?? "");
  return Number.isFinite(age) && age >= -5 * 60_000 && age <= OPERATIONAL_OBSERVATION_MAX_MIN * 60_000;
}
