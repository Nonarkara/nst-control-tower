# Findings detail — confirmed medium

Source ref `c8c785ef4873d4527c44d407c84f5848ed8a1473`. Profile `standard`. These three records are `confirmed` with `overall_severity` `medium`. The low CV record is in `REPORT.md` only. Line numbers are the audited tree. No credential bytes are copied here. Target code was not executed.

## infra/run-nst-api.sh:AIRLABS_API_KEY

Tracked Node launch script assigns a non-placeholder AirLabs API key.

### Trace

1. Entrypoint `infra/run-nst-api.sh:11`. The tracked launch script assigns `AIRLABS_API_KEY` before it starts the Node API.
2. Propagation `apps/api/src/node.ts:47` `loadDotenv`. Dotenv writes a key only when `process.env` already lacks it, so the shell export remains the process value.
3. Propagation `apps/api/src/node.ts:127` `app.fetch`. The bindings object built at `node.ts:69`, including `AIRLABS_API_KEY`, is passed as the Hono env on every request.
4. Propagation `apps/api/src/index.ts:379` `GET /api/flights`. The route forwards `c.env.AIRLABS_API_KEY` into `fetchFlights`.
5. Sink `apps/api/src/adapters/flights.ts:141` `fetchFlightsInner`. The binding is interpolated as the `api_key` query parameter on the AirLabs schedules request.

### Evidence

- `infra/run-nst-api.sh:11` — tracked assignment of `AIRLABS_API_KEY` to a non-placeholder credential. The value is UUID-shaped and sits beside `ENVIRONMENT=production`. `apps/api/.env.example` leaves provider keys empty.
- `README.md:46` — the project states that the repository contains zero secrets and that every key is an environment variable.
- `docs/DATA-SOURCES.md:44` — the security note says the repo contains no secrets, `.env` files are git-ignored, and only `.env.example` is tracked. Lines 27–28 say keys are read from Worker secrets or `apps/api/.env`.
- `.gitignore:5` — `.env` and `.env.*` are ignored, with an exception only for `.env.example`. `infra/run-nst-api.sh` is tracked.
- `apps/api/src/node.ts:47` — an already-exported environment variable is left in place when `.env` is loaded.
- `apps/api/src/adapters/flights.ts:141` — the env value is placed in the `api_key` query parameter. The adapter comment at `flights.ts:8` sizes the feed against a free tier of 1,000 requests per month.
- `apps/api/src/index.ts:230` — `GET /api/health/keys` returns a configured boolean for `AIRLABS_API_KEY` and does not return the secret.

### Principal and resource

Dummy principal: a repository reader who is not the AirLabs account owner. Dummy resource: the operator AirLabs client credential used as `api_key` on the schedules request. The Node listener in this script binds `HOST=127.0.0.1`.

### Reproduction

Native interface: read the tracked file. Do not copy the credential into notes or a second file.

1. Open `infra/run-nst-api.sh` and inspect line 11. Confirm the assigned `AIRLABS_API_KEY` is a non-placeholder credential: it is UUID-shaped, and `apps/api/.env.example` leaves provider keys empty.
2. Compare that assignment with `README.md:46` and `docs/DATA-SOURCES.md:27-28` and `:44-45`.
3. Follow the value through `apps/api/src/node.ts:47` and `node.ts:69-127` into `apps/api/src/index.ts:379` and `apps/api/src/adapters/flights.ts:141`.

### Observed result

`infra/run-nst-api.sh:11` contains a non-placeholder `AIRLABS_API_KEY` assignment in a git-tracked file. `loadDotenv` will not replace that exported value, and `fetchFlights` interpolates it as `api_key`. The raw credential was not copied into this record and AirLabs was not called.

Invariant: a tracked launch script is not a secret store. The documented store is the operator environment or a gitignored `.env`.

### Conditions and containment

- The reader has repository read access and no AirLabs operator role.
- `infra/run-nst-api.sh` is tracked. `.gitignore` does not cover it. The script exports the key before `pnpm start:node`.
- Containment: the demonstrated client is the free schedules quota described in the adapter. The script does not include Cloudflare, database, or other provider credentials.

### Remediation and regression

Remove the `AIRLABS_API_KEY` assignment from the tracked script. Inject the key only through the launchd environment or a gitignored `apps/api/.env`. Rotate the AirLabs key, because the credential is in the published tree, including history. Keep `/api/health/keys` limited to presence.

Regression: read `infra/run-nst-api.sh` and assert it does not assign `AIRLABS_API_KEY` and does not contain a UUID-shaped token.

## api.twin:anonymous-city-forecast-write

Anonymous twin writes become the city precipitation forecast.

### Trace

1. Entrypoint `apps/api/src/routes/twin.ts:143` `POST /state`. The handler parses `objectId`, `metric`, `value`, and `source` and calls `writeTwinState`. No credential is read. The same router writes at `twin.ts:45`, `twin.ts:73`, and `twin.ts:91`.
2. Propagation `apps/api/src/lib/twinStore.ts:213` `writeTwinState`. The point is appended to `stateSeries` before `getDb`. `dbWriteState` runs only when that module is loaded and returns immediately when the pool is absent.
3. Propagation `apps/api/src/routes/twin.ts:183` `GET /predictions`. Predictions load `objectId` `city` and metric `precipitation.forecast` for the last two hours and map each stored value to `p50`, with no source filter (`twin.ts:197`).
4. Sink `apps/web/src/components/PredictivePanel.tsx:182`. The panel header source is the literal `timesfm·zs`. The fetch effect calls `onAlert` when the maximum `p50` for a metric exceeds its `alertThreshold`.

### Evidence

- `apps/api/src/index.ts:272` — the only `/api` middleware after CORS is the 600/minute IP limiter. It does not identify a writer.
- `apps/api/src/index.ts:646` — `app.route` mounts the twin router at `/api/twin` with no auth wrapper.
- `apps/api/src/routes/twin.ts:45` — `POST /objects` calls `upsertTwinObject` with the caller's properties.
- `apps/api/src/routes/twin.ts:73` — `DELETE /objects/:id` calls `deleteTwinObject` for the path id. The store removes the in-memory object before the database result.
- `apps/api/src/routes/twin.ts:91` — `POST /relations` stores `subjectId`, `predicate`, and `objectId` from the body.
- `apps/api/src/routes/twin.ts:197` — each prediction horizon point sets `p50` to the stored twin state value.
- `apps/api/src/lib/twinStore.ts:229` — `getTwinState` reads SQL only when `dbReady` is true. Otherwise it filters `stateSeries` and does not filter on `source`.
- `apps/api/src/lib/twinDb.ts:13` — `getPg` returns null when `process.versions.node` is missing, so the Worker process check skips `pg`.
- `apps/api/src/lib/twinDb.ts:322` — `dbWriteState` returns without writing when `getPool` is null.
- `apps/api/src/lib/twinDb.ts:334` — `dbGetState` selects `twin_state` by object id, metric, and time. The SQL has no source predicate.
- `apps/api/wrangler.toml:6` — `workers_dev` is true. The file does not set a database URL.
- `.github/workflows/deploy.yml:117` — CI curls the deployed worker `/api/health` with no credential. The workflow does not configure Cloudflare Access.
- `apps/web/src/components/PredictivePanel.tsx:153` — `onAlert` fires when the maximum `p50` is greater than `alertThreshold`. `precipitation.forecast` uses 50.
- `apps/web/src/lib/railSections.ts:97` — `predictive-panel` is mounted only on the intelligence lens. The predictions API itself is not lens-gated.
- `apps/web/src/components/SituationDigest.tsx:72` — a non-empty `forecastAlerts` set renders `SITUATION ALERT`.
- `apps/web/src/App.tsx:1059` and `:2802` — `handleForecastAlert` fills `forecastAlerts`, and the map renders a forecast alert chip.
- `apps/web/src/components/BuildingCard.tsx:87` and `:102` — the building card prints related sensor names and the numeric twin state for the picked building.

### Principal and resource

Dummy principal: any client that can reach the API process. Dummy resource: twin object `city`, metric `precipitation.forecast`, presented to other readers of that same process as the municipal forecast series.

Dummy body, not sent:

```json
{"objectId":"city","metric":"precipitation.forecast","value":1,"source":"dummy"}
```

### Reproduction

Native interface: read the handlers. Do not POST to a deployed host.

1. Read the `/api` middleware in `apps/api/src/index.ts` and the mount of the twin router. The handlers run after CORS and the IP limiter only.
2. Read `POST /state`. It requires `objectId`, `metric`, a numeric `value`, and `source`, then calls `writeTwinState` with the server clock as `time`.
3. Read `writeTwinState`. The point is pushed onto `stateSeries` before `getDb`.
4. Read `GET /predictions` and `getTwinState`. With `dbReady` false, the city `precipitation.forecast` query returns that point's value as `p50`. Neither the memory filter nor `dbGetState` filters on `source`.
5. Read `PredictivePanel`'s header source `timesfm·zs`, the `p50` alert comparison, `App.tsx` `handleForecastAlert`, and `SituationDigest`.

### Observed result

`POST /state` has no credential check. `writeTwinState` appends the dummy point. When `dbReady` is false, `GET /predictions` includes it as `precipitation.forecast` `p50` 1. `PredictivePanel` presents that horizon under the literal source `timesfm·zs`. The value 1 stays below the alert threshold of 50, so the warning chip is not implied for this body. The same handler accepts any JSON number, and a `p50` above 50 calls `onAlert`.

Invariant: public clients may read environmental feeds. They may not insert the series the dashboard presents as the municipal TimesFM forecast.

### Conditions and containment

- The caller is unauthenticated. The route does not require an API key, session, or Cloudflare Access assertion.
- On a process where `dbReady` is false, the next predictions read on that same process or isolate returns the memory point. When Node has a connecting `DATABASE_URL`, `SUPABASE_DB_URL`, or `SUPABASE_DATABASE_URL`, `writeTwinState` also inserts `twin_state`.
- Predictions keep points from the last two hours. The handler stamps `time` as now.
- The warning chip, `onAlert`, and `SituationDigest` mount when a viewer opens the intelligence lens. Any client can still `GET /api/twin/predictions` without opening the lens.
- Containment: Worker `stateSeries` is isolate-local. The manifest has no database URL and no active KV or Durable Object binding. The write does not operate a physical control.

### Remediation and regression

Require a server-side writer credential on `POST /api/twin/objects`, `DELETE /api/twin/objects/:id`, `POST /api/twin/relations`, and `POST /api/twin/state`. Fail closed when the credential is unset. Leave GET routes open.

Regression: with the token unset or with `Authorization` absent or wrong, those four methods return 401 and do not call `upsertTwinObject`, `deleteTwinObject`, `addTwinRelation`, or `writeTwinState`. A matching `Authorization: Bearer` token still reaches the existing field checks. `GET /predictions` stays unauthenticated.

## twinDb.getPool.ssl.rejectUnauthorized.false

Twin Postgres pool accepts any TLS certificate.

### Trace

1. Entrypoint `apps/api/src/node.ts:83`. The Node server calls `initTwinDb` before it serves traffic.
2. Propagation `apps/api/src/lib/twinDb.ts:109` `initTwinDb`. It awaits `getPg`, which imports `pg` only when `process.versions.node` is set, then calls `getPool` with the configured database URL.
3. Propagation `apps/api/src/lib/twinDb.ts:80` `shouldUseSsl`. When `DATABASE_SSL` and `SUPABASE_DB_SSL` are unset, any `sslmode` other than `disable` or `allow` returns true, including `verify-full`. A Supabase host returns true when that check does not.
4. Sink `apps/api/src/lib/twinDb.ts:97` `getPool`. The only `pg.Pool` constructor sets `ssl` to `{ rejectUnauthorized: false }` when `shouldUseSsl(url)` is true, and `undefined` otherwise.

### Evidence

- `apps/api/src/lib/twinDb.ts:97` — `ssl` is `{ rejectUnauthorized: false }` whenever `shouldUseSsl(url)` is true. No other `pg.Pool` constructor appears in the repository.
- `apps/api/src/lib/twinDb.ts:80` — `sslmode` values other than `disable` and `allow`, including `verify-full`, return true and therefore use the non-verifying `ssl` object.
- `apps/api/src/lib/twinDb.test.ts:182` — the unit test expects `shouldUseSsl` to return true for a localhost URL whose `sslmode` is `verify-full` when no SSL env override is set.
- `apps/api/src/node.ts:83` — the Node entry calls `initTwinDb`.
- `apps/api/src/lib/twinStore.ts:69` — `getDb` calls `initTwinDb`, so twin reads and writes use the same pool.
- `apps/api/.env.example:21` — the documented Supabase setup sets `DATABASE_SSL=true`, which selects the non-verifying branch.

### Principal and resource

Dummy principal: an on-path principal between the Node API and Postgres. Dummy resource: the database startup password and the twin queries on that connection. Configurations that select the branch: `DATABASE_SSL=true` with a Supabase pooler hostname, and `postgresql://db.example:5432/postgres?sslmode=verify-full`.

### Reproduction

Native interface: read the pool constructor. Do not open a TLS connection.

1. Read `getPool`, `shouldUseSsl`, and `getPg` in `apps/api/src/lib/twinDb.ts`.
2. Read the `initTwinDb` call in `apps/api/src/node.ts` and the `getDb` call in `apps/api/src/lib/twinStore.ts`.
3. Confirm there is a single `pg.Pool` constructor and that a true `shouldUseSsl` result, including `sslmode=verify-full`, sets `rejectUnauthorized` to false.

### Observed result

The only `pg.Pool` uses `ssl: { rejectUnauthorized: false }` whenever `shouldUseSsl` is true, and `shouldUseSsl` returns true for `sslmode=verify-full` when no explicit SSL env override is set. No TLS handshake was run.

Invariant: a TLS connection to Postgres verifies the server certificate before the client sends the database password or twin queries.

### Conditions and containment

- The Node process can import `pg` and has a database URL for which `shouldUseSsl` returns true. `getPg` does not construct a pool when `process.versions.node` is absent or the `pg` import throws.
- The attacker can intercept the TCP path between that Node process and the database host.
- Containment: the attacker is not a remote internet client without that network position. An explicit `DATABASE_SSL=false` leaves the pool without the `ssl` option; that override is hardening, not this result.

### Remediation and regression

At `getPool`, verify the server certificate. Keep `rejectUnauthorized` true for every `shouldUseSsl` branch, including `sslmode=verify-full` and Supabase hosts. Load a private CA from configuration when the host chain is not in the default trust store.

A bare assignment of `rejectUnauthorized: true` without that CA is not a safe patch for the documented Supabase pooler path. This run does not change `twinDb.ts`.

Regression, when a CA path exists: a pool built for `sslmode=verify-full` sets `rejectUnauthorized` true, and a test fixture with an untrusted certificate fails the handshake. Do not point that test at a shared database.
