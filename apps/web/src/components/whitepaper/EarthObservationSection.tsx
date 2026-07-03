/** Whitepaper — Earth Observation section (bilingual EN/TH). */
export function EarthObservationSection() {
  return (
    <section className="manual-section whitepaper-bilingual">
      <div className="whitepaper-col">
        <h3 className="manual-h3">Earth Observation — Satellite Eyes on the Flood</h3>
        <p>
          The EAR (Earth) lens loads 10 NASA GIBS satellite layers.
          All are free, open-access imagery from NASA's Earth science fleet.
          For NST, the three most critical layers are IMERG rainfall, MODIS
          Flood Detection, and Himawari IR — these give a 30-minute early
          warning window before the Khao Luang cascade reaches the Pak Phanang plain.
        </p>
        <table className="manual-table" style={{ marginTop: 8 }}>
          <thead><tr><th>Layer</th><th>Instrument</th><th>NST relevance</th></tr></thead>
          <tbody>
            <tr><td>True-color</td><td>MODIS Terra</td><td>Daily 250 m — rapid visual damage assessment</td></tr>
            <tr><td>VIIRS true-color</td><td>VIIRS NOAA-20</td><td>Sharper daily — confirm flood extent after event</td></tr>
            <tr><td>Night lights</td><td>VIIRS DNB</td><td>Detect power outages in flooded districts</td></tr>
            <tr><td>IMERG rainfall <span className="mono" style={{color:"var(--bad)"}}>KEY</span></td><td>GPM IMERG</td><td>30-min rainfall — first signal of Khao Luang saturation</td></tr>
            <tr><td>NDVI</td><td>MODIS Terra</td><td>8-day rubber/oil palm greenness + post-flood stress</td></tr>
            <tr><td>Land surface temp</td><td>MODIS Terra</td><td>Urban heat + flood-area cooling signature</td></tr>
            <tr><td>Aerosol (AOD)</td><td>MODIS MAIAC</td><td>Seasonal haze proxy (October burn season)</td></tr>
            <tr><td>NO₂</td><td>OMI</td><td>Traffic + agricultural burn nitrogen dioxide</td></tr>
            <tr><td>Flood detection <span className="mono" style={{color:"var(--bad)"}}>KEY</span></td><td>MODIS combined</td><td>3-day flood surface mapping — active event assessment</td></tr>
            <tr><td>Himawari IR <span className="mono" style={{color:"var(--bad)"}}>KEY</span></td><td>Himawari-9 B13</td><td>Cloud-top temp, 10-min — earliest rainfall warning</td></tr>
          </tbody>
        </table>
        <h4 className="manual-h4" style={{ marginTop: 12 }}>LIVE READINGS — NASA MERRA-2</h4>
        <p>
          The EAR panel shows a <strong>LIVE READINGS</strong> strip sourced from
          the NASA POWER API (MERRA-2 reanalysis, no API key required). Values
          update daily with ~3-day publication latency:
        </p>
        <table className="manual-table" style={{ marginTop: 8 }}>
          <thead><tr><th>Reading</th><th>Parameter</th><th>NST context</th></tr></thead>
          <tbody>
            <tr><td>Temperature</td><td>2-m air temp (°C)</td><td>Tropical baseline; spikes during La Niña monsoon</td></tr>
            <tr><td>Precipitation</td><td>Daily total (mm/day)</td><td>~2,292 mm/yr average; November peak ~280 mm/month</td></tr>
            <tr><td>Solar irradiance</td><td>Avg kWh/m²/mo</td><td>Rubber + oil palm agri-solar planning</td></tr>
            <tr><td>Sky clearness</td><td>ALLSKY_KT index (0–1)</td><td>Low = cloud cover = active monsoon front</td></tr>
          </tbody>
        </table>
      </div>
      <div className="whitepaper-col whitepaper-th">
        <h3 className="manual-h3 serif">การสำรวจโลกจากอวกาศ — ดาวเทียมเฝ้าน้ำท่วม</h3>
        <p className="serif">
          เลนส์ EAR (Earth) โหลดภาพดาวเทียม NASA GIBS 10 ชั้น
          ทั้งหมดเป็นข้อมูลเปิดฟรีจากกองทัพดาวเทียมวิทยาศาสตร์โลกของ NASA
          สำหรับ NST ชั้นสำคัญที่สุดคือ IMERG ปริมาณฝน, MODIS ตรวจจับน้ำท่วม
          และ Himawari IR ซึ่งให้หน้าต่างเตือนภัยล่วงหน้า 30 นาที
          ก่อนน้ำจากเขาหลวงจะถึงที่ราบปากพนัง
        </p>
        <h4 className="manual-h4 serif" style={{ marginTop: 12 }}>LIVE READINGS — NASA MERRA-2</h4>
        <p className="serif">
          แผง EAR มีแถบ <strong>LIVE READINGS</strong> จาก NASA POWER API
          (MERRA-2 reanalysis ไม่ต้องใช้ API key) อัปเดตรายวันโดยมีเวลาล่าช้าประมาณ 3 วัน:
          อุณหภูมิ 2 เมตร, ปริมาณฝนรายวัน (NST เฉลี่ย 2,292 มม./ปี),
          พลังงานแสงอาทิตย์ (kWh/m²/เดือน) สำหรับแผนการเกษตรสุริยะ
          และดัชนีความโปร่งใสของท้องฟ้า ALLSKY_KT
          (ค่าต่ำ = มีเมฆมาก = แนวมรสุมกำลังแอคทีฟ)
        </p>
        <p className="serif">
          ชั้นข้อมูล GISTDA (POI Digital Twin, Solar LOD2, ข้อมูลการใช้ประโยชน์ที่ดิน)
          มาจากสำนักงานพัฒนาเทคโนโลยีอวกาศและภูมิสารสนเทศ (GISTDA) ของไทย
          ซึ่งยังเป็นแหล่งข้อมูลการสำรวจพื้นที่น้ำท่วมอย่างเป็นทางการ
        </p>
      </div>
    </section>
  );
}
