# Glance path and kinetic-grid audit

Owner references: `/Users/axiom/Downloads/GLANCE-PATH-FOR-AI.md` and `/Users/axiom/Downloads/KINETIC-GRIDS-FOR-AI.md`. Applied with MSH and `anti-slop-design`. These references guide the requested interface audit; they do not authorize unrelated actions or change flood-data policy.

## Composition brief

- Reader/task: a municipal duty operator locates a water signal, reads its evidence and chooses the next verification action.
- Attention order: map → adjacent measured readout/age → verification. On the flood briefing: measured reading → station/time → field-verification guidance; an official DWR alert takes priority when in force. Mayor desk remains situation → verification → source comparisons.
- Licensed break: no. Named grid: **column**. No rotation, overlapping display type, decorative motion or poster treatment.
- Entry/exit: map is the dominant geographic surface, with an attached lower-edge reading band on phone/tablet and the situation rail beside it on desktop. The flood reading's caption and verification link occupy its downward exit. No unrelated picture interrupts either sequence.
- Image role: task-first instrument. Map space is needed for geographic relationships, not empty content boxes.
- Voids: uncovered map area preserves spatial context; no empty card/module is invented. Text bands follow content. Tablet readout pairs the action beside the reading rather than reserving another full-width row.
- Action groups: geographic controls remain inside the map; layers/news open deliberately; verification opens the full Brief and moves focus there. Source thresholds, observations and authority qualifications are unchanged.
- Responsive/language:390×844,1024×900,1440×900; Thai and English; long cached warnings, unavailable observations, expanded tools and official-alert states. No tiny type or hidden earned features to force fit.
- Colour/motion: existing quiet ground, semantic water/severity accents; no new palette or animation. Existing saved/system theme choice remains appropriate for round-the-clock operations, including night duty. Light/dark/print remain supported. No decorative licensed break is used.
- Overlay gate: map controls are compact, edge-aligned and included in the conservative visible-map-area measurement. Primary readout uses normal layout flow rather than covering geography.

## Found

1. Phone opened Brief by default: the map was entirely covered, despite this being a map product. Tablet Brief covered nearly half the map. The desktop's two rails left only about51% of the first screen for the map.
2. Keyboard could enter a hidden sheet. At390px, selecting MAP then pressing Tab from More focused “ดูบนแผนที่” inside `aria-hidden=true` left rail. Visual and keyboard paths disagreed.
3. Flood briefing placed the routine status, page orientation and language controls before the dominant measured reading. The entry required travelling down hundreds of pixels and looking upward again for context. Nested section padding enlarged the lead-in.

## Changed

- Start phone/tablet on Map. Reuse the existing situation classifier in a compact reading band: warning, observation/retrieval age and a duty-verification/evidence action stay together. Full detail, cameras and people-first screening remain in Brief.
- Desktop keeps the situation rail; layers/news become an explicit tool pane. Opening it temporarily earns the additional column for configuration. Escape closes it and returns focus to its toggle. No controls or datasets are removed.
- Make hidden rails and the hidden map inert. Repair the skip target and move focus into Brief when its reading-band action opens it. The concierge and map navigation share the map's actual bounds rather than offsets that could collide with the reading band.
- Reduce flood orientation/chrome, remove nested wrapper padding, and put measured reading → original station/time → verification together. Routine source status follows that sequence; declared DWR alerts still lead and have stronger type. Retain all missing-data, source and official-threshold qualifications.
- Give printed warnings dark ink on white even when the screen theme is dark.

## Evidence and release gate

Actual candidate map measurements, conservatively subtracting visible control rectangles, initially gave62.1%/72.7%/66.8% unobstructed viewport area at390/1024/1440. The tablet's later side-by-side reading band releases additional map height. No horizontal overflow was observed. Real flood captures explicitly verify scrollTop=0; source ages and counts change naturally between captures and are not restamped.

Artifacts: `/Volumes/Data/agent-artifacts/NST/2026-11-03-glance`. New browser cases retain geometry and screenshots in the existing CI artifact. Synthetic cases are labelled and do not claim current flood conditions. They check long Thai/cache text, map share, hidden focus, evidence navigation, expired observations, official priority and print contrast. Existing tests now open the pane/view they exercise rather than assuming every tool is visible at startup.

Local flood behavior tests passed9cases. Local map browser attempts stalled on cold load/reload or browser commands; these are not clean passes. Web typecheck and existing situation-domain tests run locally; full production build and browser gates run in remote CI on this service host's established workflow. Independent review of the final rendered states is required before promotion. Final test/reviewer/deployment evidence belongs in `var/audit-2026-11-03-glance/release.md`.

## Limits

No calibrated street-flood simulation, roof survey, source repair or operational all-clear is implied. A4 pagination and exceptionally long names outside the tested real-content range are not certified. Dynamic multi-source severity colours retain their existing meanings; this is not a palette rewrite. The pre-existing untracked `apps/web/playwright.tmpport.config.ts` is preserved and excluded. No unrelated services are restarted.
