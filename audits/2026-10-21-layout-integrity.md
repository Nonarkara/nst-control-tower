# Layout integrity audit — 21 October 2026

Scope: NST dashboard shell, mobile Brief, shared panel headers, lens/layer palette, water-balance identities, village-risk summaries and official Facebook panel. Shared municipal design standard updated at `/Users/axiom/Projects/_docs/DESIGN.md`; repository policy is `docs/VISUAL-INTEGRITY.md`.

Geometry test: “Why is this here, why this size, and why this far from that?” The grid alone is not a reason.

## Findings and corrections

- Secondary mobile weather/context occupied several blocks between the operational headline and evidence. It is now an explicit, initially closed disclosure. Weather, forecast and city counters remain available together.
- Brief tools stretched arbitrarily and could wrap. Related tools now retain label-sized widths, 44px touch targets and one deliberate internally scrolling group. Feed status labels no longer stretch across the full row.
- Panel titles competed with independently wrapping provenance/freshness badges. Titles now lead; related metadata and actions have their own groups with long-source wrapping.
- Nine full-row lens buttons consumed the pinned layer palette. A labelled native selector retains every lens and its description while bringing layer controls into view.
- Basin identity could disappear behind a long status label. Identity and status now have separate lines; basin names wrap rather than truncate.
- Four village-risk classes occupied four narrow columns in the rail. A deliberate two-by-two group keeps Thai labels readable.
- The official Facebook timeline reserved 420px even when posts were unavailable. The timeline now mounts only when explicitly expanded; the official link remains available. Removed developer credential instructions from the public empty state.

The map retains its large area because geography is its purpose. Quantitative gauges retain their ticks, thresholds and honest missing/off-scale states from the previous audit. Modelled numeric loads already have no decorative bars; an initial reviewer concern about those bars was stale and excluded.

## Verification

Responsive geometry and pointer interaction tests cover 1440, 1024 and 390px: title/metadata order, no page overflow, compact feed/tools rows, expandable context, gauge semantics and source denominators. Lens switching and layer-control access are exercised by browser tests. Production build passed. Independent review passed at all three widths with real pointer interaction for weather, lens and Facebook controls, no page overflow or browser errors. Review found a repeated OFFLINE badge; it was deduplicated before release. CI validation is recorded with the release commit. Screenshots are test fixtures, not current flood evidence.

This is a bounded audit and a regression standard, not a claim that all sibling systems have been inspected. Future changes must explain geometry and preserve reading, choice and action order.
