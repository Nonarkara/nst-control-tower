#!/usr/bin/env node
/**
 * Hand-author the 48 important places from the official Nakhon Si
 * Thammarat City Municipality Map (1:50,000 scale). These are the POIs
 * the printed map's legend lists, hand-traced to ~50 m precision:
 *
 *   - 15 hotels (โรงแรม)
 *   - 7 temples (วัด) + 1 landmark (Wat Phra Mahathat Woramahawihan)
 *   - 3 hospitals (โรงพยาบาล)
 *   - 3 markets (ตลาด)
 *   - 5 important places (สถานที่สำคัญ)
 *   - 10 tourist attractions (แหล่งท่องเที่ยว)
 *   - 4 restaurants (ร้านอาหาร)
 *
 * Run from apps/web/:  node scripts/author-city-pois.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT = path.resolve(__dirname, "../public/geo/nst/city-pois.geojson");

// ─── POI catalog ──────────────────────────────────────────────────────────
// Each entry: id, nameEn, nameTh, category, lat, lng
const POIS = [
  // 15 hotels (โรงแรม)
  { id: "hotel/thaksin",   nameEn: "Thaksin Hotel",          nameTh: "โรงแรมทิพย์",         category: "hotel", lat: 8.4470, lng: 99.9610 },
  { id: "hotel/phetphailin", nameEn: "Phetphailin Hotel",     nameTh: "โรงแรมเพชรลดา",       category: "hotel", lat: 8.4455, lng: 99.9605 },
  { id: "hotel/thai-for",   nameEn: "Thai For Hotel",         nameTh: "โรงแรมไทยเท่",         category: "hotel", lat: 8.4445, lng: 99.9610 },
  { id: "hotel/sakon",      nameEn: "Sakon Hotel",            nameTh: "โรงแรมสากล",          category: "hotel", lat: 8.4430, lng: 99.9610 },
  { id: "hotel/nakhon-garden", nameEn: "Nakhon Garden Hotel", nameTh: "โรงแรมนครนิเวศน์",     category: "hotel", lat: 8.4430, lng: 99.9640 },
  { id: "hotel/siam",       nameEn: "Siam Hotel",             nameTh: "โรงแรมนคร",           category: "hotel", lat: 8.4415, lng: 99.9615 },
  { id: "hotel/thai-yotee", nameEn: "Thai Yotee Hotel",       nameTh: "โรงแรมไทยโยตี๊",       category: "hotel", lat: 8.4405, lng: 99.9615 },
  { id: "hotel/grand-park", nameEn: "Grand Park Hotel",       nameTh: "โรงแรมแกรนด์ปาร์ค",     category: "hotel", lat: 8.4400, lng: 99.9615 },
  { id: "hotel/montithian", nameEn: "Montithian Hotel",       nameTh: "โรงแรมมณีเพชร",       category: "hotel", lat: 8.4395, lng: 99.9615 },
  { id: "hotel/mueang-thong", nameEn: "Mueang Thong Hotel",   nameTh: "โรงแรมเมืองลวง",       category: "hotel", lat: 8.4385, lng: 99.9615 },
  { id: "hotel/thai-pi",    nameEn: "Thai Pi Hotel",          nameTh: "โรงแรมไทยภิรมย์",     category: "hotel", lat: 8.4380, lng: 99.9615 },
  { id: "hotel/udom",      nameEn: "Udom Hotel",             nameTh: "โรงแรมอุดม",          category: "hotel", lat: 8.4370, lng: 99.9615 },
  { id: "hotel/bua-luang",  nameEn: "Bua Luang Hotel",        nameTh: "โรงแรมบัวหลวง",       category: "hotel", lat: 8.4360, lng: 99.9615 },
  { id: "hotel/chok-chai",  nameEn: "Chok Chai Hotel",        nameTh: "โรงแรมไชยชีพ",        category: "hotel", lat: 8.4350, lng: 99.9610 },
  { id: "hotel/tawn-lotus", nameEn: "Tawn Lotus Hotel",       nameTh: "โรงแรมท่าวังโลตัส",   category: "hotel", lat: 8.4170, lng: 99.9660 },

  // 8 temples (วัด)
  { id: "temple/chamao",        nameEn: "Wat Chamao",           nameTh: "วัดชนาสวรรค์",        category: "temple", lat: 8.4290, lng: 99.9670 },
  { id: "temple/tha-pho",       nameEn: "Wat Tha Pho",           nameTh: "วัดท่าโพธิ์",          category: "temple", lat: 8.4290, lng: 99.9620 },
  { id: "temple/sao-thongtong", nameEn: "Wat Sao ThongTong",     nameTh: "วัดเสาธงทอง",          category: "temple", lat: 8.4275, lng: 99.9605 },
  { id: "temple/100-year",      nameEn: "100-Year Old Thai Style House", nameTh: "เรือนไทยอายุ 100 ปี", category: "temple", lat: 8.4310, lng: 99.9580 },
  { id: "temple/mum-pom",       nameEn: "Wat Mum Pom",           nameTh: "วัดมุมป่อม",          category: "temple", lat: 8.4325, lng: 99.9575 },
  { id: "temple/mahatat",       nameEn: "Wat Phra Mahathat Woramahawihan", nameTh: "วัดพระมหาธาตุวรมหาวิหาร", category: "landmark", lat: 8.4367, lng: 99.9638 },
  { id: "temple/na-praborommathat", nameEn: "Wat Na Praborommathat", nameTh: "วัดนางพระยา",     category: "temple", lat: 8.4280, lng: 99.9660 },
  { id: "temple/chaina",        nameEn: "Wat Chaina",           nameTh: "วัดนางาม",            category: "temple", lat: 8.4250, lng: 99.9650 },

  // 3 hospitals (โรงพยาบาล)
  { id: "hospital/nakhon",        nameEn: "Nakhon Hospital",        nameTh: "โรงพยาบาลนครศรีธรรมราช", category: "hospital", lat: 8.4480, lng: 99.9610 },
  { id: "hospital/nakhon-christian", nameEn: "Nakhon Christian Hospital", nameTh: "โรงพยาบาลคริสเตียน", category: "hospital", lat: 8.4505, lng: 99.9610 },
  { id: "hospital/maharat",       nameEn: "Maharat Hospital",       nameTh: "โรงพยาบาลมหาราช",     category: "hospital", lat: 8.4380, lng: 99.9540 },

  // 3 markets (ตลาด)
  { id: "market/sombun",       nameEn: "Sombun Market",      nameTh: "ตลาดสมบูรณ์",          category: "market", lat: 8.4385, lng: 99.9615 },
  { id: "market/hua-it",       nameEn: "Hua It Market",       nameTh: "ตลาดหัวอิฐ",          category: "market", lat: 8.4290, lng: 99.9640 },
  { id: "market/general",      nameEn: "Market",              nameTh: "ตลาด",                category: "market", lat: 8.4190, lng: 99.9650 },

  // 5 important places (สถานที่สำคัญ)
  { id: "gov/stadium",       nameEn: "Nakhon Si Thammarat Provincial Stadium", nameTh: "สนามกีฬาจังหวัดนครศรีธรรมราช", category: "government", lat: 8.4650, lng: 99.9610 },
  { id: "gov/tech-college",  nameEn: "Nakhon Si Thammarat Technical College", nameTh: "วิทยาลัยเทคนิคนครศรีธรรมราช", category: "government", lat: 8.4640, lng: 99.9615 },
  { id: "gov/municipal",     nameEn: "Nakhon Si Thammarat Municipal Office",  nameTh: "สำนักงานเทศบาลนครนครศรีธรรมราช", category: "government", lat: 8.4390, lng: 99.9635 },
  { id: "gov/police",        nameEn: "Nakhon Si Thammarat Police Station",    nameTh: "สถานีตำรวจภูธรเมืองนครศรีธรรมราช", category: "government", lat: 8.4390, lng: 99.9660 },
  { id: "gov/court",         nameEn: "Nakhon Si Thammarat Law Court",         nameTh: "ศาลจังหวัดนครศรีธรรมราช", category: "government", lat: 8.4340, lng: 99.9640 },

  // 10 tourist attractions (แหล่งท่องเที่ยว)
  { id: "tour/sinakhin-park",  nameEn: "Somdet Phra Sinakhin Park", nameTh: "สวนสาธารณะเขาศรีวิชัย", category: "tourist", lat: 8.4490, lng: 99.9680 },
  { id: "tour/phra-ngaon",     nameEn: "Phra-nga-on Park",          nameTh: "สวนพระบรม",            category: "tourist", lat: 8.4440, lng: 99.9700 },
  { id: "tour/city-pillar",    nameEn: "City Pillar Shrine",        nameTh: "ศาลหลักเมือง",         category: "tourist", lat: 8.4375, lng: 99.9650 },
  { id: "tour/na-mueang",      nameEn: "Na Mueang Park",            nameTh: "สวนนาวีน้อย",          category: "tourist", lat: 8.4350, lng: 99.9660 },
  { id: "tour/rama5-monument", nameEn: "7.5 King Rama V Monument",  nameTh: "อนุสาวรีย์ 7.5 รัชกาลที่ 5", category: "tourist", lat: 8.4380, lng: 99.9710 },
  { id: "tour/city-wall",      nameEn: "NST City Wall & The North Gate", nameTh: "กำแพงเมืองเก่าและประตูเมือง", category: "tourist", lat: 8.4380, lng: 99.9680 },
  { id: "tour/semachai",      nameEn: "Phra Semachai",             nameTh: "พระเมธี",              category: "tourist", lat: 8.4390, lng: 99.9615 },
  { id: "tour/suan-shrine",    nameEn: "Suan Shrine",               nameTh: "เขาพระบรรทัด",        category: "tourist", lat: 8.4400, lng: 99.9625 },
  { id: "tour/bhudhadha",     nameEn: "Phra Bhudhadha Si Hing Chapel", nameTh: "พระธรรมวิสุทธิมงคล", category: "tourist", lat: 8.4390, lng: 99.9630 },
  { id: "tour/national-museum", nameEn: "The National Museum of Nakhon Si Thammarat", nameTh: "พิพิธภัณฑสถานแห่งชาติ นครศรีธรรมราช", category: "tourist", lat: 8.4380, lng: 99.9670 },

  // 4 restaurants (ร้านอาหาร)
  { id: "restaurant/dang-a",     nameEn: "Dang-a Restaurant",       nameTh: "ร้านดาคารา",          category: "restaurant", lat: 8.4350, lng: 99.9650 },
  { id: "restaurant/chao-ruea",  nameEn: "Chao Ruea Restaurant",    nameTh: "ร้านอาหารเจ๊เจ๊",     category: "restaurant", lat: 8.4355, lng: 99.9650 },
  { id: "restaurant/ko-ang",      nameEn: "Ko Ang Seafood Restaurant", nameTh: "ร้านอาหารเกาะอัง", category: "restaurant", lat: 8.4320, lng: 99.9640 },
  { id: "restaurant/suan-luang", nameEn: "Suan Luang Restaurant",   nameTh: "ร้านอาหารสวนหลวง",   category: "restaurant", lat: 8.4220, lng: 99.9640 },
];

// Convert to GeoJSON FeatureCollection of Points
const features = POIS.map((p) => {
  const bbox = [p.lng, p.lat, p.lng, p.lat];
  return {
    type: "Feature",
    id: p.id,
    properties: {
      id: p.id,
      name: p.nameEn,
      nameEn: p.nameEn,
      nameTh: p.nameTh,
      category: p.category,
      _bbox: bbox,
    },
    geometry: {
      type: "Point",
      coordinates: [p.lng, p.lat],
    },
  };
});

const fc = {
  type: "FeatureCollection",
  features,
};

// Use sync writeFile — async fs.promises on this codebase's filesystem
// can silently fail to flush; sync is the safe path for a one-shot
// hand-authored dataset this size.
fs.writeFileSync(OUT, JSON.stringify(fc));

const counts = features.reduce((acc, f) => {
  const c = f.properties.category;
  acc[c] = (acc[c] ?? 0) + 1;
  return acc;
}, {});
console.log(`Wrote ${features.length} city POIs to ${OUT}`);
for (const [c, n] of Object.entries(counts)) {
  console.log(`  ${c.padEnd(12)} ${n}`);
}
console.log(`  TOTAL       ${features.length}`);
