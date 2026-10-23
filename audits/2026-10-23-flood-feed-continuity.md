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

## 4. The sign-off endpoint was measuring the cache, not the origin

The RED verdict is the thing an operator reads to decide whether the flood
picture can be trusted unattended. So the endpoint that produces it has to
mean something stable. It did not.

Four probes, six seconds apart, against identical data:

| probe | HTTP | water | rain | ews |
|---|---|---|---|---|
| 1 | 503 | **available**, age 0.0 min | available, 0.0 | unavailable, 0.0 |
| 2 | 503 | unavailable, age **104.2 min** | unavailable, 104.2 | unavailable, 105.0 |
| 3 | 503 | unavailable, age **9.6 min** | unavailable, 9.6 | unavailable, 9.8 |
| 4 | **200** | **available**, age 4.3 min | available, 4.3 | available, 4.4 |

Eighteen seconds, four different verdicts, the same stations. The reported
snapshot age swung between 104 minutes and 4.

### Why

The endpoint's own comment says *"Active probes: unlike the per-isolate
adapter log, this checks actual data."* It did not. It called
`fetchWaterGauges()`, which reads the adapter's cache — and
`cachedWithStale` **serves an expired entry immediately and refreshes in the
background**. So the probe assessed whatever snapshot the cache happened to
be holding, with that snapshot's own clock, and its verdict depended on
whether the background refresh had landed. The availability rule then
compared that clock against a **5-minute** threshold:

```ts
age >= -5 && age <= 5 && feed.meta.ageMinutes <= 5
```

A cache entry older than five minutes reads as an outage — even though the
relay's shared snapshot is deliberately kept for **two hours** and the
dashboard deliberately serves a stale snapshot for **sixty minutes**. The
rule was stricter than the product it was certifying, and it was measuring
the wrong thing: not whether the gauges are current (the observation age,
already checked, 120 minutes) but whether a cache was recently written.

The same read path sits behind the relay's **edge cache**, which answers
with the last-good snapshot for up to two hours. So even bypassing the
adapter's cache would not have been enough — the edge cache answers a probe
with a snapshot that carries the clock of the fetch that populated it.

### Changed

- **The probe contacts the origin.** `probeWaterGauges`,
  `probeRainfall` and `probeEwsStations` skip the adapters'
  stale-serving cache, and `fetchRelayDirect` skips the relay's edge cache.
  A probe that cannot reach the origin is a **failed probe**, and the
  endpoint says so with the reason — not a softened "unavailable" feed.
- **The verdict is now about the origin.** The 5-minute snapshot rule is
  left alone deliberately: with the cache out of the way, it now measures
  what it was meant to measure — whether the origin answered — and the
  observation-currency rule (120 minutes) continues to judge the data.
- **A failed probe says why.** `"Feed probe failed or exceeded deadline"`
  becomes the actual message — a relay timeout reads as a relay timeout.

### Verified

| | before | after |
|---|---|---|
| Four probes, 6 s apart | 503, 503, 503, **200**; age swung 104 → 4 min | ages **0 / 0 / 0.16 / 0.02 min** — the probe is talking to the origin |
| What the probe reads | the cache, with the cache's clock | **the origin** |
| A failed probe | "Feed probe failed or exceeded deadline" | **the actual reason** — e.g. `fetchJsonOrThrow non-OK 522 https://ews.dwr.go.th/…`, `Operational source deadline exceeded` |
| Tests | 748 API | **755 API** (seven new) |

### Verified in production

Deployed as `13d12fa`. The four probes above now read, in the same shape:

```
probe 1: http=200 overall=True  | water True age=0 | rain True age=0 | ews True  age=0.157
probe 2: http=503 overall=False | water True age=0 | rain True age=0 | ews False err=fetchJsonOrThrow non-OK 522 https://ews.dwr…
probe 3: http=503 overall=False | water False err=Operational source deadline exceeded | rain False err=Operational source deadline exceeded | ews True age=0.023
probe 4: http=200 overall=True  | water True age=0 | rain True age=0 | ews True  age=0.024
```

Two things are now true that were not:

- **The ages are zero**, because the probe contacts the origin. The 104-minute
  clock is gone.
- **The failures name themselves.** Before: "Feed probe failed or exceeded
  deadline" for every cause. Now: DWR's own **HTTP 522**, and the relay
  exceeding the probe deadline. The RED that remains is the upstream's, not
  an artefact of when a background refresh landed.

The remaining variability is genuine: `ews.dwr.go.th` answers HTTP 522 on some
attempts and an empty `[]` on others, and the relay occasionally takes longer
than the 22-second probe deadline under this host's load. **A sign-off
endpoint that flips because the origin is genuinely flapping is correct; one
that flips because a cache was written at a different moment is not.**

The deploy also reported: **"✅ flood feed warm — 22 gauges cached"** — the
release now warms the shared cache while nothing depends on it.

---

## 5. One line of text against the bezel

Sweeping the live site at 1440 px, one element in the left rail sat at
**x = 0** while all 300 of its siblings sat at x = 16: the data-currency
note — *"Current analysis uses station observations ≤ 2 h old. 0
older/undated water records excluded; missing stations are not safe
stations."* Its first character touched the screen edge.

The rail carries no padding of its own; every block inside it brings its own
16 px gutter. This one was a bare `<p>` directly under the rail and brought
none. It is the sentence that says how fresh the data is and that missing
stations are not safe — the wrong line to lose a letter to.

Measured with a `Range` over the text node, not the box: **live x = 0 → fixed
x = 16**, matching every sibling, at 1440 px and 390 px.

*(This was read off a screenshot first and mis-diagnosed as text being cut
off. It was not cut — the element carried the right text and the right
width. It was flush. Measuring the glyph box instead of the element box is
what separated the two.)*

---

## 6. What is still RED, and who owns it

**RED — DWR EWS.** `ews.dwr.go.th` serves `200 []` on some attempts and
**HTTP 522** on others — the adapter's own comment records the 522 as
intermittent. The Worker holds its last-good 86-station snapshot and will
not let an empty or failed reply replace it. Owner: the upstream. Nothing in
this repository can make an empty upstream answer.

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

## 7. A note on the measurement host

The sweep harness drives real Chrome and leaves no orphans — it closes the
context and the browser at the end of the run. But this host is shared, and
at load 143–219 a Playwright harness needs 600–900 s rather than 300 s,
and a sweep that differs between runs is usually cold-vs-warm data timing
rather than a layout change. Re-measure before calling a difference a
regression. Two orphan `chrome-headless-shell` roots from earlier sessions
were found and left alone: another session's browser is not ours to kill.
