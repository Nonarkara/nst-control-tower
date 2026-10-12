# Security audit — nst-control-tower run-1

Source audited: `c8c785ef4873d4527c44d407c84f5848ed8a1473` on `main`, worktree clean. Line numbers below are that tree. Skill `cloudflare/security-audit-skill` at `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8`. Profile `standard`. Scope `.`. Budget unset, so no agent cap applied and this is not a partial pass.

Execution policy: `sandboxed-source-and-local-only`. This environment has no bubblewrap, firejail, or `unshare` for net and mount, and no trusted no-follow promotion tool. Target code was not executed. Confirmed results are source observations. AirLabs was not called. No request was sent to the public Worker or to a paid provider.

Prior runs: none. No carried same-source confirmation and no changed-source revalidation.

Agents: reconnaissance; wave-1 hunters for secrets, writes, spend, edges, and client; a wave-2 pass that added the CV camera-index unit and then stopped; independent verifiers for the writes, edges, and client records. The secrets record was normalized from the hunter candidate into the findings schema and accepted by `validate-findings.cjs`. Phase 5 returned verified for every retained record. The distinct final-clean critic stopped. `validate-coverage-ledger.cjs` passed (16 units, every `unresolved` list empty).

Deferred coverage: none. Out of scope: `MEMORY-SAFETY-AND-BINARY.md` (no native parser) and `DESKTOP-MOBILE-AND-LOCAL-IPC.md` (no native shell). Live reachability of the forecast process, deployed Worker secret presence, and provider account budgets are outside the repository and stay in `NEEDS VALIDATION`.

The credential bytes from `infra/run-nst-api.sh` are omitted from this report.

## Posture

This is a public MIT flood-control tower with no end-user authentication. Open reads of flood, weather, and related feeds are the product. The tree also publishes an AirLabs client key, accepts anonymous twin mutations that the intelligence lens presents as the city forecast, and disables Postgres certificate verification whenever TLS is selected. No confirmed finding is critical or high. Six leads stay unconfirmed because a deployment fact or a missing local redirector is not in source.

## Confirmed findings

| Severity | Title | Boundary | Observed result |
|---|---|---|---|
| medium | Tracked Node launch script assigns a non-placeholder AirLabs API key | Repository reader → operator AirLabs credential | `infra/run-nst-api.sh:11` assigns `AIRLABS_API_KEY`. `fetchFlights` sends that value as `api_key`. The raw value was not copied and AirLabs was not called. |
| medium | Anonymous twin writes become the city precipitation forecast | Internet client → twin state read as TimesFM | `POST /api/twin/state` has no credential check. `writeTwinState` appends the point before any database call. `GET /predictions` maps that value to `p50` with no source filter. |
| medium | Twin Postgres pool accepts any TLS certificate | On-path principal → Postgres | The only `pg.Pool` sets `ssl: { rejectUnauthorized: false }` whenever `shouldUseSsl` is true, including `sslmode=verify-full`. No handshake was run. |
| low | Anonymous CV posts appear as camera water-rising detections | Internet client → in-memory gauge ring | `POST /api/cctv/cv-events` stores a validated event with no writer check. `CvGaugePanel` lists class `water-rising` as rising. The header stays `cv-gauge · experimental`. |

### Tracked AirLabs key — medium

- Location: `infra/run-nst-api.sh:11` → `apps/api/src/node.ts:47` (dotenv does not replace an existing export) → `apps/api/src/node.ts:69` and `:127` → `apps/api/src/index.ts:379` → `apps/api/src/adapters/flights.ts:141`.
- Principal: a repository reader who is not the AirLabs account owner. `README.md:46` distributes the tree as MIT source and states that it contains zero secrets.
- Reproduction: open `infra/run-nst-api.sh` and compare the assignment with the empty provider keys in `apps/api/.env.example`. Follow the export through `loadDotenv` into the AirLabs `api_key` query parameter. Do not copy the value.
- Conditions: the script is tracked. `.gitignore` ignores `.env`, `.env.*`, and `.dev.vars`, and does not ignore this script.
- Result: a non-placeholder credential is in a tracked file and is the value `fetchFlights` interpolates. `/api/health/keys` (`apps/api/src/index.ts:230`) reports presence only.
- Impact: the operator AirLabs client credential. The adapter comment at `flights.ts:8` sizes the feed against a free tier of 1,000 requests per month. The script does not include Cloudflare, database, or other provider credentials. The Node listener in that script binds `127.0.0.1`.
- Priority: likelihood high because reading the repository is enough; impact medium because the demonstrated use is that free-tier client key, not account takeover.
- Smallest fix: delete the assignment. Inject the key only through the launchd environment or a gitignored `apps/api/.env`. Rotate the key, because the value remains in published history. Keep `/api/health/keys` limited to presence.

### Anonymous twin forecast write — medium

- Location: `apps/api/src/routes/twin.ts:143` (`POST /state`), also `twin.ts:45` (`POST /objects`), `twin.ts:73` (`DELETE /objects/:id`), and `twin.ts:91` (`POST /relations`). Propagation: `apps/api/src/lib/twinStore.ts:213`. Read path: `twin.ts:183` and `twin.ts:197`. Sink label: `apps/web/src/components/PredictivePanel.tsx:182`.
- Principal: any client that can reach the API. `.github/workflows/deploy.yml:117` curls the workers.dev host with no credential. Source shows no Access policy.
- Reproduction: read the `/api` middleware in `apps/api/src/index.ts` (CORS, then the 600/minute limiter at line 272) and the mount at `index.ts:646`. Read `POST /state`. It requires `objectId`, `metric`, a numeric `value`, and `source`, then calls `writeTwinState`. Read `GET /predictions`. With `dbReady` false, a stored `precipitation.forecast` point for `objectId` `city` is returned as `p50`.
- Conditions: unauthenticated. On a process where the pool does not connect, including the Worker path when `pg` does not load (`twinDb.ts:13`), the next predictions read on that same process returns the memory point. Worker module state is isolate-local: `wrangler.toml` has no database URL and the KV binding is commented out. A Node process with a connecting database URL also inserts `twin_state`, and that SQL read has no source filter (`twinDb.ts:334`). Predictions keep the last two hours. The warning chip and `SITUATION ALERT` render when a viewer opens the intelligence lens and the maximum `p50` exceeds the metric threshold (50 for precipitation).
- Result: source shows the append and the unlabeled source filter. `PredictivePanel` presents the horizon under the literal source `timesfm·zs`. A stored value of 1 stays below the alert threshold. The same handler accepts any JSON number, and a `p50` above 50 calls `onAlert` (`PredictivePanel.tsx:153`, `SituationDigest.tsx:72`).
- Impact: other readers of that process see a forged city forecast, including the intelligence-lens alert path when the value exceeds the threshold. The write does not operate a physical control. A cross-isolate result is not visible in source.
- Priority: likelihood high because the mutation handlers have no auth branch; impact medium because the blast radius shown in source is that process or isolate.
- Smallest fix: require a server-side writer credential on `POST /objects`, `DELETE /objects/:id`, `POST /relations`, and `POST /state`. Leave public GET forecasts open. CORS and the IP limiter do not identify a writer.

### Postgres certificate verification off — medium

- Location: `apps/api/src/node.ts:83` → `apps/api/src/lib/twinDb.ts:109` → `shouldUseSsl` at `twinDb.ts:80` → `getPool` at `twinDb.ts:97`. `twinStore.ts:69` uses the same pool.
- Principal: an on-path principal between the Node API and Postgres.
- Reproduction: read `getPool`. It is the only `pg.Pool` constructor. When `shouldUseSsl(url)` is true the `ssl` option is `{ rejectUnauthorized: false }`. `shouldUseSsl` returns true for any `sslmode` other than `disable` or `allow`, including `verify-full`, and for a Supabase host. `apps/api/.env.example:21` documents `DATABASE_SSL=true`.
- Conditions: `pg` loads and the URL selects TLS. The attacker can intercept the TCP path. An explicit false SSL flag returns before that object and is a separate hardening note, not this result.
- Result: certificate verification is off on every TLS pool this process constructs. The socket is still encrypted. No handshake was run.
- Impact: a successful impersonation exposes the database password and twin rows. This is not an internet-remote unauthenticated compromise.
- Priority: likelihood low because exploitation needs a network position on the database path; impact medium because that position yields the database credential and twin rows. Overall medium.
- Smallest fix recorded by the audit: verify the server certificate, and load a private CA when the host chain is not in the default trust store. A one-line flip to `rejectUnauthorized: true` without that CA is not a safe change for the documented Supabase pooler path.

### Anonymous CV detections — low

- Location: `apps/api/src/index.ts:674` → `apps/api/src/lib/cvEvents.ts:38` and `:92` → `apps/web/src/components/CvGaugePanel.tsx:123`. The browser publisher is `apps/web/src/lib/gaugeWatch.ts:315`, which posts with no secret.
- Principal: any client that can reach the API, including a client that did not run the in-browser gauge analysis.
- Reproduction: read `POST /api/cctv/cv-events`. A `cameraId`, an ISO timestamp, and a `detections` array enter the ring. `CvGaugePanel` polls `class=water-rising` and renders the text rising. `CctvStreamModal.tsx:178` shows non-empty counts as Last detection.
- Conditions: the ring is process memory. Other isolates do not share it. Nothing writes these events to SQL. The list is requested on the flood and environment lenses (`railSections.ts:95`).
- Result: a dummy event is stored and a later GET on that process returns it. The header source stays `cv-gauge · experimental`. The empty-state disclaimer (`CvGaugePanel.tsx:108`) renders only while the list is empty.
- Impact: other viewers of that process see a forged rising row. Nothing pages a crew or moves a control. The experimental label keeps the impact low.
- Priority: likelihood high, impact low, overall low.
- Smallest fix: if the ring is a shared camera signal, accept posts only from a writer credential. The experimental label does not replace that check. The in-browser gauge watch posts this route with no secret, so closing it requires a matching client change. That change is not in the safe fix set for this run.

## NEEDS VALIDATION

These are leads. They have no severity and are not confirmed vulnerabilities.

| Lead | Trace | Blocker | Bounded local next step | Owner check |
|---|---|---|---|---|
| Anonymous handlers spend operator upstream credentials; the 600/min Map is per isolate | `index.ts:382` geocode, `:385` places, `:419` street view, `:464` WAQI, `:518` concierge, `:612` chat; sinks in `google.ts:91`, `isochrone.ts:85`, `concierge.ts:39` | Deployed key presence and provider hard budgets are outside the repo. Target execution was prohibited, so a stubbed `fetch` was not run. | Network-disabled stub: one geocode call with a dummy key and one with the key unset; two isochrone calls 0.001° apart; concierge with an unmatched question, then one containing `flood`. Do not call the providers. | Owner checks whether `GOOGLE_MAPS_API_KEY`, `GEOAPIFY_API_KEY`, `GEMINI_API_KEY`, and `AQICN_TOKEN` are set, and whether the provider console has a hard budget. Do not send traffic at the public host. |
| Forecast `POST /run` schedules model work with no credential | `apps/forecast/main.py:69` → `:39` → `timesfm_runner.py:208` → `:165` | Source does not show that a running forecast process is reachable from a lower-trust network. Database URL presence is not in the repo. CI does not publish this service. | In-process ASGI `POST /run` with an empty body and no Authorization header. Expect `queued`. Do not point it at a shared database. | Owner records whether the host of `python main.py` is reachable from outside that host and whether any access policy sits in front of `POST /run`. |
| Deploy API job may build `workflow_run` head SHA with the Cloudflare token | `test.yml:4` → `deploy.yml:6` → `deploy.yml:93` → `deploy.yml:111` | GitHub's rule for `workflow_run` when the triggering Test run is a pull request is not in this repository. | Disposable private repo, dummy non-production secret, fork PR whose head branch is named `main`. Record whether deploy starts and which SHA is checked out. Cancel before `wrangler deploy`. | Owner reviews Actions history for `workflow_run.event` `pull_request` or a foreign `head_repository`. Do not print secrets. |
| Preview fetch follows redirects without a final-host check | `index.ts:528` → `datagoDetail.ts:413` → `:288` → `:302` | No in-repo allowlisted host redirects to a host that fails `isAllowedHost`. | Loopback TLS name ending in `.go.th` returning 302 to a second loopback JSON body. Record whether `preview` contains the second body. Do not contact an external host. | On a non-production deployment, log only the final host of one preview whose initial URL is already a catalog resource, and compare it with `isAllowedHost`. |
| `latestByCamera` keeps every distinct `cameraId` | `index.ts:674` → `cvEvents.ts:79` → `cvEvents.ts:95` | Cloudflare's request-body limit and isolate memory ceiling are not in the repo. | 2001 tiny events with distinct short `cameraId` values. Expect ring length 2000 and map size 2001. Do not allocate large arrays and do not POST to production. | Owner reads the account's body-size and isolate-memory limits and compares them with the uncapped fields. Do not POST a large body. |
| Status JSON serializes database locators and the MQTT broker URL | `index.ts:237` → `twinDb.ts:145` → `twinDb.ts:152`; MQTT `brokerUrl` at `mqttBridge.ts:56` | No committed configuration assigns a database URL or `MQTT_BROKER_URL`. The password is not one of the serialized fields. | Call `dbUrlMeta` with a dummy URL that contains a password. Expect `user` to be the username and the password to be absent. | Owner requests the two status routes on the listener they treat as reachable and records whether `host`, `user`, `database`, `error`, and `mqtt.brokerUrl` are null. Do not paste non-null values into a ticket. |

Detail, evidence, and the exact plans are in `NEEDS-VALIDATION.md`.

## Hardening and positive patterns

Positive:

- Public `GET` flood and weather feeds are intentional open data. That unit is covered, not a vulnerability.
- `POST /api/chat` has no tool schema. `ChatBox` escapes text before `dangerouslySetInnerHTML`. `safeUrl` allows only `http` and `https`.
- On the Worker, `getClientIp` prefers `cf-connecting-ip`. Header spoofing does not choose the Worker bucket. The Node default bind is `127.0.0.1`.
- `GET /api/health/keys` returns booleans. `dbUrlMeta` does not read the URL password. `getMqttStatus` does not return `MQTT_PASSWORD`.
- `.env` and `.env.*` are gitignored, with an exception only for `.env.example`, whose provider keys are empty.
- Key-absent branches in the Google, Geoapify, Gemini, and AQICN helpers return before `fetch`.
- `GET /api/flights` caches under the constant key `flights-nst`. Caller input does not mint a new AirLabs URL. That is a different root from the unique-input proxies.

Hardening, not findings:

- `apps/api/wrangler.toml` sets `workers_dev = true` and commits a Cloudflare account id. `apps/web/src/lib/apiBase.ts:6` hardcodes `https://nst-control-tower-api.drnon.workers.dev`. `ENVIRONMENT=dev` only changes the `/api/health` label. A fork that deploys unchanged keeps the upstream account id and hostname. Upstream CORS returns an empty origin for unknown browser origins, so this does not hand a credential to a new principal.
- `index.html` CSP is a meta element with `script-src` and `style-src 'unsafe-inline'`. `frame-ancestors 'none'` in a meta CSP is ignored by browsers. The repo sets no `X-Frame-Options` or `_headers` policy. Framing does not add a privilege the public API lacks.
- Neither workflow declares a `permissions` block. Actions are pinned to floating major tags (`@v4`), not commit SHAs. The pages job does not pin `workflow_run.head_sha`.
- `GET /api/sources`, `/api/health`, `/api/health/detailed`, `/api/health/keys`, and `/api/db/status` are registered before the 600/minute middleware. They do not call the keyed upstreams.
- `DATABASE_SSL=false` forces `shouldUseSsl` false even for a Supabase host, which leaves the pool without the `ssl` option. That is an explicit operator override, separate from the non-verifying TLS finding.
- `CctvStreamModal` assigns iframe `src` from `embedUrl` without `safeUrl`. Municipal URLs are built on the fixed nstcctv origin.
- `POST /relations` stores the predicate string without checking the documented union. That laxness is on the same twin router.

Coverage decision, not a finding: `mqtt-bridge.delivered-payload-becomes-twin-state` was rejected. `startMqttBridge` never sets `binaryType`. On this Node runtime a binary frame arrives as a `Blob`, and the listener handles only `string` and `ArrayBuffer`, so a delivered MQTT publish does not reach `handlePayload`.

## Fork-time footguns

This repository is a public template. The notes below are the same records and hardening notes, grouped for someone copying the tree. They do not add a severity.

- Default secret: `infra/run-nst-api.sh:11` is a tracked provider key. `.env.example` is empty, which is the pattern to keep. A fork that copies the launch script inherits the upstream key. Rotate after removal; history still contains the value.
- Open writes: twin mutations (`twin.ts:45`, `:73`, `:91`, `:143`) are unauthenticated and become the city forecast. CV ingest (`index.ts:674`) is unauthenticated and low impact because the panel is labeled experimental. Forecast `POST /run` (`main.py:69`) binds `0.0.0.0` when launched as main and is not in the Cloudflare deploy. Public flood GETs stay open on purpose.
- Missing cost caps: geocode, places, Street View Static, WAQI tiles, isochrone cache misses, and concierge Gemini send operator credentials on caller-controlled input when those keys are set. The 600/minute `Map` (`index.ts:242`) is per address per isolate. It is not a credit or currency budget. The isochrone file comments 3,000 free credits/day and does not count them (`isochrone.ts:5`). Chat's 20/minute `Map` does not apply to concierge (`index.ts:518`).
- Deploy defaults: `workers_dev`, the committed account id, and the hardcoded API host send a fork's production build at the upstream Worker when `VITE_API_BASE_URL` is empty. Fork docs that skip those three values leave that path in place. That unit is covered hardening, not a confirmed vulnerability.
- TLS: `DATABASE_SSL=true` selects `rejectUnauthorized: false` (`twinDb.ts:97`). A fork that pastes a Supabase URL inherits that pool.
- Status routes: if a fork sets a database URL, `GET /api/db/status` (`index.ts:237`) returns host, port, database, username, and driver error to an unauthenticated caller. The password is not a field. Treat non-null locators as sensitive anyway. This remains a lead until a committed URL exists.

## Coverage

Ledger: 16 units. Covered 5. Candidate 11. Blocked 0. Deferred 0.

Covered surfaces: public flood gauge GETs, `POST /api/chat` tool execution, the rate-limiter client-IP rule, `ChatBox` HTML injection, and `apiBase` / `workers_dev` as hardening.

Candidate surfaces each have one findings fingerprint and an empty `unresolved` list: deploy `workflow_run`, datago preview, MQTT bridge (rejected), db status, paid upstreams, CV map retention, CV anonymous write, TLS verification, twin writes, forecast `POST /run`, and the AirLabs script.

Final-clean critic: stop. No mandatory critic was skipped.
