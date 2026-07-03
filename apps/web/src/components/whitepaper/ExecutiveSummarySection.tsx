/** Whitepaper — Executive Summary section (bilingual EN/TH). */
export function ExecutiveSummarySection() {
  return (
    <section className="manual-section whitepaper-bilingual">
      <div className="whitepaper-col">
        <h3 className="manual-h3">Executive Summary</h3>
        <p>
          The <strong>Nakhon Si Thammarat City Control Tower (NST-CTM-01)</strong> is
          a real-time municipal operations dashboard serving the Nakhon Si Thammarat
          City Municipality — a 22.6 km² historic city of 102,152 registered residents
          at the heart of Thailand's "City of Many Temples," anchored by the
          Khao Luang massif (1,835 m) to the west and the Pak Phanang estuary to
          the south-east.
        </p>
        <p>
          The platform is built around a single defining risk: <strong>recurrent
          catastrophic flooding</strong>. The November 2025 event — the worst on
          record — inundated 223,221 households across 22 of 23 districts,
          caused 6 deaths, and inflicted an estimated ฿33.96 billion in losses.
          NST-CTM-01 fuses <strong>30+ live data feeds</strong> — GloFAS flood
          discharge, IMERG rainfall, tide, air quality, satellite EO, citizen
          reports, AIS Gulf of Thailand, municipal Facebook, Google Trends, and
          TimesFM forecasts — into a single coherent map-first interface.
        </p>
        <p>
          The province supports 1,545,147 residents (2022) across 9,942.5 km²
          and 23 amphoe. Its economy is Thailand's largest rubber-growing region
          (243,292 ha), a tourism destination receiving 3.94 million visitors
          annually (2019), and a site of outstanding religious heritage with
          Wat Phra Mahathat Woramahawihan under UNESCO candidacy. The
          dashboard holds all of this in view while foregrounding flood preparedness
          as the non-negotiable operational priority.
        </p>
      </div>
      <div className="whitepaper-col whitepaper-th">
        <h3 className="manual-h3 serif">สรุปสำหรับผู้บริหาร</h3>
        <p className="serif">
          <strong>ศูนย์ควบคุมเมืองนครศรีธรรมราช (NST-CTM-01)</strong> คือ
          แดชบอร์ดปฏิบัติการเทศบาลแบบเรียลไทม์ สำหรับเทศบาลนครนครศรีธรรมราช
          — เมืองประวัติศาสตร์พื้นที่ 22.6 ตร.กม. ประชากรที่ลงทะเบียน 102,152 คน
          ตั้งอยู่ในใจกลาง "เมืองพระมหาธาตุ" โดยมีเทือกเขาหลวง (1,835 เมตร)
          ตั้งตระหง่านทางทิศตะวันตก และปากน้ำปากพนังทางทิศตะวันออกเฉียงใต้
        </p>
        <p className="serif">
          แพลตฟอร์มนี้ถูกออกแบบมาเพื่อรับมือกับความเสี่ยงหลักของเมือง:
          <strong>อุทกภัยรุนแรงซ้ำซาก</strong> เหตุการณ์เดือนพฤศจิกายน 2568
          ซึ่งเลวร้ายที่สุดในประวัติศาสตร์ ส่งผลกระทบต่อ 223,221 ครัวเรือน
          ใน 22 อำเภอ มีผู้เสียชีวิต 6 ราย และสร้างความเสียหายประมาณ
          33.96 พันล้านบาท ระบบนี้รวบรวมข้อมูลสดกว่า <strong>30 แหล่ง</strong>
          ไว้ในแผนที่เดียว
        </p>
        <p className="serif">
          จังหวัดนี้มีประชากร 1,545,147 คน (2565) ใน 9,942.5 ตร.กม. และ 23 อำเภอ
          มีพื้นที่ปลูกยางพาราใหญ่ที่สุดในประเทศ (243,292 เฮกตาร์)
          รองรับนักท่องเที่ยว 3.94 ล้านคนต่อปี และเป็นที่ตั้งของ
          วัดพระมหาธาตุวรมหาวิหาร ซึ่งอยู่ในกระบวนการขอขึ้นทะเบียน UNESCO
        </p>
      </div>
    </section>
  );
}
