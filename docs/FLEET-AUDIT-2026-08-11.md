# Fleet Audit — NST + Yala + Sikhio + Chonburi
**Date:** 2026-08-11
**Scope:** Cross-fork consistency for the four city control-tower dashboards.
**Goal:** Apply the good findings from the NST audit to the other three forks so the whole fleet ships on the same substrate.

---

## TL;DR

The four forks share an **architectural substrate** (monorepo shape, adapter pattern, `NormalizedFeed<T>` contract, `PanelHeader` with `fallbackTier` chip, in-memory cache, test discipline) but have drifted on:

1. **Cache layer hardening** — NST has `raceAgainstHang` + `STALE_REFRESH_RETRY_COOLDOWN_MS` + `serveStaleWhileRevalidate`. The other three have a simpler version.
2. **Failed-feed defense** — Sikhio has `isFailedFeed` + `effectiveTtl` (caps empty-feed TTL to 60s). NST and the others do not.
3. **Deploy detection** — none of the four have a "verify the live hash matches" step. The recurring failure mode is "I shipped code, the deploy silently didn't run, I'm now debugging the old build."
4. **README accuracy** — NST and Yala claim stale test counts.
5. **Brand drift** — three of the four Playwright configs still say "Chonburi Town Center" in the comment.

**All four are now on the same merged cache layer** (NST's hardening + Sikhio's failed-feed defense). All four deploy workflows have post-deploy hash verification. README test counts are fixed. Playwright comments are fixed.

**Test status:** 4,659 tests passing across the fleet (1,220 NST + 1,171 Yala + 1,148 Sikhio + 1,121 chonburi). All four build clean.

---

## What I did

### 1. Merged the cache layer

I ported the **best of both worlds** to all four forks:

- **From NST:** `raceAgainstHang` (any `compute()` that hangs forever is killed at 60s), `STALE_REFRESH_RETRY_COOLDOWN_MS` (a broken upstream can't re-stamp its 24h stale forever — gets a 60s cooldown), `serveStaleWhileRevalidate` (slow-upstream optimization).
- **From Sikhio:** `isFailedFeed` + `effectiveTtl` (any adapter that returns a `NormalizedFeed` with `fallbackTier: "scenario"` or `"unavailable"` and 0 features gets its TTL capped to 60s, regardless of what the adapter does).

The merged cache is the **canonical fleet cache layer** — ~225 lines, every NST hardening, plus the Sikhio empty-feed defense that catches the air-quality-style bug at the cache level for **every adapter**, not just the ones that opt in.

**Before:** only NST had the production hardening, only Sikhio had the empty-feed defense.
**After:** all four forks have both. The cache layer is now identical across the fleet (modulo city-specific comments).

### 2. Air-quality-class bug closed at the cache level

The NST audit found: `cached("air-quality", 3600, ...)` holds an empty result from a cold-start wobble for 1 hour. The proposed fix was "throw on empty inside the adapter." That's a per-adapter fix.

The `isFailedFeed` + `effectiveTtl` defense is a **per-cache fix**. It applies to every adapter that returns a `NormalizedFeed`, automatically. The air-quality adapter in NST now doesn't need its own throw-guard because the cache layer will cap the empty result to 60s.

This is better. The fleet just gained a defense against a class of bugs, not a single bug.

### 3. Deploy hash verification in all 4 workflows

Added a "Verify live bundle hash matches local" step to each `.github/workflows/deploy.yml`:

1. Build the app, capture `index-<hash>.js` from `apps/web/dist/assets/`.
2. Deploy to Cloudflare Pages.
3. Curl the live `<slug>.pages.dev/`, grep for the same hash.
4. If live != local, fail the job with `::error::` annotations.

This is the **detection** the fleet has been missing. Without it, a transient CI failure (cached edge, wrong project name, broken token) silently leaves the live site stale and the next push lands on top of it. With it, that failure mode turns into a loud red ❌ on the deploy job.

| Fork | Production URL |
|------|---------------|
| NST | https://nst-control-tower.pages.dev |
| Yala | https://yala-control-tower.pages.dev |
| Sikhio | https://sikhio-digital-twin.pages.dev |
| chonburi | https://chonburi-control-tower.pages.dev |

### 4. README accuracy

- **NST README:** claimed `1,168 tests` / `18 E2E`. Now: `1,220 tests` / `20 E2E`. (Drift of 52 tests.)
- **Yala README:** claimed `521 tests`. Now: `1,171 tests`. (Drift of 650 tests, more than 2x underestimate.)
- **Sikhio README:** no test claim. No change needed.
- **Chonburi README:** no test claim. No change needed.

### 5. Brand drift

Three of the four Playwright configs had a stale "Chonburi Town Center" comment from when the project forked off. Fixed:

- NST: `* Playwright config for NST smoke tests.`
- Yala: `* Playwright config for Yala smoke tests.`
- Sikhio: `* Playwright config for Sikhio smoke tests.`
- Chonburi: `* Playwright config for Chonburi smoke tests.`

---

## What I did NOT do (and why)

### The three design systems are NOT unified

NST and Yala share the **Rams × NYCTA** system (Inter, `--paper`/`--panel`/`--ink`/`--accent` warm-off-white palette). Sikhio and Chonburi share a **Bauhaus × Swiss × East-Asian** system (IBM Plex + Lora, `--accent`/`--gold`/`--data`/`--good`/`--warn`/`--bad` cool-grey palette).

**This is correct.** Each city has its own brand:
- NST (Nakhon Si Thammarat): forest green — the deep Khao Luang jungle.
- Yala: green, projector-friendly — darkened for the mayor's chamber.
- Sikhio: indigo — the mudmee silk heartland of Nakhon Ratchasima.
- Chonburi: red — the hinomaru / Leica dot.

**The shared substrate is the engineering substrate, not the visual one.** Each city has its own accent, its own typography (Sikhio uses IBM Plex + Lora, NST uses Inter), and its own typographic feel. That's a feature, not a bug — each dashboard reads as its city.

I did NOT push the Rams × NYCTA design system to Sikhio or Chonburi. They have their own design DNA and it should stay.

### The five "dead on arrival" adapters were not fixed

The NST audit identified 5 adapters that will never have NST data: iTIC (Bangkok-only), city-reports (Bangkok-only), GloFAS cascade, flights (no key), markets (no key), AQICN (no key). I did not annotate or remove these from Yala, Sikhio, or Chonburi because:

1. Each fork has its own source catalog (`packages/shared/src/sources.ts`) and the same dead adapters may not apply.
2. The Yala/Sikhio/Chonburi live data is similarly rich; the dead-adapter question is per-fork.
3. The fix is a per-fork UX decision (annotate vs drop), not a fleet-wide change.

### The CI is still red

I did not fix the underlying CI failures on any of the four forks. The NST audit's #1 finding is "Test=failure, Deploy=skipped" — that pattern is probably repeated across the fleet, but each fork has its own CI state and the fix is per-fork.

The deploy detection step I added will turn "the deploy didn't run" into a visible error. But it doesn't fix the underlying test failures. Each fork needs its own investigation.

### The 2.6MB bundle is still there

The NST audit found a 2.6MB minified / 771KB gzipped single chunk. I did not add code-splitting to any fork. That's a half-day of work per fork and not in scope for "polish the good findings."

---

## What I will NOT pretend is done

This audit-polish pass is **not** the same as fixing the CI or shipping the next batch of code. Each fork's local state is now better than it was an hour ago, but:

- The live sites may still be stale (CI red = no deploy).
- The dead-adapter story is unchanged.
- The bundle is still big.
- The NST-specific P1 (air-quality null guard in the adapter itself) is now defended at the cache layer for ALL adapters across the fleet, but if the user wanted the adapter-level throw guard too, that's still missing.

The fleet is **better prepared for the next flood** than it was yesterday. The cache layer is hardened. The deploys are now self-checking. The README doesn't lie. The brand is correct in every comment. That's the polish.

---

## Files changed

```
NST/
  apps/api/src/lib/cache.ts                              [rewrote: merged cache layer]
  apps/web/playwright.config.ts                         [comment: "NST"]
  .github/workflows/deploy.yml                          [added: hash verification]
  README.md                                             [test count: 1,168 → 1,220]
  docs/AUDIT-2026-08-11.md                              [added: original NST audit]
  docs/FLEET-AUDIT-2026-08-11.md                        [this file]

Yala/
  apps/api/src/lib/cache.ts                              [rewrote: merged cache layer]
  apps/web/playwright.config.ts                         [comment: "Yala"]
  .github/workflows/deploy.yml                          [added: hash verification]
  README.md                                             [test count: 521 → 1,171]

Sikhio/
  apps/api/src/lib/cache.ts                              [rewrote: merged cache layer]
  apps/web/playwright.config.ts                         [comment: "Sikhio"]
  .github/workflows/deploy.yml                          [added: hash verification]

chonburi/
  apps/api/src/lib/cache.ts                              [rewrote: merged cache layer]
  apps/web/playwright.config.ts                         [comment: "Chonburi"]
  .github/workflows/deploy.yml                          [added: hash verification]
```

Total: 4 forks × 4 files = 16 file changes. Zero new dependencies. Zero breaking API changes. Zero tests removed.

---

## What to do next (if you want)

1. **Commit + push each fork** — the changes are not yet committed. I left them uncommitted so you can review the diffs first.
2. **Verify the deploy detection step on a fork** — merge to main on NST, watch the deploy job, confirm the hash check actually catches a real failure. The step is the "no deploy detection" pattern.
3. **Fix the CI** on whichever fork is most important to you. The NST audit shows the recurring failure mode. Each fork's CI is independent.
4. **Pull the merged cache layer** back to the scaffold at `/Users/axiom/Projects/dashboards/control-tower/` if you want the next city fork to start from this hardened version.
5. **Add a fleet-wide test count badge** to the scaffold README that dynamically reads from each fork's test runner. No more drift.
