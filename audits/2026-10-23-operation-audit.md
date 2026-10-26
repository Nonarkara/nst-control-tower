# The operation audit — 23 to 26 October 2026

*"Operation audit — the water is coming for real now."*

This audits the flood operation end to end: from the authority's own alert
level, through the relay and the API, to the two screens a duty officer
actually reads — the briefing at `/flood-ops` and the one-screen desk.

The standard is the one this product is held to everywhere else: **measure
before fixing**. A number in this document came from a live payload, a live
endpoint or a rendered page. Nothing here is a reading of the source code
alone.

Every failure below is named the way the law demands: *what it looked like,
what it cost the reader, what caused it, what was changed, and how the change
was verified.* A failure that cannot be re-measured is not fixed.

---

## 1. The operation, as it was measured

Measured against production (`nst-control-tower-api.drnon.workers.dev`) on
**26 October 2026** — the water at **05:48 ICT**, and again at **08:13 ICT**,
when the authority had declared.

### The river

| gauge | to the bank | trend | age | level |
|---|---|---|---|---|
| **สะพานนางพระยา-บางหลวง** (ปากนคร) | **−0.73 m** | **rising** | 32 min | 4 |
| ฝายคลองท่าเลา | −0.94 m | stable | 52 min | 4 |
| บ้านนาป่า | −1.94 m | stable | 112 min | 3 |
| บ้านเสาธง | −2.38 m | rising | 112 min | 3 |
| สะพานข้ามคลองท่าแพ | −2.67 m | falling | 32 min | 2 |

**15 of the 22 gauges reported within 52 minutes; 7 lag at ~112 minutes** —
still inside the product's 2-hour freshness window, but at its edge, and the
page says so rather than rounding them into "current".

**The water came back overnight.** On 25 October at 00:07 ICT the nearest
gauge to the bank was PTTEP3 at **0.26 m and falling**. At 05:48 on 26 October
it is **0.73 m and rising**. Same gauge, same river, twenty-nine hours apart:
the level rose by roughly half a metre and the trend reversed. This is the
condition the operation has to be ready for, and it is why the audit was
ordered.

### The rain and the ground

- Wettest 24 h: **บ้านคันเบ็ด (ลานสกา) 59 mm**, ไร่ วงศ์ ทอง เมฆ ดี (ทุ่งสง) 45 mm,
  บ้านทุ่งอินทนิน (บางขัน) 44 mm, บ้านยางค้อม (พิปูน) 38 mm.
- Soil moisture index **802.1 — "saturated"**. Rain trend **steady** (ratio 1.4).
- Tide rising: 0.90 m MSL at 06:00 ICT → 1.05 m at 07:00 → **1.17 m at 08:00**.
- Cameras: **26 of 31 online**, 5 offline, 0 unknown.

### The authority's own layer

86 DWR EWS stations (25 water, 61 rain). **DWR has declared 0 alerts.**

And yet:

> **บ้านบางจันสี\* (บางชัน) is 0.25 m *above* DWR's own alert level** —
> 4.25 m of water against a 4.00 m alert threshold, observed 38 minutes ago.

Second closest: บ้านนางเอื้อย\* +0.89 m, บ้านวังหิน\* +1.29 m,
บ้านไสโคกเกาะ\* +1.67 m. **12 of the 86 stations are stale or undated** and
are excluded from the current comparison rather than counted as calm.

**Two and a half hours later, at 08:13 ICT, the authority declared it.**
The same station — บ้านบางจันสี (บางชัน) — now carries a DWR alert at tier
**เฝ้าระวัง (watch)**, and the desk's answer leads with the declaration:

> `สถานะเตือน อต.: อต. ประกาศเตือน 1 สถานี — ระดับเฝ้าระวัง · บ้านบางจันสี* (บางชัน)`

That is the whole operation in one line: the water reached the authority's
own threshold, the authority noticed, and the product said so — without
claiming a warning it does not have, and without dropping the near-bank
gauge that got it there (สะพานนางพระยา-บางหลวง, 0.59 m from the bank and
rising, 15/15 gauges current).

This is also the moment that exposed F15: the answer had led with that
gauge, because the declaration and the gauge were both "watch" and the
array order decided the tie.

This is the situation that exposed the desk's worst defect (§2, F6): the water
is *at or over* the level at which the authority would raise an alert, and
the authority has raised none. The product must say both facts, in that order,
without contradicting itself.

---

## 2. The failures, named

### F1 — The official alert could not reach the mayor's briefing

**Looked like:** the briefing reported water levels, camera comparisons and
rain, and said nothing about the one thing the authority had declared.
**Cost:** the officer reading `/flood-ops` could act on a picture that
omitted the official warning.
**Cause:** the DWR alert tier was not read into the briefing synthesis.
**Repair:** `63a6a9a` — the official layer is part of the synthesis the
briefing renders, and an alert in force is the loudest line on the page.
**Verified:** deployed and verified live; the briefing now prints the
declared tier and the station.

### F2 — The sign-off endpoint was measuring the cache, not the origin

**Looked like:** the readiness endpoint that decides "can this picture be
trusted unattended" returned **four different verdicts in eighteen seconds**
on identical data — 503, 503, 503, 200 — with the reported snapshot age
swinging between **104 minutes and 4 minutes**.
**Cost:** an operator polling it could not tell a real outage from a cache
write. An endpoint that flips at random is worse than one that stays red.
**Cause:** the probe called the adapter's stale-serving cache, and then
compared that cache's clock against a **5-minute** threshold — stricter than
the product's own 2-hour freshness rule, and measuring the wrong thing.
**Repair:** the probe now contacts the **origin** and bypasses every cache
layer, and a failed probe reports its reason instead of a softened
"unavailable".
**Verified in production:** ages are now **0 / 0 / 0.16 / 0.02 min** across
four probes, and the failures name themselves — DWR's own HTTP 522, the
relay exceeding the probe deadline.

### F3 — The relay's budget sat inside the failure envelope

**Looked like:** the RED verdict's "around 16.2–16.4 s" was not an upstream
being slow — it was **our own client giving up**. The budget was 16 s against
a measured 13–15 s cold rebuild: a 6 % margin, spent.
**Cost:** worse than a slow page. The shared cache is written only after a
successful fetch, so a cold read that timed out left the cache empty and
**every later request paid the same timeout and failed the same way**. The
cache could never bootstrap.
**Repair:** `RELAY_TIMEOUT_MS` 16 000 → **25 000**; a timed-out cold read
now leaves one repair attempt running in the background, so the next request
finds the cache filled; the release warms the feed and reports the gauge
count. An empty or malformed reply is deliberately **not** retried — that is
a stable condition, and doubling the load on a struggling origin helps
nobody.
**Verified:** relay budget 25 s against a measured 13–15 s cold rebuild; the
deploy prints "✅ flood feed warm — 22 gauges cached".

### F4 — An old reading blanked the river table

**Looked like:** when a gauge's reading fell outside the freshness window,
the row disappeared instead of ageing.
**Cost:** a station that had gone quiet looked like a station that had been
removed, and "no row" reads as "no problem".
**Repair:** `068e3fe` — **an old reading is still evidence**. Silent stations
are shown with their age, and missing stations are never counted as safe
stations.

### F5 — An upstream outage blanked the official layer

**Looked like:** during a DWR EWS origin outage, the official layer went
empty rather than showing its last good reading.
**Cost:** the mayor's most authoritative layer was the first to vanish, and
it vanished *silently*.
**Repair:** `bbc6523` — `SNAPSHOT_READ_MS` 1 000 → 4 000; the live fetch is
split from the snapshot read, and on an origin outage the last good reading
is served marked `fallbackTier: "cache"` with a "not live" note. Two tests
reproduce the sequence.

### F6 — The desk's first line contradicted itself

**Looked like:** the desk's answer read

> `ประกาศเตือน อต.: ไม่มีประกาศเตือนจาก อต. …`

"DWR warning: no DWR warning from DWR." The heading was the wrong word — the
sentence was true, the heading was not.
**Cost:** a contradiction on the most prominent line of the page, on the
screen a mayor reads first, on the morning the water arrives.
**Repair:** `494ac45` — the heading is now `สถานะเตือน อต.` ("DWR alert
status"), true in both branches, and the sentence leads with the fact that
earns the chip — *the water is at or over DWR's own alert level at …* — with
the absence of a declaration as the qualifier **after** it.
**Verified:** new tests assert that the heading never contradicts its own
sentence, that the answer never prints `ประกาศเตือน อต.: ไม่มีประกาศเตือน`,
and that the fact precedes the qualifier.

### F7 — A compartment could become an empty bordered box

**Looked like:** the bento's official and news compartments span two grid
rows, so each inherited the rows' combined height. When their data was
short, each became **an empty bordered panel — 183 px in the official cell
and 193 px in the news cell at 1440 px, 42 % of the viewport** — and which
cell it landed in changed with the feed state.
**Cost:** the largest empty region on the page was in the two compartments
the mayor reads first. It looked like a design; it was an accident of
alignment.
**Repair:** `align-items: start` on `.desk-bento` — every compartment is now
exactly its content (measured empty-box height **13 px = padding only**, in
every cell, in every state).
**Verified:** with the room freed, the official compartment now carries **six**
DWR stations closest to the authority's threshold (was three) and the news
compartment **eight** headlines (was five), still ranked most important
first. The law's target — *a compartment with room must hold content, never
padding* — is now a property of the layout rather than a coincidence of the
data.

### F8 — The header had no width budget

**Looked like:** the header's content set varied with the viewport width
**and with its own longest strings**. The trust label "9 of 9 data sources
not live" was 181 px of sentence; the weather word "Thunderstorm with heavy
hail" was 175 px; the clock returned at 1501 px. The bar **wrapped at 1200,
1366, 1440, 1536, 1600 and 1700**.
**Cost:** the DESK button — the one-click entry to the whole morning's
espresso — needed 64 px out of a slack that was already only ~35 px. On the
widths that wrapped, the button moved to a second row and the mayor had to
*hunt* for it. A one-click promise that is not one click at 1440 px is not
a promise.
**Repair:** `bbdf21c` — the trust label is always the **bounded count** form
(`LIVE` / `STALE 5/9` / `DOWN` / `CHECK`, the sibling war room's shape) with
the full sentence kept as the accessible name; the weather word is
ellipsised at 18ch; the clock and AQI column shed ≤1699 px; the identity
drops to its mid tier at `--text-md` and sheds its Thai organisation line
≤1439 px (that line was 231 px — wider than the city name it sits under);
the weather goes ≤1199 px; on the phone form the display preferences move
into the More menu. **The task cluster never sheds.**
**Verified:** one row from **320 px to 1920 px with 54–321 px to spare** (was
35 px); DESK visible and clickable at every desktop width and in the More
menu on the phone; four new e2e tests pin one row, >40 px free at seven
desktop widths, the desk one click away at each, and the preferences
reachable wherever the bar drops them.

### F9 — A 27-day-old station led the evidence list

**Looked like:** the official compartment's evidence list was sorted by
distance to DWR's alert level, so a station that had not reported in 27 days
led the list — marked "ล้าสมัย", but still first.
**Cost:** the reader's first line of evidence was not evidence from today.
**Repair:** `8fa2c06` — the current stations lead; the silent ones follow,
marked. The comparison itself is unchanged: a silent station can still be the
closest to the threshold, and the sentence still says so.
**Verified:** a new test asserts that a stale station never leads the
evidence list and that the silent one is marked where it appears.

### F10 — The suite's own locator was stale (the deploy blocker)

**Looked like:** CI failed on `buildingRealism.spec.ts` at 1024 px and 390 px.
**Cause:** F8 moved the display preferences — the 2D/3D switch among them —
into the More menu below 1100 px, where the shell is the mobile form. The
test still looked for the switch in the bar at every width. The control was
there and working; the test was looking in the old place.
**Repair:** `a7e9fa8` — the test opens the More menu at those widths and
asserts the same thing that matters: after the temple flies into 3D, the way
back to 2D is one menu away and not gone.
**This failure had a cost beyond CI:** the desk was **never deployed** — the
Pages deploy runs only after the test job succeeds. Two days of shipping
work sat behind a stale locator.

### F11 — The host died, and the product gap it hid

**Looked like:** the laptop overheated and powered off; the system was down
for days. On return, the disk was at **100 %** and Playwright could not start
(ENOSPC).
**Repair:** 272 stale Chrome temp profiles (all ≥60 min old, from other
sessions' dead harnesses) were reclaimed — **6.1 GB** — taking the disk to
85 % with 30 GB free. Production had survived throughout: the site, the
Pages bundle and the Worker all answered, with the flood feeds live and
`sourceAgeMinutes ≈ 0`.
**Cost:** the outage was not a production outage, but it hid F10 — the desk
was already repaired and pushed, and simply had not deployed. **An outage
does not repair a release; it only shows you which release was waiting.**

### F12 — The headlines were not translated in production, and nothing said so

**Looked like:** the deployed desk served **7 of 8 headlines in English**,
while the owner's requirement was "headlines in other languages translated
for him into headlines easy to understand". The page carried a quiet line
— *"some headlines are not yet translated"* — and no reason.
**Cost:** the requirement was failing in production behind a screen that
looked fine. The local API translated every headline in 0.1 s on the same
code, so the defect was invisible to every local test.
**Cause:** **Cloudflare's egress cannot use the public translate endpoint.**
Measured from this host the endpoint answers 200 in 0.1 s, with or without a
User-Agent; from the Worker it answers **HTTP 429** — Google rate-limits the
datacentre egress. MyMemory, the fallback, answers **429** from the same
egress. A single provider that silently returned nothing turned the
requirement into a page of English.
**Repair:** the desk now walks a **chain** of key-free providers and says
which one answered — Google's plain Thai first, then **Cloudflare's own edge
model** (`@cf/meta/m2m100-1.2b`, a new `[ai]` binding), then MyMemory. A
third party's reachability is not something this product can control;
Cloudflare's own model is. Two more things came out of the measurement:

- The model answers `{"translated_text": "…"}`, **not** `{"result": "…"}`.
  The parser expected the wrong key, so a working model looked like a dead
  one — the desk swallowed it and wrote "no translation in the reply".
- A provider that fails **hard** (an error status, or no answer at all) is
  skipped for ten minutes, so one dead endpoint cannot cost every headline
  its timeout. A reply that merely carried no Thai is a content problem and
  does not take the provider out of the chain.

**Verified in production:** 7 of 7 foreign headlines are now in Thai, with
the original English underneath each one, and the note is gone. The model's
Thai is serviceable but not elegant — it turns "city pond plan" into
"แผนเมืองธง" — which is why Google's answer is still tried first.

### F13 — The desk timed out in the browser before it could answer

**Looked like:** the live desk rendered **"อ่านโต๊ะทำงานไม่ได้ — Request timed
out after 25s"** — the desk's own failure state, on the screen the mayor is
meant to read first.
**Cause:** the desk's synthesis is cached **per isolate**, and a cold
isolate has to rebuild it. Measured: six concurrent requests to the deployed
desk — five answered in **0.06 s** from a warm isolate, one took **11 s** on
a cold one, and the browser request that landed on a cold isolate blew the
page's 25 s budget. The variable cost in that build was the translation
chain.
**Repair:** two changes, and the second is the one that matters:

- **The translation has a hard deadline (6 s).** The translation is the
  *least* urgent thing on the desk — the answer and the four parts are the
  flood situation, and they must never wait for a headline. What has not
  arrived by the deadline is shown in the original language with a line that
  says the translation is still running. *A desk that shows English
  headlines is better than a desk that times out.*
- **The deploy warms the desk**, for the same reason it warms the flood
  feed: a fresh isolate starts with an empty cache, and the first person to
  open the desk should not be the one who pays for it.

**Verified:** the cold build is now **8.5–9.1 s** (was 11 s, and sometimes
over 25 s), a warm build is **0.05 s**, and the live page renders the desk
with the answer in the first screen.

### F14 — The header said the data server was unreachable, while it was serving

**Looked like:** the live header printed **"DOWN — Data server
unreachable"** at 1440, 1024 and 390 px.
**Cost:** a lie in the most prominent spot of the header. The mayor's first
question about the dashboard — *can I trust the numbers?* — was answered
wrongly, and wrongly in the worst way.
**Cause:** the header counted its nine feeds as "live" only, and the feeds
that had **not answered yet** were counted as failures. The API itself
reported "degraded, 0 down, 22 healthy" at that moment.
**Repair:** **"DOWN" is a claim about every feed** — it means they all
answered and none of them is live. The picture is finished only when
nothing is still loading; until then the word is "CHECK". A feed that
answered stale is not a loading feed, so once every feed has answered the
count is the truth ("5 of 9 data sources not live").

This took two repairs, and the second one is the lesson: the first treated
"all feeds loading" as "not an outage" and left the rest — a feed that has
answered *stale* is not loading, so four stale feeds and five loading ones
still counted as "answered", and the header said "DOWN" again. The rule
that survives is the one that asks what the word *claims* rather than what
the code counts.

### F16 — A snapshot read that failed was reported as "no snapshot stored"

**Looked like:** during a DWR 522 window, the official layer came back with
**zero stations** and the note *"DWR EWS unreachable — non-OK 522 … and no
last-good snapshot is stored."* The snapshot was there; the *read* had failed.
**Cost:** the layer that carries the authority's own judgement went blank,
and the note pointed at the wrong cause — an operator would have concluded
the snapshot never existed, which is a different repair from a slow read.
**Repair:** the snapshot read is tried once more, and its three outcomes are
told apart — a snapshot, no snapshot stored, or a read that failed. The note
says which one it was.

### F15 — A declared alert sat behind a measured signal

**Looked like:** with **DWR's alert in force** at บ้านบางจันสี (บางชัน), the
desk's answer led with the nearest gauge — also "watch" — and the
authority's own declaration was the second signal.
**Cause:** the answer sorted by severity alone, and a stable sort let the
array order decide a tie. Our reading of a threshold at one station was
placed above the authority's declaration about its own.
**Repair:** a **declared** alert outranks a measured signal **at the same
level**. A declaration is the authority's call about its own station; our
inference is ours. A *critical* measurement still leads a declared watch —
the water over the bank is worse news than a declared tier. The near-bank
line does not disappear; it moves to a signal and the answer says how many
others there are.

---

## 3. What is still RED, and who owns it

**RED — DWR EWS upstream.** `ews.dwr.go.th` answers **HTTP 522** on some
attempts and 200 in ~1 s on others (measured from this host: 200 in 1.08 s,
2.99 MB). When it fails, the Worker does **not** let an empty reply replace
the official layer: **22 consecutive polls during a 522 window all returned
the last-good 86-station snapshot**, marked *"DWR last-good snapshot;
refreshing — not live. Verify station observation times."* — never dressed up
as live. Owner: the upstream. Nothing in this repository can make an empty
upstream answer; what this repository can do is not lose the last good
reading when it happens, and it no longer does (F5, and F16).

**RED — the translation's reachability.** Google's key-free translate
endpoint and MyMemory both answer **HTTP 429** from Cloudflare's shared
egress, while both answer 200 from this host. The desk therefore leans on
**Cloudflare's own model**, which works and is first-party — but its Thai is
serviceable rather than elegant, and the better answer (Google's) is only
taken when the network lets it. The chain names every provider's failure,
so the reason is on the page rather than in a log.

**RED — unattended flood decisions.** The readiness endpoint returns 503
while any feed is stale, and that is correct. A release cannot be signed off
for unattended flood decisions until DWR answers again *and* the relay path
has demonstrated continuity across a cold cache.

**RED — the relay is a single point of failure.** The relay is a Mac on
this host. This host ran at load 143–219 during the flood pass with swap
exhausted; the relay was SIGKILLed once (`com.flooddash.server` last exit
`-9`) and its restart spent its time checkpointing SQLite before it would
listen. On 25 October the same host overheated and died. The Worker depends
on that one origin, so a starved host takes the national gauge feed dark —
which is exactly what happened at 15:54 on 23 October. The Worker-side
budget fixes remove *our* contribution to that failure; they do not make the
origin durable. That remains the AirDash project's work: a durable origin,
or a separately hosted collection path that does not share this host's
failure mode.

**Known limitation — the TMD bulletin is hardcoded and expired.** The
bulletin's `recheckAt` is `2026-10-21T05:00+07:00`. It is past. The page
says it is expired rather than presenting a stale bulletin as current. TMD's
live bulletin is not fetched; fetching it is the open thread.

**Known limitation — 12 EWS stations are stale or undated.** They are
excluded from the current comparison and shown with their age. Excluded is
correct; *undated upstream* is not ours to fix.

**Not established — camera-derived water depths.** No calibrated inundation,
arrival-time or CV-water-depth claim is supported. The product says so, and
this audit did not change it.

---

## 4. The two sentences that must never be printed the same way

Both were violated at some point in this operation, and both are now pinned
by tests:

1. **"Checked, and nothing was declared"** ≠ **"Could not ask the
   authority."** The first is a calm finding; the second is an outage. The
   first is `ไม่มีประกาศเตือนจาก อต.`; the second is `ยังยืนยันสถานะเตือน อต. ไม่ได้
   — แหล่งข้อมูลไม่ตอบ (ไม่ใช่การไม่มีประกาศ)`.
2. **"The water is at the threshold"** ≠ **"The authority has declared an
   alert."** Today, at บ้านบางจันสี, the first is true and the second is
   not. The desk says the first, and says the second as a qualifier after it.

A third rule, learned the hard way: **never present a stale number as
current.** A missing measurement is written as missing — never as zero, never
as a stale value wearing a fresh label.

---

## 5. The evidence

| | where |
|---|---|
| Feed continuity audit (23 Oct) | `audits/2026-10-23-flood-feed-continuity.md` |
| Emergency shipability (23 Oct) | `audits/2026-10-23-emergency-shipability.md` |
| The desk (24 Oct) | `audits/2026-10-24-mayor-desk.md` |
| Spatial-hallucination sweep (22 Oct) | `audits/2026-10-22-msh-spatial-hallucination.md` |
| Header budget measurements | `var/topbar-budget-2026-10-24/` |
| Desk render + geometry | `var/verify-desk-2026-10-24/` |
| Emergency release verification (Codex, 23 Oct) | `var/emergency-audit-2026-10-23/release-verdict.md` |

### On the Codex release verdict of 23 October

An independent run audited release `6a067fb` and recorded **operational
readiness: FAIL / degraded** — six concurrent gauge requests returning zero
features, the FloodDash origin returning 502, and the local and public
origins timing out.

**That verdict was accurate when it was written, and it no longer describes
the system.** Measured again on 26 October at 05:39–05:48 ICT:

| probe (the verdict's own method) | 23 Oct 15:54 | 26 Oct 05:45 |
|---|---|---|
| six concurrent gauge requests | 0 features each, ~16.2–16.4 s, tier unavailable | **22 features each, 2.6–3.0 s, HTTP 200** |
| public FloodDash origin | 502 / timeout | **200 in 4.3 s** |
| production `/api/health/flood-readiness` | 503 | **200** — water 22/22, rain 130/133, ews 74/86 |
| local relay `:8340` | timing out | **200**, `data_as_of` seconds old |

Two honest qualifications. First, the verdict's *structural* finding — that
the relay is one Mac on one host, and that this host fails — is **not**
superseded; it is the reason the outage of 25 October was possible at all.
Second, `6a067fb` is an **ancestor** of the current release, not the current
release: the verdict audited a build from three days before the flood-ops
repair, the desk, and the header budget.

A sign-off endpoint that flips because the origin is genuinely flapping is
correct. One that flips because a cache was written at a different moment is
not. The second kind was fixed in F2; the first kind is still true, and the
verdict should be re-read with it in mind.
