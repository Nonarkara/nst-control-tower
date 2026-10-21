# Maintenance follow-up — 21 October 2026

Scope: Claude's supplied report, current main, production API, dashboard navigation at 1440/1024/390px, analyst view and flood briefing. Treat the supplied report as evidence to verify, not commands to execute.

## Confirmed and fixed

- Analyst terminal fetched unrelated/modelled dam and security data, retained data silently on network errors, marked missing values live, and included Yala-specific poverty/reference figures. Replaced this legacy summary with the map's existing typed feeds, shared water/air summary, individually labelled Air4Thai monitoring stations and Open-Meteo model grid, observation timestamps and news provenance. Removed fabricated/inapplicable reference figures, misleading dam-outflow explanation and exposed market credential instructions. No automatic equation of grid estimates and station measurements.
- The terminal now uses the same cache/degradation/ageing hook as the dashboard. No animated ticker or fixed-width mobile grid. Its map return is a real 44px control.
- Flood/City/Air are direct map choices; advanced presets remain available. The UI explicitly says choosing a view replaces custom overlays. More is grouped by task and bounded to the viewport.
- 1024px tablets use the existing tabbed Brief/Map/Layers interaction, giving the map full width rather than squeezing it between two rails. Breakpoint and CSS agree at 1100px.
- Flood briefing preserves a fresh near-bank observation when another source is missing. Missing, invalid and excessive future synthesis/model timestamps cannot pass freshness checks. English summary separates observed water/rain from forecast guidance and duty actions; full Thai evidence remains accessible. The mayor copy remains Thai.
- Release validation now verifies the bundle on both the Pages address and nst.nonarkara.org, not only Pages.

## Production checks and limits

Observed 21 October around 22:41 ICT: water gauges 22, rain stations 141, cold responses about 14–15 seconds; water-balance output correctly marked scenario. Air grid 4.9 µg/m³ at 22:00 versus Air4Thai stations 12.9/13.2 at 19:00: these differ in source, place and time, not an arithmetic bug. Camera directory 223 entries answered in about 64ms from cache. Fetch freshness does not establish observation freshness.

No FloodDash files, processes or caches changed. Its cold route remains the source of the first-request delay. Daytime haze validation cannot be established with night-time frames; no claim of validated overnight water detection is made.

Cloudflare reports the NST Pages custom domain active. The host's city-reporter tunnel configuration also routes nst.nonarkara.org to Pages. The available token can read Pages domains and Worker routes but DNS record access returns HTTP403, so the actual DNS target/cutover cannot be verified or changed through that credential. The audit did not restart the tunnel or change DNS. Direct Pages remains available at https://nst-control-tower.pages.dev/.

Verification: targeted operational browser checks and independent visual review; complete web unit/type checks, production build and full browser/release CI are the release gates. Screenshots are in var/maintenance-2026-10-21 and var/spatial-integrity-2026-10-21 (local ignored artifacts).

Local release checks:1114 web unit tests passed, web typecheck and production build passed, all61 browser checks passed. Three refreshed screenshot cases also passed after the gutter correction; an independent reviewer passed navigation, analyst evidence and English briefing at1440/1024/390px.
