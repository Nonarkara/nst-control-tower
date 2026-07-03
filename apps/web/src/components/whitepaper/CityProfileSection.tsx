/** Whitepaper — City & Province Profile section (bilingual EN/TH, expanded analytics). */
export function CityProfileSection() {
  return (
    <section className="manual-section whitepaper-bilingual">
      <div className="whitepaper-col">
        <h3 className="manual-h3">City &amp; Province Profile — Key Indicators</h3>
        <h4 className="manual-h4">Demographics</h4>
        <table className="manual-table" style={{ marginTop: 8 }}>
          <thead><tr><th>Indicator</th><th>Value</th><th>Source</th></tr></thead>
          <tbody>
            <tr><td>City population</td><td>102,152</td><td>DOPA 2022</td></tr>
            <tr><td>Province population</td><td>1,545,147</td><td>NSO 2022</td></tr>
            <tr><td>Registered households</td><td>509,812</td><td>DOPA</td></tr>
            <tr><td>Flood-exposed households</td><td>~250,000</td><td>DDPM estimate</td></tr>
            <tr><td>Elderly (65+)</td><td>~207,000 (13.4%)</td><td>DOPA / MSDHS</td></tr>
            <tr><td>Welfare cardholders</td><td>~310,000</td><td>FPO</td></tr>
            <tr><td>MPI poverty rate</td><td>11.2% (≈173,000)</td><td>TPMAP 2025</td></tr>
          </tbody>
        </table>
        <h4 className="manual-h4" style={{ marginTop: 12 }}>Economy</h4>
        <table className="manual-table" style={{ marginTop: 8 }}>
          <thead><tr><th>Indicator</th><th>Value</th></tr></thead>
          <tbody>
            <tr><td>GPP (2020)</td><td>฿164,375 M</td></tr>
            <tr><td>GPP per capita (2020)</td><td>฿109,050 (46% of national)</td></tr>
            <tr><td>Tourism visitors (2019)</td><td>3.94 M — "fastest-growing province"</td></tr>
            <tr><td>Tourism revenue</td><td>฿15+ billion/yr</td></tr>
            <tr><td>Rubber area</td><td>243,292 ha — largest in Thailand</td></tr>
            <tr><td>Oil palm area</td><td>~48,000 ha</td></tr>
            <tr><td>Livestock</td><td>774,571 head</td></tr>
          </tbody>
        </table>
        <h4 className="manual-h4" style={{ marginTop: 12 }}>Healthcare</h4>
        <table className="manual-table" style={{ marginTop: 8 }}>
          <thead><tr><th>Facility</th><th>Beds</th><th>MOPH code</th></tr></thead>
          <tbody>
            <tr><td>Maharaj Nakhon Si Thammarat Hospital</td><td>844</td><td>11101</td></tr>
            <tr><td>Nakhon Si Thammarat City Hospital</td><td>479</td><td>11414</td></tr>
            <tr><td>Dengue incidence (province)</td><td colSpan={2}>~38 / 100,000 (MOPH HDC)</td></tr>
            <tr><td>PM2.5 annual mean (proxy)</td><td colSpan={2}>~18 µg/m³ — no permanent PCD station</td></tr>
          </tbody>
        </table>
      </div>
      <div className="whitepaper-col whitepaper-th">
        <h3 className="manual-h3 serif">โปรไฟล์เมืองและจังหวัด</h3>
        <h4 className="manual-h4 serif">ประชากร</h4>
        <p className="serif">
          ประชากรเมือง 102,152 คน (ทพ. 2565);
          จังหวัด 1,545,147 คน ใน 23 อำเภอ
          มีครัวเรือน 509,812 ครัวเรือน โดยประมาณ 250,000 ครัวเรือน
          อยู่ในพื้นที่เสี่ยงน้ำท่วม
          ผู้สูงอายุ (65+ ปี) ~207,000 คน (13.4%)
          อัตราความยากจนหลายมิติ (MPI) 11.2% หรือประมาณ 173,000 คน
        </p>
        <h4 className="manual-h4 serif" style={{ marginTop: 12 }}>เศรษฐกิจ</h4>
        <p className="serif">
          GPP จังหวัด (2563): 164,375 ล้านบาท
          GPP ต่อหัว: 109,050 บาท (46% ของค่าเฉลี่ยประเทศ)
          นักท่องเที่ยว 3.94 ล้านคน (2562 — "จังหวัดเติบโตเร็วที่สุด")
          รายได้ท่องเที่ยว 15+ พันล้านบาท/ปี
          พื้นที่ยางพารา 243,292 เฮกตาร์ — ใหญ่ที่สุดในไทย
        </p>
        <h4 className="manual-h4 serif" style={{ marginTop: 12 }}>สาธารณสุข</h4>
        <p className="serif">
          โรงพยาบาลมหาราชนครศรีธรรมราช: 844 เตียง (รหัส 11101)
          โรงพยาบาลเทศบาลนครนครศรีธรรมราช: 479 เตียง (รหัส 11414)
          อัตราป่วยไข้เลือดออก: ~38/100,000 (สสจ./HDC)
          PM2.5 เฉลี่ย (ค่าประมาณ): ~18 µg/m³ — ไม่มีสถานีตรวจวัด PCD ถาวร
        </p>
        <h4 className="manual-h4 serif" style={{ marginTop: 12 }}>ธรรมาภิบาล</h4>
        <p className="serif">
          คะแนน ITA: ระดับ A (ปีงบ 2567)
          คะแนน LPA: 82/100 (กรมส่งเสริม ปค. 2567)
          ได้รับทุน DEPA Smart City: ระบบ IoT น้ำท่วม + แพลตฟอร์มข้อมูลเปิด
          รายงาน Traffy Fondue (จังหวัด): ~3,200 รายงาน/ปี
          ชุดข้อมูลเปิดบนแพลตฟอร์ม DEPA: 8 ชุด (เป้าหมาย 20+ ชุดภายในปี 2570)
        </p>
      </div>
    </section>
  );
}
