# News incident classification — 30 October 2026

The live mayor desk at 00:37 ICT labelled Bangkok Post’s “‘Sin tax’ revenue shake-up draws fire” as an Incident. The news adapter matched the word “fire”, assigned EM and boosted its news priority. This was a news classification error; hydrological readings and grades were independent.

Reproduced with the original headline: the regression expected no EM and failed. The correction removes draw/draws/drawing/drew/drawn fire only from emergency matching when business or criticism context supports the figurative reading. Explicit armed encounter context and ambiguous phrases retain EM. Separate physical fires and other incident evidence remain available to the classifier. Other tags and the publisher’s headline are preserved. This remains a bounded heuristic correction, not semantic validation of every story or translation.

Verification: 99 focused news/mayor tests and API type checking passed. Independent read-only review requested literal incoming-fire controls; tests now cover patrol, police, tax officers, ambiguous convoy language, and a separate warehouse fire. Reviewer approved the final scoped correction. No new provider requests, UI geometry, source clocks, service configuration or observation grading changed.

Live checks before release: deployed 8bc450d unchanged. Readiness 200 in 2.4s, mayor API 200, public mayor route 200. Python’s default user agent first received Cloudflare 1010/403; bounded retry with the audit user agent succeeded. This was not reported as a service outage. Mayor returned an older edge snapshot with all parts explicitly downgraded to unknown, retaining its original 17:37Z generation and station clocks. Feed availability is not complete coverage or an all-clear. Evidence: var/continue-2026-10-29T1757Z.

Release and rendered verification are recorded in the durable continuation evidence after the existing CI/deployment gates complete. The unrelated untracked playwright.tmpport.config.ts remains untouched.
