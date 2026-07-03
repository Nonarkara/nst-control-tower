/** Whitepaper — Partners & Credits section (single column, two-list grid). */
export function PartnersCreditsSection() {
  return (
    <section className="manual-section">
      <h3 className="manual-h3">Partners &amp; Credits · พันธมิตรและเครดิต</h3>
      <div className="manual-grid-2">
        <ul className="manual-flow">
          <li><strong>Nakhon Si Thammarat City Municipality</strong> — เทศบาลนครนครศรีธรรมราช (data owner · nakhoncity.org)</li>
          <li><strong>DEPA</strong> — Digital Economy Promotion Agency (Smart City grant · IoT flood sensors)</li>
          <li><strong>DDPM</strong> — Department of Disaster Prevention and Mitigation (flood data)</li>
          <li><strong>Axiom</strong> — Innovation as a Service (platform engineering)</li>
        </ul>
        <ul className="manual-flow">
          <li><strong>NASA GIBS + POWER</strong> — satellite imagery + MERRA-2 climate (open access)</li>
          <li><strong>GISTDA</strong> — Thai geospatial data + flood mapping (open access)</li>
          <li><strong>OpenStreetMap</strong> — base map + buildings + roads</li>
          <li><strong>Google TimesFM 2.0</strong> — time-series forecast model (open weights)</li>
          <li><strong>AISStream.io</strong> — live vessel AIS feed (Gulf of Thailand)</li>
          <li><strong>Traffy Fondue</strong> — citizen complaint platform</li>
          <li><strong>Open-Meteo</strong> — weather, air quality, GloFAS flood gauges</li>
          <li><strong>Google Trends</strong> — #นครศรีธรรมราช keyword intelligence</li>
        </ul>
      </div>
    </section>
  );
}
