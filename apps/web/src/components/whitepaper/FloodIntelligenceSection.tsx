/** Whitepaper — NST Flood Intelligence section (bilingual EN/TH). */
export function FloodIntelligenceSection() {
  return (
    <section className="manual-section whitepaper-bilingual">
      <div className="whitepaper-col">
        <h3 className="manual-h3">NST Flood Intelligence — The Signature Risk</h3>
        <p>
          NST's defining hazard is the <strong>Khao Luang → Pak Phanang →
          Tha Dee cascade</strong>. When the Khao Luang watershed (1,835 m peak,
          ~300 km² catchment) saturates during prolonged monsoon rainfall, water
          concentrates into the Pak Phanang basin (299,113 ha) and the Tha Dee
          canal network that bisects the municipality. The cascade can produce
          &gt;500 mm in 24 hours — as it did in December 2022, affecting 9,820
          households — or a sustained multi-week event like November 2025
          (223,221 households, ฿33.96 B loss, worst on record).
        </p>
        <h4 className="manual-h4">Flood timeline — major events</h4>
        <table className="manual-table" style={{ marginTop: 8 }}>
          <thead><tr><th>Event</th><th>Households affected</th><th>Deaths</th><th>Damage</th></tr></thead>
          <tbody>
            <tr><td>Dec 2016 – Jan 2017</td><td>~60,000</td><td>—</td><td>Major province-wide</td></tr>
            <tr><td>Dec 2022</td><td>9,820</td><td>—</td><td>&gt;500 mm/24h rainfall peak</td></tr>
            <tr><td>Nov – Dec 2024</td><td>~40,000</td><td>3</td><td>Widespread</td></tr>
            <tr><td>Nov 2025 <span className="mono" style={{color:"var(--bad)"}}>WORST</span></td><td>223,221</td><td>6</td><td>฿33.96 billion</td></tr>
          </tbody>
        </table>
        <h4 className="manual-h4" style={{ marginTop: 12 }}>Forecast → Map binding</h4>
        <p>
          Every row in the <strong>PREDICTIVE INTELLIGENCE</strong> panel is
          clickable. Clicking a metric activates the corresponding map layer:
        </p>
        <table className="manual-table" style={{ marginTop: 8 }}>
          <thead><tr><th>Metric</th><th>Map layer activated</th></tr></thead>
          <tbody>
            <tr><td>RAIN</td><td>GPM IMERG rainfall satellite</td></tr>
            <tr><td>TIDE</td><td>Pak Phanang Bay coast + tide markers</td></tr>
            <tr><td>INCIDENTS</td><td>Traffy Fondue citizen reports</td></tr>
            <tr><td>AQI</td><td>MODIS Aerosol + OMI NO₂ satellite</td></tr>
            <tr><td>VESSELS</td><td>AIS live vessel positions (Gulf of Thailand)</td></tr>
          </tbody>
        </table>
        <p style={{ marginTop: 8 }}>
          When a metric's p50 forecast exceeds its alert threshold, a red badge
          floats above the map canvas — visible from across the operations room.
        </p>
      </div>
      <div className="whitepaper-col whitepaper-th">
        <h3 className="manual-h3 serif">ระบบข่าวกรองอุทกภัย NST — ความเสี่ยงเชิงนิยาม</h3>
        <p className="serif">
          ภัยหลักของนครศรีธรรมราชคือ <strong>ห่วงโซ่เขาหลวง → ลุ่มน้ำปากพนัง →
          คลองท่าดี</strong> เมื่อลุ่มน้ำเขาหลวง (ยอด 1,835 เมตร พื้นที่รับน้ำ
          ~300 ตร.กม.) อิ่มตัวในช่วงฝนมรสุมยาวนาน น้ำจะไหลรวมเข้าสู่
          ลุ่มน้ำปากพนัง (299,113 เฮกตาร์) และเครือข่ายคลองท่าดีที่ตัดผ่าน
          เขตเทศบาล น้ำอาจสูงเกิน 500 มม. ใน 24 ชั่วโมง
          และอาจกินเวลาต่อเนื่องหลายสัปดาห์เช่นในเดือนพฤศจิกายน 2568
        </p>
        <h4 className="manual-h4 serif">ไทม์ไลน์อุทกภัยสำคัญ</h4>
        <table className="manual-table" style={{ marginTop: 8 }}>
          <thead><tr><th>เหตุการณ์</th><th>ครัวเรือนที่ได้รับผล</th><th>ผู้เสียชีวิต</th></tr></thead>
          <tbody>
            <tr><td>ธ.ค. 2559 – ม.ค. 2560</td><td>~60,000</td><td>—</td></tr>
            <tr><td>ธ.ค. 2565</td><td>9,820</td><td>—</td></tr>
            <tr><td>พ.ย. – ธ.ค. 2567</td><td>~40,000</td><td>3</td></tr>
            <tr><td>พ.ย. 2568 <span className="mono" style={{color:"var(--bad)"}}>แย่สุด</span></td><td>223,221</td><td>6</td></tr>
          </tbody>
        </table>
        <h4 className="manual-h4 serif" style={{ marginTop: 12 }}>การเชื่อมพยากรณ์กับแผนที่</h4>
        <p className="serif">
          ทุกแถวใน <strong>PREDICTIVE INTELLIGENCE</strong> คลิกได้
          การคลิกจะเปิดชั้นแผนที่ที่สอดคล้อง: ฝน (RAIN) → IMERG,
          น้ำทะเล (TIDE) → ชายฝั่งอ่าวปากพนัง,
          เหตุการณ์ (INCIDENTS) → Traffy, AQI → MODIS/OMI,
          เรือ (VESSELS) → AIS อ่าวไทย
        </p>
        <p className="serif" style={{ marginTop: 8 }}>
          เมื่อค่าพยากรณ์ p50 เกินเกณฑ์ จะแสดงแถบสีแดงลอยเหนือแผนที่
          — มองเห็นได้ทั่วห้องปฏิบัติการ
        </p>
      </div>
    </section>
  );
}
