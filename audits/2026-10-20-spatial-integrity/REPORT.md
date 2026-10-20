# Spatial integrity audit — 20 October 2026

Trigger: the mobile Brief screen wrapped nine oversized feed tiles into an imbalanced second row; sensor bars offered almost no spatial reference and silently filled at warning thresholds.

## Corrections

- Feed status: one compact row, readable 12px minimum type, proportional padding, deliberate internal scrolling if needed. Whole-page overflow is prohibited. Four-metric water/air groups use balanced 2×2 grids.
- Sensor situation: reusable reference gauges show numeric ticks, actual-value pointers, labelled threshold lines, reference provenance and below/reached/exceeded text. Water uses a 0–125% extent, an explicitly local 85% review reference and 100% bank. Rain uses 0–150 mm with TMD 35.1/90.1 mm thresholds. PM2.5 uses 0–100 µg/m³ with explicitly US EPA 24h references and a warning that the source averaging window is unverified. Missing values draw no fill; values beyond the plotted extent retain their real number and announce overflow.
- Water panel: removed ratios of absolute MSL elevations; these changed when the datum changed. Measured warning gaps remain in metres. Reservoirs expose capacity references. Rain summaries count only valid reporting readings; missing is not zero or an all-clear.
- Basin ledger: exposed the 0–140% scale, 100% modelled capacity marker, uncertainty bounds and explicit off-scale exceedances.
- Historical analysis: removed unsupported 45/25/15/10/5% causal attribution. The list is qualitative and overlapping. Monthly zero/missing readings no longer draw a false minimum positive bar.
- Source catalog: all category bars use the same denominator as All. Flood-risk district stacks include and label unknown classifications in the declared total.
- Weather: removed decorative rain-probability mini-bars that rendered 0% as a positive 6% fill. Forecast percentages remain numeric.
- Other relative charts: tourism visitors, restoration budgets, annual rainfall and workbench domain counts now disclose their common scale. Modelled municipal loads retain explicit numbers rather than redundant ambiguous bars.

## Prevention

`docs/VISUAL-INTEGRITY.md` is the repository release contract. The shared dashboard ground truth `/Users/axiom/Projects/_docs/DESIGN.md` now carries a mandatory quantitative/spatial integrity gate for other systems using that standard. This is a standing shared rule, not a claim that every other repository was audited in this change.

Regressions cover threshold position versus current fill, equality/exceedance/off-scale values, missing/invalid versus measured zero, MSL datum invariance, unknown stack population, zero-area monthly rain, exact TMD boundaries, shared catalog denominators, readable one-row feeds and balanced metric geometry. Browser checks run at 1440, 1024 and 390px; independent review passed light and dark views, with regenerated dark screenshots retained in ignored `var/spatial-integrity-2026-10-20/`.

## Sources

- TMD: https://www5.tmd.go.th/info/เกณฑ์อากาศ
- US EPA breakpoints: https://aqs.epa.gov/aqsweb/documents/codetables/aqi_breakpoints.html

Local web unit suite: 1,072 passed. Workspace web typecheck, production build and the three new geometry/browser cases pass. Full repository CI is the required deployment gate; web and API deploy from the same passing commit.
