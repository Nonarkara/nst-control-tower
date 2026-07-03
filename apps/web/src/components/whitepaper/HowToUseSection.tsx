/** Whitepaper — How to Use This Dashboard section (bilingual EN/TH). */
export function HowToUseSection() {
  return (
    <section className="manual-section whitepaper-bilingual">
      <div className="whitepaper-col">
        <h3 className="manual-h3">How to Use This Dashboard</h3>

        <h4 className="manual-h4">Flood watch protocol (SAF + EAR lenses) — primary use case</h4>
        <ol className="manual-flow">
          <li>Switch to <strong>SAF</strong> lens: flood-risk zones + waterways + Traffy reports + hospitals/fire.</li>
          <li>Check <strong>PREDICTIVE INTELLIGENCE</strong>: RAIN p50 &gt;15 mm/hr or TIDE &gt;0.8 m = activate EAR.</li>
          <li>Switch to or add <strong>EAR</strong> layers: toggle IMERG rainfall + Himawari IR first, then MODIS Flood if event is underway.</li>
          <li>Cross-reference active Traffy flood reports against flood-risk zone polygons — areas with both active reports AND high-risk zoning need immediate response.</li>
          <li>Monitor AIS in Pak Phanang Bay: vessel counts drop when Gulf conditions deteriorate (early flood precursor).</li>
          <li>Watch MERRA-2 LIVE READINGS in EAR panel: daily precipitation &gt;100 mm = high alert.</li>
        </ol>

        <h4 className="manual-h4" style={{ marginTop: 12 }}>Daily operations (OPS lens)</h4>
        <ol className="manual-flow">
          <li>Open the dashboard — it loads the OPS lens by default.</li>
          <li>Scan the top-bar feed chips — green dots are live, red are down.</li>
          <li>Check <strong>PREDICTIVE INTELLIGENCE</strong> for any amber alerts.</li>
          <li>Scan <strong>OPEN REPORTS</strong> count — flood + drainage reports indicate pre-event stress.</li>
          <li>Click any incident pin on the map for full details.</li>
        </ol>

        <h4 className="manual-h4" style={{ marginTop: 12 }}>Intelligence watch (INT lens)</h4>
        <ol className="manual-flow">
          <li>Switch to INT lens — SITUATION DIGEST appears above the KPI strip.</li>
          <li>Red badge above the map = a forecast metric has breached its threshold.</li>
          <li>Click any PREDICTIVE INTELLIGENCE row to activate its map layer.</li>
          <li>MERRA-2 temp + precip readings update the digest automatically.</li>
        </ol>

        <h4 className="manual-h4" style={{ marginTop: 12 }}>Maritime watch (MAR lens)</h4>
        <ol className="manual-flow">
          <li>Switch to MAR lens: Gulf of Thailand coast + AIS vessel live positions.</li>
          <li>Click any vessel dot for name, speed, heading, cargo type.</li>
          <li>Toggle distance-grid (1/5/10 km rings) for reach context in Pak Phanang Bay.</li>
          <li>Watch TidePanel for wave height and tide cycle at the Gulf coast.</li>
        </ol>

        <h4 className="manual-h4" style={{ marginTop: 12 }}>Building intelligence (3D mode)</h4>
        <ol className="manual-flow">
          <li>Tap <strong>3D</strong> in the top bar to extrude buildings.</li>
          <li>Color encodes type: gold (Wat Phra Mahathat + heritage temples), blue (civic), coral (hospitals Maharaj + City).</li>
          <li>Click any building for name, type, levels, and operator.</li>
        </ol>
      </div>
      <div className="whitepaper-col whitepaper-th">
        <h3 className="manual-h3 serif">วิธีใช้งานแดชบอร์ด</h3>

        <h4 className="manual-h4 serif">โปรโตคอลเฝ้าระวังน้ำท่วม (เลนส์ SAF + EAR) — กรณีใช้งานหลัก</h4>
        <ol className="manual-flow serif">
          <li>เปลี่ยนเป็นเลนส์ <strong>SAF</strong>: โซนความเสี่ยงน้ำท่วม + ทางน้ำ + รายงาน Traffy + โรงพยาบาล/ดับเพลิง</li>
          <li>ตรวจสอบ <strong>PREDICTIVE INTELLIGENCE</strong>: RAIN p50 &gt;15 มม./ชม. หรือ TIDE &gt;0.8 เมตร = เปิดใช้ EAR</li>
          <li>เปิดชั้น <strong>EAR</strong>: สลับ IMERG + Himawari IR ก่อน จากนั้นเปิด MODIS Flood หากเกิดเหตุการณ์</li>
          <li>เปรียบเทียบรายงาน Traffy น้ำท่วมกับโซนความเสี่ยง — พื้นที่ที่มีทั้งรายงานและความเสี่ยงสูงต้องตอบสนองทันที</li>
          <li>ติดตาม AIS ในอ่าวปากพนัง: จำนวนเรือลดลงบ่งบอกว่าสภาพอ่าวแย่ลง</li>
          <li>ดูค่า MERRA-2 ในแผง EAR: ฝนรายวัน &gt;100 มม. = แจ้งเตือนสูง</li>
        </ol>

        <h4 className="manual-h4 serif" style={{ marginTop: 12 }}>ปฏิบัติการประจำวัน (เลนส์ OPS)</h4>
        <ol className="manual-flow serif">
          <li>เปิดแดชบอร์ด — โหลดเลนส์ OPS โดยอัตโนมัติ</li>
          <li>ตรวจสอบชิปฟีดบนแถบด้านบน — จุดเขียวคือสด จุดแดงคือขัดข้อง</li>
          <li>ตรวจสอบ <strong>PREDICTIVE INTELLIGENCE</strong> สำหรับการแจ้งเตือน</li>
          <li>ดูจำนวน <strong>OPEN REPORTS</strong> — รายงานน้ำท่วม/ระบายน้ำบ่งชี้ความเครียดก่อนเหตุการณ์</li>
          <li>คลิกหมุดเหตุการณ์บนแผนที่เพื่อดูรายละเอียด</li>
        </ol>

        <h4 className="manual-h4 serif" style={{ marginTop: 12 }}>เฝ้าระวังด้านปัญญา (เลนส์ INT)</h4>
        <ol className="manual-flow serif">
          <li>เปลี่ยนเป็นเลนส์ INT — SITUATION DIGEST จะปรากฏเหนือแถบ KPI</li>
          <li>แถบสีแดงเหนือแผนที่ = ตัวชี้วัดพยากรณ์เกินค่าเกณฑ์</li>
          <li>คลิกแถว PREDICTIVE INTELLIGENCE เพื่อเปิดชั้นแผนที่ที่เกี่ยวข้อง</li>
          <li>ค่าอุณหภูมิ + ปริมาณฝน MERRA-2 อัปเดต Digest โดยอัตโนมัติ</li>
        </ol>

        <h4 className="manual-h4 serif" style={{ marginTop: 12 }}>เฝ้าระวังทางทะเล (เลนส์ MAR)</h4>
        <ol className="manual-flow serif">
          <li>เปลี่ยนเป็นเลนส์ MAR: ชายฝั่งอ่าวไทย + ตำแหน่งเรือ AIS แบบสด</li>
          <li>คลิกจุดเรือเพื่อดูชื่อ ความเร็ว ทิศทาง ประเภทสินค้า</li>
          <li>เปิดกริดระยะ (1/5/10 กม.) ในอ่าวปากพนังเพื่อดูรัศมีการเข้าถึง</li>
          <li>ดู TidePanel สำหรับความสูงคลื่นและรอบน้ำขึ้น-ลงที่ชายฝั่งอ่าวไทย</li>
        </ol>
      </div>
    </section>
  );
}
