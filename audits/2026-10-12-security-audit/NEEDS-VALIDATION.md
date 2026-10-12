# Needs validation

Source ref `c8c785ef4873d4527c44d407c84f5848ed8a1473`. These six records are `needs_validation`. They have no severity and are not confirmed vulnerabilities. Do not send the local steps to a deployed host, a paid provider, or a shared database.

Order is the order an owner of a public fork should clear them. It is not a severity ranking.

## 1. api.anonymous-keyed-upstream.per-isolate-counter

Anonymous handlers send operator upstream credentials on caller-controlled input, and the 600/min Map is per isolate.

Affected boundary: an anonymous client of the public Hono app, and the operator's Google, Geoapify, Gemini, and AQICN credentials, when those env values are set.

Claimed root cause: unauthenticated routes place server upstream credentials on caller-controlled requests, and the only counters are per-isolate in-memory Maps that do not enforce a shared operator quota. Geocode, places, air quality, Street View Static, and WAQI tiles are uncached. The isochrone cache misses when the snapped coordinate, minutes, or mode changes. Concierge omits the chat length cap and the chat 20/min Map.

### Trace

1. Entrypoint `apps/api/src/index.ts:382` `GET /api/google/geocode`. The public route reads query `q` and calls `fetchGoogleGeocode` with `c.env.GOOGLE_MAPS_API_KEY`. Sibling routes for places, air quality, street view, WAQI tiles, concierge, chat, and isochrone are the same anonymous entry pattern and are registered after the rate-limit middleware.
2. Propagation `apps/api/src/index.ts:272`. The middleware counts `getClientIp` in the module Map and rejects only when that isolate's count for that address reaches 600 in the current 60-second window. Chat has a second Map at 20/min. Concierge does not consult it.
3. Propagation `apps/api/src/adapters/google.ts:85`. An empty `GOOGLE_MAPS_API_KEY` or a blank query returns unavailable and does not call `fetchJsonOrThrow`. Street View image and WAQI return 503 or a local PNG before fetch when their credential is absent. Isochrone returns unavailable before `cached()` when `GEOAPIFY_API_KEY` is absent. Concierge skips `synthesize` when the key is absent, the question is empty, or retrieve returns no hits.
4. Sink `apps/api/src/adapters/google.ts:91`. The keyed URL is the Geocoding API with the operator key and the caller query. Places, Air Quality, and Street View metadata use the same key. Street View Static and WAQI call `fetch` with the operator credential. Isochrone's cache-miss compute fetches Geoapify with `apiKey`. Concierge `synthesize` posts the question to Gemini `generateContent`.

### Evidence

- `apps/api/src/index.ts:242` — `rateLimiter` is a module-level Map. `RATE_LIMIT` is 600. The comment describes a per-IP ceiling for dashboard fan-out, not a provider credit budget.
- `apps/api/src/index.ts:249` — `getClientIp` prefers `cf-connecting-ip`, then the first `X-Forwarded-For` hop, then the shared label `unknown`.
- `apps/api/src/index.ts:383` — geocode passes raw `q` and `GOOGLE_MAPS_API_KEY` into `fetchGoogleGeocode` inside `safeFeed`, with no cache wrapper.
- `apps/api/src/index.ts:385` — places does the same.
- `apps/api/src/index.ts:419` — Street View image returns 503 when `GOOGLE_MAPS_API_KEY` is unset. The later fetch uses `streetViewImageUrl`, which includes the caller `size` value.
- `apps/api/src/index.ts:464` — WAQI returns a local transparent PNG when `AQICN_TOKEN` is unset. With a token the handler fetches `tiles.waqi.info` for the caller `z`, `x`, and `y`.
- `apps/api/src/index.ts:518` — `GET /api/concierge` passes the caller question to `askConcierge` with `GEMINI_API_KEY`. The POST handler does the same. Neither applies the chat limiter or a character cap.
- `apps/api/src/index.ts:612` — `POST /api/chat` enforces `isChatRateLimited` at 20 per address before calling `chat`.
- `apps/api/src/adapters/google.ts:88` — the geocode sink interpolates the caller query and the operator key. Empty key and empty query return on the previous lines.
- `apps/api/src/adapters/google.ts:256` — `streetViewImageUrl` copies `size` into the Street View Static query with no allowlist. The default is `640x400`. One call still produces one image request.
- `apps/api/src/adapters/isochrone.ts:5` — the file states 3,000 free credits/day. The handler does not keep a credit counter.
- `apps/api/src/adapters/isochrone.ts:85` — the 30-minute cache key includes snapped longitude, snapped latitude, minutes, and mode.
- `apps/api/src/lib/cache.ts:2` — module memory is per Worker isolate and empty on cold start.
- `apps/api/src/lib/cache.ts:119` — `cached()` returns stored data without calling compute when the entry is unexpired.
- `apps/api/src/adapters/common.ts:90` — `fetchJsonOrThrow` retries HTTP 429 up to three attempts.
- `apps/api/src/platform/concierge.ts:39` — `synthesize` concatenates the full question into the Gemini prompt. `maxOutputTokens` is 600.
- `apps/api/src/platform/concierge.ts:66` — Gemini runs only when the key is set, the question length is greater than zero, and `citations.length` is greater than zero.
- `apps/api/src/platform/search.ts:115` — terms of length 1 are dropped. A question with no corpus term does not open the Gemini branch.
- `apps/api/src/platform/lessons-climate.ts:23` — the indexed climate lesson summary contains flooding, so a question that includes `flood` can produce citations.
- `apps/api/src/adapters/chat.ts:38` and `:241` — chat caps a message at 1,200 characters and 16 turns before `chatGemini`.
- `apps/api/src/adapters/flights.ts:122` — flights uses the constant cache key `flights-nst`. Caller input does not mint a new upstream URL. This is not the unique-input root.
- `apps/api/src/adapters/aqicn.ts:128` — the station adapter caches under the fixed key `aqicn-nst`. The tile route does not share that cache.

### Blockers

- Target execution was prohibited, so a network-disabled stub of `fetch` was not run to count upstream invocations on the keyed branch versus the empty-key branch.
- Whether the deployed Worker has `GOOGLE_MAPS_API_KEY`, `GEOAPIFY_API_KEY`, `GEMINI_API_KEY`, or `AQICN_TOKEN` set, and whether the provider account has a hard budget that stops calls before this process does, is outside the repository. The in-repo gates already return before fetch when the matching key is empty.

### Resolution

Local: in an isolated process with network disabled, replace global `fetch` with a stub. Call `fetchGoogleGeocode` once with a non-empty query and a dummy `GOOGLE_MAPS_API_KEY` and once with the key unset; expect one stub call and then zero. Call `fetchIsochrone` twice with latitudes 0.001 apart, the same longitude, minutes, and mode, and a dummy `GEOAPIFY_API_KEY`; expect two stub calls. Call it a third time with the first coordinate inside the TTL; expect no additional stub call. Call `askConcierge` with `GEMINI_API_KEY` set for a question that is only unmatched characters, then for a question containing a corpus term such as `flood`; expect a Gemini stub call only on the second. Do not send these requests to the providers or to the public Worker.

Deployment: an owner checks the Worker secret list for those four names, and checks the provider console for a hard project budget. Record whether those secrets are present. Do not send traffic at the public host.

## 2. forecast.main:unauthenticated-post-run

Forecast `POST /run` schedules model work with no credential.

Affected boundary: a client who can reach the forecast port, and the forecast process's database writes to `twin_state`, including `precipitation.forecast` for object id `city`.

Claimed root cause: `trigger_run` schedules `_do_run` with no authentication, and the server listens on all interfaces, so a client who can reach the port can queue forecast computation and `twin_state` upserts.

### Trace

1. Entrypoint `apps/forecast/main.py:69` `trigger_run`. `POST /run` takes no credentials, schedules `_do_run`, and returns status `queued`.
2. Propagation `apps/forecast/main.py:39` `_do_run`. The task calls `get_pool` and then `run_all_forecasts`. `get_pool` raises when no database URL is set, after the HTTP response has already been sent.
3. Propagation `apps/forecast/timesfm_runner.py:208` `run_all_forecasts`. The run loads TimesFM or falls back to Open-Meteo. TimesFM inference is bounded by a 120 second timeout and is not limited to one in-flight call.
4. Sink `apps/forecast/timesfm_runner.py:165` `_upsert_forecasts`. Forecast points are inserted into `twin_state`. The Open-Meteo fallback uses the same table.

### Evidence

- `apps/forecast/main.py:71` — `asyncio.create_task(_do_run())` runs on every POST with no lock and no principal check.
- `apps/forecast/main.py:78` — uvicorn is started with host `0.0.0.0` when this file is the main module.
- `apps/forecast/render.yaml:2` and `:12` — the Render manifest declares a service of type `web` whose start command is `python main.py`.
- `apps/forecast/render.yaml:16` — `DATABASE_URL` is declared with `sync: false`, so the manifest does not contain a connection string.
- `apps/forecast/db.py:23` — `get_pool` reads `SUPABASE_DB_URL`, `SUPABASE_DATABASE_URL`, or `DATABASE_URL` and raises when all are unset.
- `apps/forecast/timesfm_runner.py:65` — one configured output is `precipitation.forecast` for object id `city`.
- `apps/forecast/timesfm_runner.py:189` and `apps/forecast/openmeteo_flood.py:105` — the Open-Meteo fallback also inserts `precipitation.forecast`.
- `.github/workflows/deploy.yml:107` — the CI deploy job publishes the Cloudflare worker. It does not start the forecast service.

### Blockers

- Source does not show that a running forecast process is reachable from a lower-trust network. `main.py` binds `0.0.0.0` and `render.yaml` declares a Render web service, but the repo deploy workflow does not publish that service, and no live attachment was observed.
- The forecast body and `twin_state` writes run only after `get_pool()` finds a database URL. Whether any host of this code has that variable set is not in the repository.

### Resolution

Local: load the FastAPI app and send `POST /run` with an empty JSON body and no `Authorization` header using an in-process ASGI client. Record that the response is status `queued` and that a task was scheduled. Use a throwaway database URL only if you also need to see a `twin_state` insert. Do not point it at a shared database and do not send the request to a deployed host.

Deployment: the owner inspects the host that runs `python main.py`, including any Render service created from `render.yaml`, and records whether the listener is reachable from outside that host and whether any platform access policy sits in front of `POST /run`. Do not send a forecast trigger to a deployment that shares a production database.

## 3. github.workflows.deploy-api.workflow_run.untrusted-checkout

Deploy API job may build `workflow_run` head SHA with the Cloudflare token.

Affected boundary: the `deploy-api` job, `secrets.CLOUDFLARE_API_TOKEN`, and the git tree checked out as `github.event.workflow_run.head_sha`.

Claimed root cause: `deploy-api` trusts `workflow_run.head_sha` inside a secrets-bearing job whose only branch gate is `branches: [main]` and whose `if` condition accepts every successful `workflow_run`.

### Trace

1. Entrypoint `.github/workflows/test.yml:4`. The Test workflow runs on `pull_request` as well as on push to `main`.
2. Propagation `.github/workflows/deploy.yml:6`. Deploy starts when Test completes on branches `main`, with no same-repository or `event == push` condition in the trigger.
3. Propagation `.github/workflows/deploy.yml:93`. `deploy-api` checks out `github.event.workflow_run.head_sha`, falling back to `github.sha`.
4. Sink `.github/workflows/deploy.yml:111`. The deploy step runs `wrangler deploy` in that checkout with `CLOUDFLARE_API_TOKEN` in the step environment. `pnpm install` of the same tree is the previous step.

### Evidence

- `.github/workflows/test.yml:4` — Test is triggered by `pull_request` with no branch limit.
- `.github/workflows/deploy.yml:88` — `deploy-api` runs for `workflow_dispatch` or any `workflow_run` whose conclusion is success.
- `.github/workflows/deploy.yml:93` — the checkout ref is the triggering workflow's head SHA.
- `.github/workflows/deploy.yml:111` — `CLOUDFLARE_API_TOKEN` is passed from secrets into the deploy step that operates on the checked-out tree. The token appearance is a secret reference, not a literal. The pages job does not check out `head_sha`. There is no `pull_request_target`.

### Blocker

GitHub's hosted rule for `on.workflow_run.branches: [main]` when the triggering Test run is a pull request, including a fork pull request whose head branch is named `main`, is not in this repository. Source does not show whether that event is emitted or whether the resulting `deploy-api` job receives secrets.

### Resolution

Local: in a disposable private repository that copies only these two workflow files and a dummy non-production secret marker, open a pull request from a fork branch named `main` that changes a harmless file. Record whether the deploy workflow starts and which SHA the `deploy-api` checkout step logs. Cancel the job before `wrangler deploy`. Do not use the production Cloudflare token.

Deployment: an owner reviews Actions history for this deploy workflow and records whether any run has `workflow_run.event` `pull_request` or a `head_repository` other than this repository. Do not print secret values. If no such run exists, use the disposable repository above rather than opening a pull request against the production project.

## 4. datago-preview.redirect-without-final-host-check

Preview fetch allowlists the initial host and follows redirects without checking the final URL.

Affected boundary: an unauthenticated caller of `GET /api/datago/preview`, and the body returned as preview rows. An off-allowlist body is read only if an allowlisted hop redirects to a host that fails `isAllowedHost`.

Claimed root cause: `previewHandler` passes the caller `url` query to `fetchPreview`. `isAllowedHost` runs on the initial WHATWG hostname only. `fetch` uses `redirect: follow`, and the subsequent body read returns a parsed preview of the final response without reading `resp.url` or calling `isAllowedHost` again.

### Trace

1. Entrypoint `apps/api/src/index.ts:528` `GET /api/datago/preview`, handled by `previewHandler`.
2. Propagation `apps/api/src/adapters/datagoDetail.ts:413`. The `url` and `format` query values are passed to `fetchPreview` with no other host check.
3. Propagation `apps/api/src/adapters/datagoDetail.ts:288`. The parsed URL must be `https` and `isAllowedHost(u.hostname)` must pass. The suffix `.go.th` matches any such hostname. Non-https URLs and other hosts return `blocked_host` before fetch.
4. Sink `apps/api/src/adapters/datagoDetail.ts:302`. `fetch` is called on the original URL with `redirect: follow`. The body is later parsed and, for CSV or JSON, returned as preview rows. `resp.url` is not read and `isAllowedHost` is not called again.

### Evidence

- `apps/api/src/adapters/datagoDetail.ts:176` — `isAllowedHost` accepts `ALLOWED_HOSTS` and any name that ends with `.go.th`.
- `apps/api/src/adapters/datagoDetail.ts:285` — non-https URLs and hosts that fail `isAllowedHost` return `blocked_host` before any fetch.
- `apps/api/src/adapters/datagoDetail.ts:296` — the fetch options set `redirect` to `follow`. Nothing after this call inspects `resp.url`.
- `apps/api/src/adapters/datagoDetail.ts:347` — a CSV or JSON format, including the caller format hint, returns parsed preview rows. The read is capped by `MAX_BYTES` and the rows by `MAX_ROWS` and `MAX_CELL_CHARS`.
- `apps/api/src/adapters/datagoDetail.test.ts:121` — `fetchPreview` tests stub `fetch` and never supply a redirect.

This does not identify a cloud-metadata target.

### Blocker

No source file shows an allowlisted https host whose response redirects the preview fetch to a host that fails `isAllowedHost`.

### Resolution

Local: in an isolated loopback process, serve a local TLS certificate whose hostname ends in `.go.th` and respond with a 302 to a second loopback HTTP server that returns a small JSON body of dummy data. Call `fetchPreview` with that first URL and format JSON. Record whether `preview` contains the second body. Use dummy data only and do not contact any external host. This shows the follow behavior. It does not show that a real host ending in `.go.th` redirects off-list.

Deployment: on a non-production deployment, have an operator log only the final host of one preview fetch whose initial URL is a catalog resource URL already returned by dataset-detail, and compare that host with `isAllowedHost`. Do not point the preview at an address outside that catalog resource.

## 5. api.cctv.cv-events:latestByCamera-no-eviction

CV `latestByCamera` keeps every distinct `cameraId` in isolate memory.

Affected boundary: unauthenticated `POST /api/cctv/cv-events`, and one Worker isolate's module memory for that isolate's lifetime. The Map does not span isolates.

Claimed root cause: `recordCvEvent` always executes `latestByCamera.set(event.cameraId, event)` and never deletes keys, while `validateCvEvent` and the POST handler accept an unbounded `detections` array, an unbounded `counts` object, an unbounded `cameraId` string, and an unbounded JSON batch.

### Trace

1. Entrypoint `apps/api/src/index.ts:674`. The handler parses JSON with no credential check. An array body becomes many messages.
2. Propagation `apps/api/src/index.ts:686`. Each message that passes validation is recorded. There is no cap on how many elements one body may contain.
3. Propagation `apps/api/src/lib/cvEvents.ts:79` `validateCvEvent`. The returned event keeps the trimmed `cameraId` and a mapped copy of every detection. `detections` length, class length, `snapshotUrl`, `model`, and the `counts` object are not limited.
4. Sink `apps/api/src/lib/cvEvents.ts:95` `latestByCamera.set`. After the ring shifts at 2000 entries, the full event is stored under `cameraId`. The Map has no max size, TTL, or delete.

### Evidence

- `apps/api/src/lib/cvEvents.ts:22` — `MAX_EVENTS` is 2000 and applies to the ring array.
- `apps/api/src/lib/cvEvents.ts:28` — `latestByCamera` is a module-level Map. Nothing in the module clears it.
- `apps/api/src/lib/cvEvents.ts:44` — `cameraId` must be a non-empty string after trim. There is no maximum length.
- `apps/api/src/lib/cvEvents.ts:50` — `detections` must be an array. There is no length check.
- `apps/api/src/lib/cvEvents.ts:57` — when `counts` is a non-array object, `Object.assign` copies its properties with no key or size limit.
- `apps/api/src/lib/cvEvents.ts:93` — `ring.shift` runs only when the ring length is at least 2000. That does not delete the matching Map key.
- `apps/api/src/index.ts:246` — `RATE_LIMIT` is 600 requests per minute per IP. It counts requests, not retained bytes.
- `apps/api/src/index.ts:681` — an array body is iterated in full.
- `apps/api/src/lib/cache.ts:2` — module memory lives for the isolate lifetime, minutes to hours per region.
- `docs/ARCHITECTURE.md:163` — the API runs as a Cloudflare Worker in production and as a long-lived Node process for local development.
- `.github/workflows/deploy.yml:109` and `:117` — `wrangler deploy`, then a curl of workers.dev `/api/health` with no credential.
- `apps/web/src/lib/apiBase.ts:6` — the dashboard's default production API host is the workers.dev worker.
- `apps/api/wrangler.toml:6` — `workers_dev` is enabled. The file does not set a request-body limit or an isolate memory limit.
- `apps/api/src/node.ts:55` — the Node entry defaults `HOST` to `127.0.0.1`.

### Blockers

- Cloudflare's incoming request body limit is not in the repository, and `wrangler.toml` does not set one. Source shows the fields are uncapped and does not show the accepted byte size.
- The isolate memory ceiling and whether growth evicts that isolate are not in the repo. This Map is not a fleet-wide store and is not evidence of a remote stop of the whole city service.
- A long-lived Node heap would be a single shared process, but the Node entry, launchd plist, and `run-nst-api.sh` bind `127.0.0.1`. Remote reachability of that loopback process is not established in source.

### Resolution

Local: call `validateCvEvent` and `recordCvEvent` for 2001 objects that use distinct short `cameraId` values, a fixed ISO timestamp, and an empty `detections` array. Assert the ring length stays 2000 and `latestByCamera.size` is 2001, and that `getLatestByCameraId` still returns the first `cameraId` after the ring has shifted it. Use only those tiny objects. Do not allocate large `detections` arrays, do not open a socket, and do not send the request to a deployed host. This shows missing Map eviction. It does not show the platform body cap or the isolate memory ceiling.

Deployment: the owner reads the Cloudflare Workers plan limits for this account, specifically the incoming request body size and the per-isolate memory limit, and compares those numbers with the uncapped fields accepted by this route. Do not POST a large body to the production worker and do not try to exhaust an isolate.

## 6. status-json.database-and-broker-locators

Unauthenticated status JSON serializes database host, username, database name, error text, and MQTT broker URL.

Affected boundary: `GET /api/db/status` and the `mqtt` object on `GET /api/health/detailed`, when a database URL or broker URL is present in the process environment. The password is not a field of `dbUrlMeta`, `twinDbStatus`, or `getMqttStatus`.

Claimed root cause: `twinDbStatus` copies `dbUrlMeta` host, port, database, and user plus `lastConnectionError` into the JSON for both the unconnected and connected returns. `getMqttStatus` copies `ws.url` to `brokerUrl`. Neither function copies the database password or `MQTT_PASSWORD`. `user` is only the URL username.

### Trace

1. Entrypoint `apps/api/src/index.ts:237` `GET /api/db/status`. The route returns `twinDbStatus()` as JSON and sets `Cache-Control: no-store`. There is no auth check. This route is registered before the rate-limit middleware.
2. Propagation `apps/api/src/lib/twinDb.ts:145` `twinDbStatus`. `databaseUrl()` supplies the process.env URL and `dbUrlMeta` parses host, port, database, and user. It does not read the URL password.
3. Sink `apps/api/src/lib/twinDb.ts:152`. The JSON includes host, port, database, user, and error. The same keys are returned on the connected path. `GET /api/health/detailed` (`index.ts:198`) separately includes `mqtt` from `getMqttStatus`, whose `brokerUrl` is `ws.url`.

### Evidence

- `apps/api/src/lib/twinDb.ts:59` — `dbUrlMeta` returns `configured`, `host`, `port`, `database`, `user`, `isSupabase`, and `sslMode`. `user` is `decodeURIComponent` of the URL username. The function does not read the URL password.
- `apps/api/src/lib/twinDb.test.ts:99` — a URL containing a userinfo password is asserted to yield user `alice` and has no password field. That assertion is a username parse, not a password disclosure.
- `apps/api/src/lib/twinDb.ts:183` — on query failure the same host, port, database, and user are returned with `error` set to `err.message`. The raw URL is not concatenated.
- `apps/api/src/adapters/mqttBridge.ts:56` — `getMqttStatus` returns `connected`, `messageCount`, `lastError`, and `brokerUrl` from `ws.url`. It does not return `MQTT_PASSWORD`.
- `apps/api/src/adapters/mqttBridge.ts:154` — the broker password is written only into the MQTT CONNECT packet when password bytes exist.
- `apps/api/wrangler.toml:18` — committed Worker vars set `ENVIRONMENT` only. No database URL or MQTT broker URL is assigned.
- `apps/api/src/node.ts:55` — the Node listener defaults to `127.0.0.1`, and the MQTT bridge starts only when `MQTT_BROKER_URL` is set. `index.ts` does not start the bridge.

### Blocker

No committed configuration assigns `DATABASE_URL`, `SUPABASE_DB_URL`, `SUPABASE_DATABASE_URL`, or `MQTT_BROKER_URL`, so it is unknown whether a lower-trust response contains a non-null host, username, database, error, or `brokerUrl`. The password is not one of those fields.

### Resolution

Local: call `dbUrlMeta` and `twinDbStatus` with a dummy `postgresql://audituser:auditpass@127.0.0.1:1/auditdb` and call `getMqttStatus` after constructing a local WebSocket to `ws://127.0.0.1/mqtt` that never connects outward. Record the JSON keys. The expected field set is host, user, database, and `brokerUrl`, with the password absent from the object. `user` should be the username `audituser`. This confirms field selection only.

Deployment: the owner requests `GET /api/db/status` and `GET /api/health/detailed` on the listener they treat as reachable and records whether `host`, `user`, `database`, `error`, and `mqtt.brokerUrl` are null. Do not paste a non-null username or broker URL into a shared ticket. Do not treat a non-null username as a password.
