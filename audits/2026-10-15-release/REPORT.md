# NST flagship release audit — 15 October 2026

Scope: this repository and its existing Cloudflare Pages / Workers deployment.
Started from production commit `319cb93` after fast-forwarding the local checkout.

## Release fixes

- Deployment checks out the tested commit for both web and API, accepts completed push runs from this repository only, and rejects a release superseded by main. Public Pages deployment explicitly targets the production branch.
- Shared CCTV detections require a server-side `CV_WRITE_TOKEN` bearer credential. Missing configuration fails closed. Browser gauge analysis remains a local, bounded preview, visibly distinguished from pipeline detections; no writer secret enters the browser.
- CV event bodies and batches are bounded. Malformed detections and invalid confidence/count values are rejected. Camera-index retention follows the 2,000-event ring, and out-of-order timestamps no longer truncate read results.
- Cache computation deadlines apply to every concurrent caller. Late results cannot overwrite a recovered value. Hung background refreshes release their deduplication slot. Failed foreground refreshes retry within a minute rather than freezing the last value for a day. Workers register background refreshes with the initiating request's `waitUntil` lifetime.
- Upstream deadlines include response-body consumption; receiving headers alone no longer disables the deadline. ThaiWater direct requests fall back to the working relay after eight seconds. Dataset previews revalidate every redirect target before fetching it, and their deadlines include streamed body consumption.
- Feed responses recompute elapsed cache age. CORS exposes source/freshness headers and permits authenticated twin mutation preflights. API request bodies have a 256 KiB ceiling. Invalid isochrone coordinates and non-numeric durations are rejected before provider calls.
- Postgres TLS verifies server identity, including when the input URL specifies `sslmode=require`. Private roots can be supplied with `sslrootcert` or `DATABASE_SSL_CA_FILE`. Local explicit non-TLS configuration remains supported.
- Browser smoke tests use explicit API fixtures instead of production feeds/provider quotas. The API-unreachable skip for lens switching has been removed; failure/loading tests still supply their own routes.
- Empty water/rain/air summaries now report UNKNOWN, with a bilingual coverage notice instead of an all-clear. Unclassified gauges with measured overbank conditions still elevate the water summary.
- Worker environment reports production.
- Hono, its Node adapter, WebSocket support, MapLibre, deck.gl and loaders are updated together. The patched unzip library is pinned for affected older transitive ranges. The unused optional Node texture-encoding CLI is excluded: the browser only decodes/renders tiles, and that encoder brought vulnerable image/parser packages. Graphics peer dependencies are explicit and aligned.
- CI audits production dependencies for high/critical advisories and smoke-tests the production build. Both previous feed-dependent browser-test skips are removed.

## Operations

Public sensor availability depends on upstream providers. A responsive service health endpoint establishes deployment availability, not sensor availability. Missing optional provider keys continue to be visible as unavailable feeds.

Trusted CV ingestion stays closed until an operator provisions `CV_WRITE_TOKEN` to an actual trusted pipeline. Browser previews remain functional without it. CV history is held per process/isolate; it is not a durable shared telemetry database.

TLS against a private database needs its real server CA. No database schema or existing local service is changed by this release.

## Validation so far

- API: 698 tests passed and typecheck passed.
- Web: 1,046 unit tests passed after graphics alignment and unknown-coverage fixes.
- Worker dry-run bundle succeeded.
- A read-only `SELECT 1` against the configured database passed with verified TLS.
- Isolated local Workers runtime: 21 live water gauges and 145 live rainfall stations returned HTTP 200 in under one second.

- Final production dependency audit: zero vulnerabilities across 225 production dependencies.
- All 1,785 unit tests passed after dependency alignment; complete typecheck and API/web production builds passed.
- The workbench entry now loads a 199 kB shell and its own page chunk instead of the 3.05 MB map application chunk. The map renderer's required WebAssembly compilation is permitted with the narrow `wasm-unsafe-eval` CSP directive.
- Browser runs now reserve port 5187 and never reuse an existing server. A previous run hit a sibling city's port 5179; that run was discarded. Production-preview tests caught the WebAssembly policy issue before publication.

## Remaining operator action

A private comparison confirmed that the previously published AirLabs credential from commit `c8c785e` still matches the effective local configuration. Its bytes are omitted here. The public Worker has no AirLabs secret and flights remain unavailable there. Revoke/rotate that credential at AirLabs and replace any local deployments that use it. Removing a credential from the current Git tree does not revoke it; this release does not rewrite public Git history or claim provider-side rotation.

## Final local browser validation

The full production-mode browser run passed 31 of 33 cases. After correcting the empty forecast fixture and enabling the existing test-only camera probe, targeted reruns passed the forecast/flood lens switch, repeated zoom commands, and the new UNKNOWN sensor-coverage assertions. All 33 unique cases were validated. Shared geometry fixtures and reduced-motion mode keep headless checks bounded; CI runs the entire suite on the release commit.

## Release gate

The Test workflow runs all 33 browser scenarios against a production-mode build (the existing read-only camera probe is enabled with `VITE_E2E=1` for the zoom regression; deployment does not set that flag), including flood scenarios, Thai/English switching, source catalog controls, mobile layout, data workbench, camera directory, and the operations board. Deployment is gated on that successful workflow and verifies both the actual HTML entry bundle and the API commit. The map renderer, React map wrapper and deck.gl peers are tested together; the wrapper was upgraded after production-preview tests caught its old private-transform access.
