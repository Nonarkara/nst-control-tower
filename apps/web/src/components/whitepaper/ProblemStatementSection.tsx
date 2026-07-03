/** Whitepaper — Problem Statement section (bilingual EN/TH). */
export function ProblemStatementSection() {
  return (
    <section className="manual-section whitepaper-bilingual">
      <div className="whitepaper-col">
        <h3 className="manual-h3">The Problem: A City Without a Unified Operational View</h3>
        <p>
          Nakhon Si Thammarat's emergency and municipal operations are distributed
          across a patchwork of disconnected systems: DDPM for disaster alerts,
          TMD for weather, RID ThaiWater for river gauges, Traffy Fondue for
          citizen reports, Facebook for community communications, and iTIC/Longdo
          for traffic. No single screen correlates all of these in real time.
        </p>
        <p>
          The consequences are acute during flood season (October–January).
          When the Khao Luang watershed saturates and discharges into the
          Pak Phanang basin, municipal staff have minutes — not hours — to
          coordinate evacuation, redirect traffic, and alert residents along
          Tha Dee Canal. Fragmented data systems make this reaction slower
          and less coordinated than it needs to be.
        </p>
        <ul className="manual-flow">
          <li>Correlate GloFAS discharge + IMERG rainfall + tide level in a single map view</li>
          <li>Know the exact extent of active Traffy flood reports against the flood-risk zone polygon</li>
          <li>Watch AIS vessel traffic in Pak Phanang Bay as the flood front approaches the coast</li>
          <li>Forecast rain and flood levels 24 hours ahead with TimesFM confidence bands</li>
          <li>Track the municipal Facebook communications channel without leaving the operations screen</li>
          <li>Run satellite flood-surface assessment via MODIS without GIS expertise</li>
        </ul>
      </div>
      <div className="whitepaper-col whitepaper-th">
        <h3 className="manual-h3 serif">ปัญหา: เมืองที่ขาดมุมมองการดำเนินงานเป็นหนึ่งเดียว</h3>
        <p className="serif">
          การปฏิบัติงานฉุกเฉินและเทศบาลนครศรีธรรมราชกระจัดกระจายในระบบที่
          ไม่เชื่อมต่อกัน: กรมป้องกันและบรรเทาสาธารณภัย (ปภ.) สำหรับการแจ้งเตือนภัย
          กรมอุตุนิยมวิทยา (อต.) สำหรับพยากรณ์อากาศ กรมชลประทาน ThaiWater
          สำหรับระดับน้ำในแม่น้ำ Traffy Fondue สำหรับรับเรื่องร้องเรียน
          Facebook สำหรับสื่อสารชุมชน และ iTIC/Longdo สำหรับจราจร
          ไม่มีหน้าจอเดียวที่รวมสิ่งเหล่านี้ในแบบเรียลไทม์
        </p>
        <p className="serif">
          ผลกระทบรุนแรงที่สุดในช่วงฤดูน้ำหลาก (ตุลาคม–มกราคม)
          เมื่อลุ่มน้ำเขาหลวงอิ่มตัวและไหลเข้าสู่ลุ่มน้ำปากพนัง
          เจ้าหน้าที่เทศบาลมีเวลาเป็นนาที ไม่ใช่ชั่วโมง
          ในการประสานงานอพยพ เปลี่ยนเส้นทางจราจร และแจ้งเตือนประชาชน
          ตามแนวคลองท่าดี ระบบข้อมูลที่แยกส่วนทำให้การตอบสนองช้าลง
        </p>
        <ul className="manual-flow serif">
          <li>เชื่อมโยงปริมาณน้ำ GloFAS + ฝน IMERG + ระดับน้ำทะเลในแผนที่เดียว</li>
          <li>รู้ขอบเขตรายงาน Traffy ที่เกี่ยวกับน้ำท่วมเทียบกับโซนความเสี่ยง</li>
          <li>ดูการจราจรทางเรือ AIS ในอ่าวปากพนังขณะแนวน้ำเข้าใกล้ชายฝั่ง</li>
          <li>พยากรณ์ฝนและระดับน้ำ 24 ชั่วโมงล่วงหน้าด้วย TimesFM</li>
          <li>ติดตาม Facebook เทศบาลโดยไม่ออกจากหน้าจอปฏิบัติการ</li>
          <li>ประเมินพื้นที่น้ำท่วมจากดาวเทียม MODIS โดยไม่ต้องมีทักษะ GIS</li>
        </ul>
      </div>
    </section>
  );
}
