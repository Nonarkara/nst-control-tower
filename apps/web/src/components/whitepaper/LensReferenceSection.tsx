/** Whitepaper — Lens Reference section (single column, bilingual table). */
export function LensReferenceSection() {
  return (
    <section className="manual-section">
      <h3 className="manual-h3">Lens Reference · คู่มืออ้างอิงเลนส์</h3>
      <table className="manual-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>English name</th>
            <th>ชื่อภาษาไทย</th>
            <th>Best used for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="mono">EXEC</td>
            <td>Executive</td>
            <td className="serif">ภาพรวมยุทธศาสตร์</td>
            <td>Strategic overview — city boundary, Old Town axis (Ratchadamnoen Rd), satellite, transit, GISTDA POIs, Wat Phra Mahathat</td>
          </tr>
          <tr>
            <td className="mono">OPS</td>
            <td>Operations</td>
            <td className="serif">ปฏิบัติการ</td>
            <td>Day-to-day — buildings, roads, civic POIs (Maharaj + City hospitals), traffic, incidents, CCTV</td>
          </tr>
          <tr>
            <td className="mono">MOB</td>
            <td>Mobility</td>
            <td className="serif">การเคลื่อนที่</td>
            <td>Traffic + transit + AIS + CCTV — routing and dispatch decisions</td>
          </tr>
          <tr>
            <td className="mono">MAR</td>
            <td>Maritime</td>
            <td className="serif">ทางทะเล</td>
            <td>Gulf of Thailand — Pak Phanang Bay coast, OpenSeaMap, AIS live vessels, navigation aids, distance grid</td>
          </tr>
          <tr>
            <td className="mono">ENV</td>
            <td>Environment</td>
            <td className="serif">สิ่งแวดล้อม</td>
            <td>Satellite + Pak Phanang basin flood zones + GISTDA solar — environmental planning</td>
          </tr>
          <tr>
            <td className="mono">EAR</td>
            <td>Earth</td>
            <td className="serif">สำรวจโลก</td>
            <td>NASA GIBS + MERRA-2 LIVE READINGS — IMERG rain, MODIS flood + heat + NDVI, OMI NO₂, Himawari IR</td>
          </tr>
          <tr>
            <td className="mono">SAF</td>
            <td>Safety</td>
            <td className="serif">ความปลอดภัย</td>
            <td>Flood-risk zones (Pak Phanang basin) + Traffy reports + hospitals/fire/police + Tha Dee waterways + CCTV</td>
          </tr>
          <tr>
            <td className="mono">INT</td>
            <td>Intelligence</td>
            <td className="serif">ข่าวกรองรวม</td>
            <td>TimesFM forecast → map layer binding + Situation Digest + alert badges above map on threshold breach</td>
          </tr>
          <tr>
            <td className="mono">VIB</td>
            <td>Vibes</td>
            <td className="serif">ภาพสวยงาม</td>
            <td>Presentation view — true-color satellite over Khao Luang + Old Town + Gulf coast. No data overlays.</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
