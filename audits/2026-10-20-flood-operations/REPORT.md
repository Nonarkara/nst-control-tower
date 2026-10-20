# NST flood operations — 20 October 2026

## Operational release

Share `/flood-ops` for a Thai-first, printable mayor/operations briefing. It polls a bounded synthesis every minute, with separate observation times and model retrieval times. Cameras are opt-in; opening the briefing does not create 31 simultaneous video sessions.

The page includes:

- Near-bank water gauges with two-decimal metre precision, station time and trend. A 30 cm margin is a work-priority filter, explicitly not an official warning threshold. Older-than-90-minute observations are excluded from the current tables, with missing coverage counted.
- Station rainfall maxima rather than a provincial mean concealing local downpours. Rolling 24-hour totals are not summed across repeated reports.
- Six hourly rain/wind model points: Khao Luang headwaters, Lan Saka/Kiriwong, city, Pak Nakhon coast, Pak Phanang and Khlong Klai. Future full-hour windows are computed using Unix timestamps. Missing forecast cells stay unknown. Wind is 10-m wind, not a diagnosed deep atmospheric circulation.
- FloodDash's existing antecedent precipitation index, rain history and TMD forecast relay. No duplicate national ingest or historical SQL scans were created. The index is labelled a proxy, not measured soil moisture.
- A 12-hour coastal sea-level model window, kept separate from inland gauge datum and hydraulic head. It cannot be added directly to river readings.
- An explicitly dated TMD bulletin reference with a mandatory re-check time; it never silently renews itself. Official radar imagery retains the UTC timestamp printed by TMD.
- A hydrological route explanation and historical locality evidence. Tapi west of the divide, Khlong Klai to the north and Pak Phanang are not falsely routed together into Tha Dee. Existing hand-traced historical polygons are not certified satellite inundation boundaries for this event.
- Copy-to-clipboard Thai briefing, print/PDF, and links to official sources.

## Camera capability and limits

A real WL005 night still was received successfully during verification: the canal and staff gauge were visible. The frame is retained only in ignored local audit evidence.

The new CV tool tracks contrast boundaries inside an operator-selected image region, one camera at a time through the existing paced capture pool. It keeps the first image as a reference without calling it dry/normal. Dark/overexposed/low-contrast images, repeated crops, illumination changes and references older than an hour fail to UNKNOWN. A four-percent image-height change prompts human inspection. It is not a calibrated water detector or depth gauge, and has not been validated for night/IR accuracy. It publishes no shared alerts and stores no server-side camera evidence. Live-source access and human/field verification remain available when CV cannot assess a frame.

## Audit fixes

- Old WRF day-1 totals can no longer be reused as the next rolling 24-hour basin stress estimate. Older run dates withhold the stress ratio. The hourly operational view supplies properly timestamped upcoming windows; WRF remains a calendar-day explanatory scenario.
- WRF discovery refreshes hourly during operations; older model runs are labelled cached, not newly live because they were retrieved recently.
- Tide gating samples future model timestamps instead of slicing from midnight/elapsed hours.
- A fresh saturated antecedent-rain proxy can conservatively raise scenario runoff when no measured soil sensor exists, with that assumption explicitly stated.
- Empty regional flood analytics report UNKNOWN instead of NORMAL.
- Live verification exposed intermittent aggregate stalls. Each source now has an 18-second deadline; this feed retains a 25-second browser budget on warm polls, instead of the general 10-second deadline. A single existing FloodDash province relay supplies both observations, and camera inventory waits for the first source group to settle to reduce simultaneous upstream connections. This preserves available evidence and labels missing sources instead of indefinitely holding the whole view.

## Situation evidence, not a street-level prediction

At the initial approximately 20:50 ICT check, relayed HII PTTEP3 at Pak Nakhon was 0.11 m below its published bank and falling (20:30 observation). Later page checks showed 0.14 m below bank. These changing values demonstrate why time-stamped observations matter; neither is a guarantee about the rest of the night.

Initial station rain examples were 136.6 mm/24 h at Pak Phanang (20:00 observation) and 104.2 mm/24 h at NST airport (19:00). They are past accumulations, not additional rain forecast to fall.

TMD bulletin 8 (267/2569), issued 20 October 17:00, describes a central-South monsoon trough, lower-Andaman southwesterlies and Gulf easterlies with heavy/very-heavy rain risk through 25 October. It does not establish a depression directly approaching NST. Next bulletin due 21 October 05:00. The point model at approximately 21:00 predicted little additional rain in the next 6 hours; this does not negate TMD's broader warning, antecedent saturation or near-bank observations. A single 20:45 ICT SathingPhra radar image showed echoes around NST and stronger cells farther south; a single frame cannot establish motion or river connectivity.

Historical evidence: the provincial PRD report dated 27 November 2024 identifies water entering the city from LanSaka, canal-side inundation and use of water-pushing equipment at KhlongNakhonNoi/PhatthanakanKhuKhwang Road. This supports where to inspect, not an exact forecast footprint for tonight.

## Sources

- TMD warnings: https://www.tmd.go.th/warning-and-events/warning-storm
- TMD SathingPhra radar: https://weather.tmd.go.th/stp240_HQ_edit2.php
- HII provincial gauges: https://nakhonsithammarat.thaiwater.net/wl
- FloodDash: https://flood.nonarkara.org/api/province/stations?code=80 ; `/api/wetness`, `/api/rain/trend`, `/api/weather/at?lat=8.43&lng=99.96`
- Municipal cameras: https://nstcctv.nakhoncity.org/
- Historical provincial report: https://nakhonsithammarat.prd.go.th/th/content/category/detail/id/13/cid/9/iid/343073
- Hourly models: https://open-meteo.com/en/docs ; https://open-meteo.com/en/docs/marine-weather-api

## Verification

Workspace typechecks, web production build and Worker dry-run pass. Unit suite after live hardening: 43 shared, 713 API, 1,059 web tests. New regressions cover upcoming hourly windows, missing versus measured-zero precipitation, old WRF runs, antecedent proxy labelling, contrast-boundary movement, unreadable/repeated/expired images, a permanently hanging source, and the aggregate feed's warm browser budget. All 38 browser tests passed before the final hardening release; CI repeats these for each release. Independent review at 1440/1024/390 corrected water precision, heading wrapping and a clipped mobile menu; no page overflow or uncaught exceptions remained. A real municipal WHEP still was also received on the production watch page. Deployment is gated on the same tested commit for both frontend and API.
