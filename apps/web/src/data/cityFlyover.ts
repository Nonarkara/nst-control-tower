/** Camera framing, not a reconstructed water-flow path. Catchments stay separate. */
export const CITY_FLYOVER = [
  { title: "Wat Mahathat · วัดพระมหาธาตุ", longitude: 99.96619375, latitude: 8.4109925, zoom: 17.8, pitch: 58, bearing: -22,
    noteTh: "องค์พระธาตุและย่านโดยรอบ ความสูงเป็นแบบจำลอง ภาพหลังคาจากดาวเทียมไม่ใช่การสำรวจโฟโตแกรมเมทรี",
    note: "The chedi and surrounding city blocks. Heights are modelled; aerial roof projection is not photogrammetry." },
  { title: "Old town · ย่านเมืองเก่า", longitude: 99.962, latitude: 8.421, zoom: 17.4, pitch: 58, bearing: 8,
    noteTh: "ย่านนี้มีทั้งหลังคาแบนและหลังคาลาดเอียง รูปทรงหลังคาที่ยังไม่ตรวจสอบเป็นเพียงแบบคร่าว ๆ",
    note: "Flat terraces and pitched halls share these blocks. Unreviewed roof profiles remain schematic." },
  { title: "Mountain → city → coast", longitude: 99.875, latitude: 8.46, zoom: 11.7, pitch: 28, bearing: -10,
    noteTh: "เขาหลวงอยู่ทางตะวันตก ลุ่มน้ำตาปี คลองกลาย และปากพนังเป็นคนละระบบ ไม่ใช่ทางน้ำไหลเข้ารวมกันเส้นเดียว",
    note: "Khao Luang lies west of the city. Tapi, Khlong Klai and Pak Phanang are separate drainage systems, not one inflow." },
  { title: "City canals · คลองเมือง", longitude: 99.974, latitude: 8.441, zoom: 16.2, pitch: 52, bearing: 25,
    noteTh: "แนวคลองช่วยระบุจุดตรวจภาคสนาม แต่ไม่ยืนยันการไหล ความจุ หรือจุดอุดตัน",
    note: "Mapped channels help locate inspection points; their geometry does not establish flow, capacity or blockages." },
  { title: "Eastern lowland · ที่ราบตะวันออก", longitude: 100.02949, latitude: 8.44202, zoom: 15.5, pitch: 46, bearing: -25,
    noteTh: "ข้อมูลระดับถนน HII ปี 2025 เทียบระดับสมมติเท่านั้น ไม่ใช่ขอบเขตน้ำท่วมคืนนี้",
    note: "HII surveyed road elevations, 2025. Explore a static water-level what-if below; it is not tonight's flood extent." },
] as const;
