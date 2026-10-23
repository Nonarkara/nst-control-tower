# Flood feed continuity — 23 October 2026

Release `6a067fb` is deployed to web and API. This pass audits that release
against the spatial-hallucination law and against the RED operational
verdict recorded at 15:55 ICT, and repairs the one defect that is ours to
repair.

The RED verdict was **accurate**. It was also, for two of the three feeds,
no longer true by the time this pass finished. The difference is worth
recording exactly, because the two states look identical from the outside
and mean different things.

---

## 1. The spatial-hallucination law, measured on the deployed artifact

The 22 October audit was run against a local dev server while the upstream
API was degraded — that is, against the product in its *worst* data state.
The deployed artifact had never been swept, and it now carries live data:
22 river gauges, 141 rain stations, 86 EWS stations, real news, real
camera names. Live data is exactly what produces spatial hallucination, so
the sweep was re-run against **https://nst.nonarkara.org** — all 72
surfaces, at 390 × 844, 1024 × 900 and 1440 × 900.

| | result on the deployed artifact |
|---|---|
| Surfaces swept | **72** (9 lenses, 3 phone tabs, 9 dialogs, `/flood-ops`, `/data`, the Watch Terminal) × 3 widths |
| Horizontal overflow | **0** on every surface |
| Clipping | **0** everywhere except the CCTV wall's 6 long Thai camera names at 1440 px (recorded, deliberate — the name is in the tile's `title` and `aria-label`) |
| Ink holes | **1** — a 62 px gap at the *end* of the `/flood-ops` document (the shorter column's end), **2** at 390 px. Pre-existing, measured, left in place |
| Touch targets under 44 px | 2–15 per surface, all inside the map's own controls and the layer palette — no regression |
| Ink coverage vs the degraded local build | **up on every lens** (+0.02 to +0.078) — live data fills the screen rather than leaving voids |

The deployed artifact **passes the law**. The six spatial hallucinations
killed on 22 October (`c102435`, `f52afa0`, `f8ca5aa`) and the typeface
repair (`4c4eb01`) are all in this build — `4c4eb01` is an ancestor of
`6a067fb`.

### The one thing the sweep could not settle

The CCTV command centre is reachable only at **≥1101 px**, so its repair is
verified at 1440 px alone. The six names that still overrun do so with a
visible ellipsis; the tile's `title` and `aria-label` both carry the full
name. A 141 px tile at a 13 px type floor cannot hold
`ปากซอยอิศวร(ถ.ศรีธรรมราช)ตัวที่ 1`, and the two ways to fix that — wrapping
to a second line, or shrinking below the type floor — each cost more than
the name is worth in a wall of 24.

---

## 2. The RED verdict, measured at 16:36 ICT

At 15:54 ICT the verdict recorded: *"all six concurrent gauge requests
returned zero features and tier unavailable, around 16.2–16.4 s."*

That figure is the finding. It is not how long the upstream took — **it is
how long our own client waited before giving up.** Measured against the
live origin at 16:36 ICT:

| probe | result |
|---|---|
| `api-v3.thaiwater.net` water levels, from this host | **200 in 0.30 s** (1.4 MB) |
| `api-v3.thaiwater.net` rain, from this host | **200 in 0.49 s** (4.8 MB) |
| `data.hii.or.th` (HII CKAN) | **200 in 0.22 s** |
| `tiservice.hii.or.th` (WRF-ROMS) | **200 in 0.05 s** |
| FloodDash relay, local `:8340` | **200**, 51 water + 173 rain stations, cold rebuild **13.7 s / 14.8 s**, warm **0.005–1.3 s** |
| FloodDash relay, public `flood.nonarkara.org` | **200 in 1.18 s** |
| Production `/api/water/gauges` | **200**, **22 features**, `fallbackTier: live`, age 0 min |
| Production `/api/health/flood-readiness` | **503** — water ✅ (22), rain ✅ (141), **EWS ❌** (snapshot 50.3 min old) |

Two things follow.

**The upstreams are healthy and Cloudflare cannot see them.** ThaiWater
answers a Thai residential IP and not Cloudflare's egress — the relay
exists precisely for this. The relay recovered on its own during the
window, and with it the water and rain feeds: **22 gauges and 141 rain
stations are flowing now**, with the 29 and 32 silent stations correctly
excluded rather than shown as calm.

**The EWS leg is genuinely red, and it is not ours.** `ews.dwr.go.th`
currently answers `200 []` — an empty array — with or without a browser
User-Agent. The Worker is holding its last-good snapshot of 86 stations and
correctly refusing to let an empty reply replace it, then correctly
reporting it as *not* fresh and refusing to certify. **That is the system
working.** A 503 here means "not certified", not "down", and the scope line
says so: *"feed availability only; incomplete station coverage is not an
all-clear or operational certification."*

---

## 3. The defect that was ours: a budget inside the failure envelope

The relay's comment recorded the history precisely:

> *FloodDash computes this route from a 6.8 GB database on a busy Mac:
> measured 10 s cold … and the Worker used to give up at exactly 10 s — so
> the relay failed every time the 60 s server cache had expired.*

The budget was raised from 10 s to 16 s. **The origin's cold compute has
since grown to 13–15 s** — and 16 s left a 6 % margin. That margin is what
was spent: the verdict's *"around 16.2–16.4 s"* is a request aborting on
our own timeout, not an upstream being slow.

The failure is worse than a slow page. **The shared cache is written only
after a successful fetch.** So a cold-cache request that times out leaves
the cache empty, and the next request pays the same timeout and fails the
same way. The cache can never bootstrap after a cold start. That is the
verdict's own sentence: *"Newly deployed/cold data-centre caches require a
successful upstream fetch before they can provide continuity. This
deployment has not demonstrated continuity against the unavailable
origin."*

### Changed

- **The budget outlasts the measured cold rebuild.** `RELAY_TIMEOUT_MS`
  16 000 → **25 000**. It covers the measured 13–15 s worst case with room
  to spare, and still fits Cloudflare's ~30 s post-response window. The
  comment now records the current measurement instead of the old one.
- **A timed-out cold read no longer strands the cache.** The failed read
  leaves one more attempt running in the background, which is the call that
  actually fills the cache — so the next request finds it filled instead
  of paying the timeout again. A **timeout only**: an empty or malformed
  reply is a *stable* condition, a retry will not change it, and doubling
  the load on an origin that is already struggling helps nobody.
- **A deployment warms the feed.** The release workflow now fetches
  `/api/water/gauges` after the Worker is live and reports how many gauges
  it cached. The cache is warmed while nothing depends on it, rather than
  by the first operator who opens the dashboard. A cold warm-up is a
  **warning, not a deploy failure** — the upstream may be down, and the API
  is honest about that either way.
- **The test now pins the current measurement.** The old guard asserted
  `RELAY_TIMEOUT_MS > 15_000` against a *10 s* cold compute — a threshold
  that had fallen below the real one. It now asserts `> 20_000` against the
  measured 13–15 s, and two new tests cover the retry: a timeout retries,
  an empty reply does not.

### Verified

| | before | after |
|---|---|---|
| Relay budget vs the measured cold rebuild | 16 s vs 13–15 s — **6 % margin** | **25 s** |
| A cold-cache read that times out | cache left empty; every later request repeats the timeout | **one background repair attempt; the cache fills** |
| The existing breaker contract | one relay call per feed | **unchanged** — an empty reply is not retried |
| Deploy-time continuity | cold cache until the first operator arrives | **warm-up step, with the gauge count reported** |
| Tests | 746 API | **748 API** (two new); **1128 web** (78 files); `tsc -b` clean for both packages; build succeeds |

---

## 4. What is still RED, and who owns it

**RED — DWR EWS.** `ews.dwr.go.th` serves `200 []`. The Worker holds its
last-good 86-station snapshot, reports it as stale, and refuses to
certify. Owner: the upstream. Nothing in this repository can make an empty
upstream answer.

**RED — unattended flood decisions.** The readiness endpoint returns 503
while any feed is stale, and that is correct. The release cannot be signed
off for unattended flood decisions until DWR answers again *and* the relay
path has demonstrated continuity across a cold cache — which the timeout
fix now makes possible, but which has to be observed on a real deployment.

**Not established — camera-derived water depths.** No calibrated
inundation, arrival-time, or CV-water-depth claim is supported. The
product says so, and this pass did not change it.

**Durable origin — the remaining structural risk.** The relay is a Mac on
this host, and this host ran at **load 143–219** during this pass with
swap exhausted. The relay was SIGKILLed once today (`com.flooddash.server`
last exit `-9`) and the restart spent its time checkpointing SQLite before
it would listen. The Worker depends on that one origin, so a starved host
takes the national gauge feed dark — which is what happened at 15:54.
The Worker-side budget fix removes *our* contribution to that failure; it
does not make the origin durable. That remains the AirDash project's work:
a durable origin, or a separately hosted collection path that does not
share this host's failure mode.

---

## 5. A note on the measurement host

The sweep harness drives real Chrome and leaves no orphans — it closes the
context and the browser at the end of the run. But this host is shared, and
at load 143–219 a Playwright harness needs 600–900 s rather than 300 s,
and a sweep that differs between runs is usually cold-vs-warm data timing
rather than a layout change. Re-measure before calling a difference a
regression. Two orphan `chrome-headless-shell` roots from earlier sessions
were found and left alone: another session's browser is not ours to kill.
