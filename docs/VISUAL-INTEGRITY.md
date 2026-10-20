# Visual integrity release rules

Spatial encoding is a factual claim. Review it as carefully as the number.

- Every quantitative length, area, position or colour must encode a named quantity. State units, denominator, time window and source/reference basis visibly.
- Decision gauges require numerical ticks, labelled threshold markers, a current-value indication and explicit below/reached/exceeded text. A coloured full rectangle is insufficient.
- Preserve zero as zero and missing/invalid values as unknown, with no positive mark. No minimum data-bar size to make a zero visible.
- Preserve exceedances. If a fixed range clips geometry, retain the actual number and explicitly announce off-scale values. Do not imply 104 mm equals 90 mm.
- Comparable bars use the same denominator. Unclassified members get an unknown segment; segments must account for the declared total.
- Absolute elevations cannot be divided to imply channel fullness: a datum shift changes that ratio. Compare levels by differences in a common datum, or use a validated channel capacity metric.
- Uncertainty ranges identify lower/upper estimates. Modelled thresholds and local review policies are labelled separately from official warnings.
- Do not invent percentage attribution for overlapping causes without a measured denominator and reproducible derivation. Use a qualitative checklist instead.
- Repeated status items use a deliberate compact row. No orphan second row, equal oversized tiles, or unexplained empty weight. Narrow layouts may scroll a single row; the whole page must not overflow.
- Before release: check 1440, 1024 and 390px screenshots independently; include zero, missing, below, equal, crossed and off-scale fixtures. Check geometry and real pointer access, not only DOM visibility.

Shared dashboard standard: `/Users/axiom/Projects/_docs/DESIGN.md`.

References: TMD rain categories https://www5.tmd.go.th/info/เกณฑ์อากาศ ; US EPA 24-hour PM2.5 breakpoints https://aqs.epa.gov/aqsweb/documents/codetables/aqi_breakpoints.html . These are reference scales; source averaging windows and official local warnings remain distinct.

## Geometry follows reading, choice and action

**Spatial hallucination is when an interface invents a reason for things to occupy space, instead of arranging them around how people read, choose and act.**

Every layout review must answer: **“Why is this here, why this size, and why this far from that?”** “The grid put it there” is a failure.

- Put the operational headline and its next action before secondary context. Make low-priority detail expandable when it delays the main decision; keep it accessible.
- Keep related actions adjacent, sized to their labels and touch targets. Use an explicit responsive arrangement or a labelled scrolling group, never accidental wrapping or stretched filler buttons.
- Group title, provenance and freshness deliberately. Metadata must not compete with the headline or strand a word on its own row.
- Remove unjustified gaps, orphan media and equal-weight tiles that conceal priority. Do not create containers, columns or minimum heights merely to fill available space.
- Whitespace must separate meaningful groups, support reading or establish emphasis. A map, comparison chart or touch target may need space: document that purpose rather than compressing it blindly.
- Review real content, long labels, empty states and responsive widths. Measure the distance from the headline to the primary evidence/action; a small decision must not require a long scroll.
- An audit is scoped evidence, never a promise that every interface is permanently free of these failures. Record reviewed surfaces, widths, regressions and remaining limits.
