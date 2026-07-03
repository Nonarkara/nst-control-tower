/** Whitepaper — Technical Architecture section (single column, EN only). */
export function ArchitectureSection() {
  return (
    <section className="manual-section">
      <h3 className="manual-h3">Technical Architecture</h3>
      <div className="manual-grid-2">
        <div>
          <h4 className="manual-h4">Data layer</h4>
          <ul className="manual-flow">
            <li><strong>API server</strong> — Hono (Node.js) running as macOS launchd service on port 8794. 30+ adapter modules pre-warm data on configurable intervals; stale-tolerant cache survives upstream outages and server restarts. Domain: <span className="mono">nst-api.nonarkara.org</span></li>
            <li><strong>Forecast service</strong> — Python APScheduler + Google TimesFM 2.0 (200 M param, zero-shot). Runs hourly; writes 5-metric forecasts (precipitation, flood gauge, AQI, incidents, vessels) to Supabase.</li>
            <li><strong>Database</strong> — Supabase PostgreSQL + PostGIS for city-twin state + forecast storage + news archive.</li>
            <li><strong>Edge</strong> — Cloudflare Pages (web) + Cloudflare Tunnel (API, protocol: http2). Tunnel routes <span className="mono">nst-api.nonarkara.org</span> to the local launchd service without a static IP.</li>
          </ul>
        </div>
        <div>
          <h4 className="manual-h4">Frontend</h4>
          <ul className="manual-flow">
            <li><strong>React 19 + Vite 6</strong> — fast refresh; vendor-split bundles (React · MapLibre · deck.gl) cache independently.</li>
            <li><strong>deck.gl 9.3 + MapLibre GL</strong> — WebGL2 map with 3D building extrusion, heatmaps, AIS vessel trails, satellite tiles. GloFAS flood polygons rendered as fill layers.</li>
            <li><strong>Inter</strong> (one neo-grotesque family, every weight) + <strong>IBM Plex Sans Thai</strong> for Thai script — self-hosted, no external font requests.</li>
            <li><strong>Design DNA</strong> — Dieter Rams × Bob Noorda/Massimo Vignelli (NYCTA Graphics Standards). Warm greyscale field, one signal accent, a closed 8-color route palette for wayfinding only — no rounding, blur, or shadow.</li>
            <li><strong>Accessibility</strong> — WCAG 2.1 AA: focus rings, ARIA roles, modal focus traps, news ticker pause control, combobox building search.</li>
          </ul>
        </div>
      </div>

      <h4 className="manual-h4" style={{ marginTop: 16 }}>Live data sources</h4>
      <table className="manual-table">
        <thead>
          <tr><th>Feed</th><th>Source</th><th>Update</th><th>Coverage</th></tr>
        </thead>
        <tbody>
          <tr><td>Traffic events</td><td>iTIC / Longdo</td><td>Live</td><td>NST province</td></tr>
          <tr><td>Citizen reports</td><td>Traffy Fondue</td><td>Live</td><td>Municipal bbox</td></tr>
          <tr><td>Flood discharge gauges</td><td>Open-Meteo GloFAS</td><td>3-hr</td><td>Pak Phanang basin + Tha Dee canal</td></tr>
          <tr><td>Rainfall (model)</td><td>Open-Meteo</td><td>1-hr</td><td>NST centroid 8.4364°N, 99.9631°E</td></tr>
          <tr><td>Rainfall (satellite)</td><td>NASA IMERG</td><td>30 min</td><td>NST province bbox</td></tr>
          <tr><td>Weather</td><td>Open-Meteo</td><td>1-hr</td><td>NST Old Town centroid</td></tr>
          <tr>
            <td>Air quality <span className="mono" style={{fontSize:"0.7em",color:"var(--warn)"}}>GAP</span></td>
            <td>Open-Meteo AQ + AQICN proxy</td>
            <td>1-hr</td>
            <td>Model interpolation — no PCD permanent station in NST city</td>
          </tr>
          <tr><td>Tide</td><td>Open-Meteo Marine</td><td>1-hr</td><td>Gulf of Thailand coast</td></tr>
          <tr><td>AIS vessels</td><td>AISStream.io</td><td>Live</td><td>Pak Phanang Bay / Gulf of Thailand</td></tr>
          <tr><td>CCTV cameras</td><td>Longdo</td><td>Live JPG/HLS</td><td>NST province bbox</td></tr>
          <tr><td>Satellite imagery</td><td>NASA GIBS (MODIS/VIIRS/IMERG/OMI) + Esri</td><td>15 min – 8 days</td><td>Global / regional</td></tr>
          <tr><td>Satellite climate</td><td>NASA POWER (MERRA-2 reanalysis)</td><td>Daily (~3-day latency)</td><td>NST Old Town centroid</td></tr>
          <tr><td>Flood risk zones</td><td>DDPM / GISTDA</td><td>Static</td><td>Pak Phanang basin (299,113 ha)</td></tr>
          <tr><td>Municipal updates</td><td>Facebook (nakhoncity)</td><td>15 min</td><td>เทศบาลนครนครศรีธรรมราช page</td></tr>
          <tr><td>News</td><td>Gemini 2.0 Flash (geocoded)</td><td>15 min</td><td>Nakhon Si Thammarat province</td></tr>
          <tr><td>Trends</td><td>Google Trends</td><td>15 min</td><td>"นครศรีธรรมราช" / "Nakhon Si Thammarat"</td></tr>
          <tr><td>Markets</td><td>FMP / FRED</td><td>15 min / daily</td><td>SET + global</td></tr>
          <tr><td>Forecast</td><td>TimesFM 2.0 (zero-shot)</td><td>Hourly</td><td>5 metrics, 24 h ahead</td></tr>
        </tbody>
      </table>

      <p style={{ marginTop: 12, color: "var(--text-2)", fontSize: "var(--size-caption)" }}>
        <strong>Data gap — air quality:</strong> NST province has no permanent PCD monitoring station in the city area. The AQ panel is served by Open-Meteo atmospheric model interpolation and the nearest AQICN reporting station; values are indicative, not authoritative. This gap is documented in the Source Catalog (SOURCES button). Integration with a future DEPA IoT air sensor is planned.
      </p>
    </section>
  );
}
