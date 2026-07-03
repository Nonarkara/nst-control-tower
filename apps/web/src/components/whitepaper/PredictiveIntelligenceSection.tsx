/** Whitepaper — Predictive Intelligence (TimesFM) section (bilingual EN/TH). */
export function PredictiveIntelligenceSection() {
  return (
    <section className="manual-section whitepaper-bilingual">
      <div className="whitepaper-col">
        <h3 className="manual-h3">Predictive Intelligence — TimesFM</h3>
        <p>
          The left rail's <strong>PREDICTIVE INTELLIGENCE</strong> panel runs
          Google TimesFM 2.0 — a 200-million-parameter foundation model for
          time-series forecasting trained on 100 billion real-world data points.
        </p>
        <p>
          Every hour, the forecast service reads the latest sensor readings
          and produces a 24-point horizon with p10/p50/p90 confidence bands.
          For NST, the five tracked metrics are:
        </p>
        <table className="manual-table" style={{ marginTop: 8 }}>
          <thead><tr><th>Metric</th><th>NST significance</th><th>Alert threshold</th></tr></thead>
          <tbody>
            <tr><td>RAIN (mm/hr)</td><td>Flood trigger — Khao Luang runoff proxy</td><td>15 mm/hr</td></tr>
            <tr><td>TIDE (m)</td><td>Coastal back-pressure into Pak Phanang</td><td>0.8 m</td></tr>
            <tr><td>INCIDENTS (count)</td><td>Traffy flood + drainage reports surging</td><td>20 open</td></tr>
            <tr><td>AQI</td><td>Haze events; no permanent station (proxy)</td><td>100 (Moderate)</td></tr>
            <tr><td>VESSELS (count)</td><td>Gulf of Thailand maritime traffic</td><td>50 in bbox</td></tr>
          </tbody>
        </table>
        <p style={{ marginTop: 8 }}>
          <strong>Zero-shot</strong> means the model generalises from its vast
          pretraining corpus without requiring NST-specific training data.
          Forecast accuracy improves as historical readings accumulate in Supabase.
        </p>
      </div>
      <div className="whitepaper-col whitepaper-th">
        <h3 className="manual-h3 serif">ปัญญาประดิษฐ์พยากรณ์ — TimesFM</h3>
        <p className="serif">
          แผง <strong>PREDICTIVE INTELLIGENCE</strong> ใช้ Google TimesFM 2.0
          — โมเดลพื้นฐานพยากรณ์อนุกรมเวลา 200 ล้านพารามิเตอร์
          ฝึกด้วยข้อมูลจริง 1 แสนล้านจุด
        </p>
        <p className="serif">
          ทุกชั่วโมง บริการพยากรณ์คำนวณ 24 จุดพยากรณ์พร้อม
          ช่วงความเชื่อมั่น p10/p50/p90 สำหรับ NST มีตัวชี้วัด 5 ตัว:
          ปริมาณฝน (RAIN) ที่เป็นตัวชี้การไหลบ่าของเขาหลวง,
          ระดับน้ำทะเล (TIDE) ที่สร้างแรงดันย้อนกลับเข้าปากพนัง,
          จำนวนเหตุการณ์ (INCIDENTS), คุณภาพอากาศ (AQI) และการจราจรทางเรือ (VESSELS)
        </p>
        <p className="serif">
          <strong>Zero-shot</strong> หมายความว่าโมเดลไม่ต้องการข้อมูล NST
          เฉพาะเพื่อฝึก แต่อาศัยความสามารถทั่วไปจากการฝึกขนาดใหญ่
          ความแม่นยำจะดีขึ้นเมื่อข้อมูลสะสมใน Supabase มากขึ้น
        </p>
      </div>
    </section>
  );
}
