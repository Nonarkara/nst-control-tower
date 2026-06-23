import { useEffect } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function FloodKnowledge({ open, onClose }: Props) {
  const containerRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="manual-backdrop" onClick={onClose}>
      <div
        ref={containerRef}
        className="manual"
        role="dialog"
        aria-modal="true"
        aria-label="Flood Knowledge — digital preventativeness guide"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="manual-head">
          <div className="col">
            <span className="eyebrow mono">Flood Knowledge · SIWW 2026</span>
            <h2 className="manual-title">Digital preventativeness &amp; the nature of flooding</h2>
          </div>
          <button onClick={onClose} className="mono manual-close" aria-label="Close flood knowledge panel">
            [ESC] CLOSE
          </button>
        </header>

        <div className="manual-body">

          {/* §1 — Physics of flooding */}
          <section className="manual-section">
            <h3 className="manual-h3">The physics of flooding</h3>
            <p>
              Rain falls on a catchment. Soil absorbs what it can. When saturated — or when
              rain is too intense for infiltration — water runs off across the surface, collects
              into streams, then rivers. River discharge rises. When flow exceeds channel capacity,
              water overtops the banks and spreads across the floodplain. That is inundation.
            </p>
            <p>
              The chain from raindrop to flooded street can take minutes (steep urban catchment,
              hard surfaces) or days (large river basin). That delay controls how much warning
              time is physically possible — and how useful a forecast can be.
            </p>
            <blockquote className="fk-quote">
              "Strong rainfall in the mountains, fast downhill runoff, tight river passages in
              the city, and high tide in the bay all combine to trap water in the low-lying
              urban areas."
              <cite>— Maquiling, K.S.M. · City of Iligan · ASEAN-Japan Roundtable on Flood Management · June 2026</cite>
            </blockquote>
            <p>
              NST sits at the foot of Khao Luang (1,835 m). Three watershed systems drain
              into the Pak Phanang basin and converge near Pak Phanang Bay. When the northeast
              monsoon (<em>Amihan</em>) delivers heavy rain to the uplands and Gulf tides are
              high, the same compound trap closes on the city and its estuary.
            </p>
          </section>

          {/* §2 — Mathematics of risk */}
          <section className="manual-section">
            <h3 className="manual-h3">The mathematics of risk</h3>
            <p>
              Engineers describe flood magnitude by <strong>return period</strong> — the average
              interval between events of that severity. A "1-in-100-year flood" has a 1% annual
              probability of occurring in any given year. It does not mean it happens every century.
            </p>
            <p>
              Under climate change, those probabilities shift upward. IPCC AR6 Working Group I
              shows that for every 1°C of global warming, extreme precipitation events at the
              1-in-10-year threshold become approximately <strong>1.3× more likely</strong>.
            </p>
            <table className="manual-table">
              <thead>
                <tr><th>Warming scenario</th><th>What was once a 1-in-100-year event becomes…</th></tr>
              </thead>
              <tbody>
                <tr><td>Stable climate (today)</td><td>1-in-100 years — 1% annual probability</td></tr>
                <tr><td>+1.5 °C global warming</td><td>~1-in-50 years — 2% annual probability</td></tr>
                <tr><td>+2.0 °C global warming</td><td>~1-in-25 years — 4% annual probability</td></tr>
              </tbody>
            </table>
            <p className="caption">
              Source: Maquiling, K.S.M. · City of Iligan · IPCC AR6 (2021) · PAGASA RCP4.5/8.5
              · ASEAN-Japan Roundtable on Flood Management · Singapore · June 2026
            </p>
            <p>
              On February 5–6, 2026, Iligan City (Philippines) recorded 24-hour rainfall
              exceeding the 1-in-100-year return period simultaneously at multiple gauges:
              Abuno-Tipanoy 383 mm, Pugaan 361 mm, Hindang 345.5 mm. The Tubod Bridge was
              inundated to 6.5 metres by 23:47. Neighbourhoods that had never flooded in
              living memory went under.
            </p>
            <p>
              The practical implication for NST: ecological restoration and sensor networks
              take 5–10 years to mature. Climate projections indicate that extremes will
              intensify precisely in that window. <strong>The time to build the system is now.</strong>
            </p>
          </section>

          {/* §3 — How a flood forecast works */}
          <section className="manual-section">
            <h3 className="manual-h3">How a flood forecast works</h3>
            <p>
              Modern operational flood forecasting is a four-step pipeline. Each stage converts
              one physical domain into the next, propagating uncertainty forward until the output
              is a map of expected flood depth and extent with probability bands.
            </p>
            <ol className="fk-steps">
              <li>
                <strong>Rainfall forecast</strong> — Global numerical weather prediction (ECMWF,
                GFS) blended with JAXA GSMaP and NASA IMERG satellite precipitation estimates.
                Output: expected rain volume by location for the next 5–10 days.
              </li>
              <li>
                <strong>Land surface model</strong> — MATSIRO (Minimal Advanced Treatments of
                Surface Interaction and Runoff) converts rainfall into soil moisture, evaporation,
                and runoff. What soil cannot absorb becomes the input to the river network.
              </li>
              <li>
                <strong>River routing</strong> — CaMa-Flood (Catchment-based Macro-scale
                Floodplain model) routes runoff through the global river network. Computes
                discharge and water depth at every channel segment.
              </li>
              <li>
                <strong>Inundation mapping</strong> — A shallow water model converts river
                overflow into flood depth and inundated fraction over the floodplain,
                at 90 m–1 km resolution.
              </li>
            </ol>
            <p>
              This is the architecture of <strong>Today's Earth</strong> (TE), developed by
              JAXA and the University of Tokyo and operationalised by Aqunia. TE-Global runs
              at 0.1° resolution with 5-day forecasts updated every 6 hours. Its ensemble
              variant (NEXRA) produces 128 members every 3 hours for probabilistic risk
              assessment. Aqunia pilots in Vietnam showed &gt;80% of flood area predicted
              one day ahead.
            </p>
            <p className="caption">
              Source: Demoto, M. · Aqunia · ASEAN-Japan Roundtable on Flood Management · Singapore · June 2026
            </p>

            <h4 className="manual-h4">JAXA 5-Level Flood Risk Classification</h4>
            <p>Risk level is set by the <em>return period of the forecasted river water level</em>:</p>
            <table className="manual-table">
              <thead>
                <tr><th>Level</th><th>Return period</th><th>Meaning for response</th></tr>
              </thead>
              <tbody>
                <tr><td className="mono">Lev.1</td><td>10–50 yr</td><td>Elevated — monitor closely, alert operations teams</td></tr>
                <tr><td className="mono">Lev.2</td><td>50–100 yr</td><td>High — prepare resources, notify at-risk communities</td></tr>
                <tr><td className="mono">Lev.3</td><td>100–150 yr</td><td>Severe — consider voluntary evacuation</td></tr>
                <tr><td className="mono">Lev.4</td><td>150–200 yr</td><td>Critical — evacuate vulnerable populations</td></tr>
                <tr><td className="mono">Lev.5</td><td>≥ 200 yr</td><td>Catastrophic — full mandatory evacuation</td></tr>
              </tbody>
            </table>
            <p className="caption">
              Source: JAXA Today's Earth · Aqunia · ASEAN-Japan Roundtable on Flood Management · Singapore · June 2026
            </p>
          </section>

          {/* §4 — Lead time */}
          <section className="manual-section">
            <h3 className="manual-h3">Lead time: the currency of flood response</h3>
            <p>
              Lead time — the gap between a forecast and the actual flood event — is the single
              most important variable in flood response planning. Research by Prof. Nakamura
              (Nagoya University) documents how the action portfolio expands as lead time grows:
            </p>
            <table className="manual-table">
              <thead>
                <tr><th>Lead time</th><th>What becomes possible</th></tr>
              </thead>
              <tbody>
                <tr><td className="mono">&lt; 6 h</td><td>Reactive only — emergency road closures, search &amp; rescue mobilisation</td></tr>
                <tr><td className="mono">6–12 h</td><td>Pre-positioning resources, alerting on-call staff, early public warnings</td></tr>
                <tr><td className="mono">12–24 h</td><td>Advisory-based voluntary evacuation, shelter preparation and staffing</td></tr>
                <tr><td className="mono">24–39 h</td><td>"Early Evacuation Information" — pre-event media briefings, livestock movement</td></tr>
                <tr><td className="mono">&gt; 39 h + &gt;60% accuracy</td><td>Full pre-emptive mobilisation, infrastructure protection, community-wide planning</td></tr>
              </tbody>
            </table>
            <p>
              <strong>Okazaki City, Japan</strong> (pop. 380,000) demonstrates the 39-hour
              threshold in practice. Its 5-level alert system issues "Early Evacuation
              Information" when the 24-hour + next-24-hour forecast exceeds 600 mm — before
              any rain arrives. During Typhoon Hagibis (2019), the system alerted 129 of 142
              levee breach sites with an average lead time of <strong>32.3 hours</strong>.
            </p>
            <p className="caption">
              Source: Nakamura, S. · Nagoya University · ASEAN-Japan Roundtable on Flood Management · Singapore · June 2026
            </p>
          </section>

          {/* §5 — Decision cycle */}
          <section className="manual-section">
            <h3 className="manual-h3">The forecast – decision – response cycle</h3>
            <p>
              A forecast alone prevents nothing. The chain from data to safety spans six disciplines —
              each must work for the others to matter:
            </p>
            <ul className="manual-flow">
              <li><strong>Sensor technology</strong> — rain gauges, water level sensors, X-band radar. Singapore PUB operates &gt;1,000 sensors across the city.</li>
              <li><strong>Atmospheric modelling</strong> — NWP and satellite precipitation assimilation (GSMaP, IMERG).</li>
              <li><strong>Environmental modelling</strong> — land surface, river routing, and inundation (the Today's Earth pipeline above).</li>
              <li><strong>Socio-economic modelling</strong> — who is exposed, what is vulnerable, where evacuees can go and what it costs.</li>
              <li><strong>Communication science</strong> — alert channels (Telegram, SMS, radio, signage), message clarity, timing.</li>
              <li><strong>Behavioural psychology</strong> — why people heed or ignore warnings. The "3As": <strong>Awareness → Acceptance → Action</strong> (PUB Singapore).</li>
            </ul>
            <p>
              Flood disaster risk = <strong>Hazard × Exposure × Vulnerability</strong>.
              A city can reduce all three: hazard through drainage and watershed restoration,
              exposure through land-use planning and setback zones, vulnerability through early
              warning, social protection, and community preparedness. Digital monitoring systems
              primarily compress hazard-to-warning time.
            </p>
            <p>
              A 2026 survey of 504 Japanese municipalities by Annie Cao (University of Tokyo)
              found that only <strong>6.9% had access to peak flood forecasts</strong> and
              only <strong>3.6% to inland flood forecasts</strong> — the information most
              needed for proactive decisions. The bottlenecks are accountability risk (fear of
              issuing a false alarm), staff shortages, and expertise gaps in reading probabilistic
              outputs.
            </p>
            <p className="caption">
              Sources: Blokhuijsen, T. · Deltares; Cao, A. · University of Tokyo; Cheng, Z.S. · PUB Singapore
              · ASEAN-Japan Roundtable on Flood Management · Singapore · June 2026
            </p>
          </section>

          {/* §6 — Cities in action */}
          <section className="manual-section">
            <h3 className="manual-h3">Cities learning to live with water</h3>
            <div className="manual-grid-2">
              <div>
                <h4 className="manual-h4">Singapore PUB — Source-Pathway-Receptor</h4>
                <p>
                  Singapore's National Water Agency manages flooding across four workstreams:
                  drainage infrastructure (5,000 km roadside drains, 830 km outlet drains,
                  48 major waterways), legislation (finished floor level controls, development
                  setbacks), community resilience, and flood response (17 Flood Response
                  Vehicles, Quick Response Teams).
                </p>
                <p>
                  The Coastal and Inland Water Operations System (CWOS) integrates &gt;1,000
                  water level sensors. X-band radar provides <strong>90-minute advance warning</strong>.
                  Alerts push automatically to Telegram and the MyENV app when drains exceed
                  90% capacity — before flooding reaches the street.
                </p>
                <p className="caption">Source: Cheng, Z.S. · PUB Singapore · ASEAN-Japan Roundtable · Singapore · June 2026</p>
              </div>
              <div>
                <h4 className="manual-h4">Project DALOY — Iligan City</h4>
                <p>
                  After February 2026 floods exceeded the 1-in-100-year return period,
                  Iligan City launched Project DALOY: "River's revival, people's survival —
                  Recovering Watershed Ecosystem Capacity for DRRM and CCAM."
                  Four intervention levers:
                </p>
                <ul className="fk-steps fk-steps--compact">
                  <li><strong>Hydraulic Flow Restoration</strong> — clearing obstructions, restoring river cross-section</li>
                  <li><strong>Riparian Regeneration</strong> — replanting banks to resist erosion and slow runoff</li>
                  <li><strong>Floodplain Reconnection</strong> — giving water space to spread safely outside the city core</li>
                  <li><strong>Governance as Stewardship</strong> — community ownership preventing re-encroachment</li>
                </ul>
                <p>
                  Street-level solutions: bioswales over drainage canals, raingardens at
                  intersections, permeable sidewalks, and vegetated eco-drains replacing
                  sealed concrete channels.
                </p>
                <p className="caption">Source: Maquiling, K.S.M. · City of Iligan · ASEAN-Japan Roundtable · Singapore · June 2026</p>
              </div>
            </div>
          </section>

          {/* §7 — NST flood picture */}
          <section className="manual-section">
            <h3 className="manual-h3">NST's flood record</h3>
            <p>
              Nakhon Si Thammarat drains the Khao Luang range (1,835 m) through the Pak
              Phanang, Tha Dee, and Ta Pi rivers into the Gulf of Thailand. The Pak Phanang
              basin covers ~299,000 ha. Multi-hazard assessments classify 11% of its area
              as high-hazard and 63% as medium-hazard for riverine flooding.
            </p>
            <table className="manual-table">
              <thead><tr><th>Event</th><th>Impact</th></tr></thead>
              <tbody>
                <tr><td>Dec 2016 – Jan 2017</td><td>Widespread flooding across all 23 districts</td></tr>
                <tr><td>Dec 2022</td><td>&gt;500 mm in 24 h · 9,820 households affected</td></tr>
                <tr><td>Nov–Dec 2024</td><td>3 fatalities confirmed</td></tr>
                <tr><td>Nov 2025</td><td>223,221 households · 22 of 23 districts · 6 deaths · 33.96 B THB economic losses</td></tr>
              </tbody>
            </table>
            <p>
              The November 2025 event was the most severe in recent record. NST receives
              approximately 2,292 mm/year over ~308 rain days; November is the climatological
              peak. The northeast monsoon (<em>Amihan</em>) stresses coastal barangays;
              southwest season (<em>Habagat</em>) stresses the river network inland.
            </p>
          </section>

          {/* §8 — What this dashboard monitors */}
          <section className="manual-section">
            <h3 className="manual-h3">What this dashboard monitors</h3>
            <p>
              The NST Control Tower integrates multiple flood-relevant data streams. Use the
              <span className="mono"> SAF</span> (Safety) or <span className="mono">ENV</span>{" "}
              (Environment) lens to surface the flood layers; <span className="mono">EAR</span>{" "}
              (Earth) for the deepest satellite picture.
            </p>
            <table className="manual-table">
              <thead><tr><th>Layer / Feed</th><th>Source</th><th>What it shows</th></tr></thead>
              <tbody>
                <tr>
                  <td>IMERG Rainfall</td>
                  <td>NASA / GIBS</td>
                  <td>Half-hourly satellite precipitation — rain accumulation across the Pak Phanang watershed</td>
                </tr>
                <tr>
                  <td>MODIS Flood Detection</td>
                  <td>NASA / GIBS</td>
                  <td>Daily flood-extent mapping from Terra and Aqua satellites</td>
                </tr>
                <tr>
                  <td>Flood-risk zones</td>
                  <td>Pak Phanang basin assessment</td>
                  <td>High / medium / low hazard polygons — static planning reference</td>
                </tr>
                <tr>
                  <td>GloFAS Gauges</td>
                  <td>ECMWF / Copernicus</td>
                  <td>River discharge anomaly at key points on Pak Phanang and Tha Dee rivers, updated every 6 h</td>
                </tr>
                <tr>
                  <td>Waterways</td>
                  <td>OSM + hydrography</td>
                  <td>Canal network and drainage pathways — the arteries that carry flood water to the estuary</td>
                </tr>
                <tr>
                  <td>Traffy Fondue incidents</td>
                  <td>NECTEC</td>
                  <td>Citizen flood reports — real-time street-level ground truth</td>
                </tr>
                <tr>
                  <td>Open-Meteo rain forecast</td>
                  <td>Open-Meteo + GFS</td>
                  <td>72-hour quantitative precipitation forecast for Nakhon Si Thammarat</td>
                </tr>
              </tbody>
            </table>
            <p>
              The GloFAS gauge feed updates every 6 hours. MODIS flood detection may lag
              by 1–2 days due to cloud cover over the peninsula during active monsoon.
              Data age and fallback tier for each feed are visible in the
              <span className="mono"> SOURCES</span> catalog (top bar).
            </p>
          </section>

          <footer className="manual-foot caption">
            Flood Knowledge · Synthesised from the <strong>ASEAN-Japan Roundtable on Flood Management</strong>,
            Singapore, 15 June 2026. Speakers cited: Demoto, M. (Aqunia) · Cao, A. (University of Tokyo) ·
            Blokhuijsen, T. (Deltares) · Cheng, Z.S. (PUB Singapore) · Maquiling, K.S.M. (City of Iligan).
            Facilitated by Smart Cities Network (SCN) and Michi Creative City Designers. ·
            This guide is for situational awareness. Official flood advisories are issued by DDPM and TMD.
          </footer>
        </div>
      </div>
    </div>
  );
}
