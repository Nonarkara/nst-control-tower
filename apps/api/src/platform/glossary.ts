import type { GlossaryTerm } from "@nst/shared";

/**
 * Glossary for the Yala Knowledge Platform.
 *
 * Plain-language definitions for the terms, acronyms, place names and data
 * systems that recur across the dashboard, the atlas, the academy lessons and
 * the source catalog. Facts are drawn from the Yala Municipal Data Bible
 * (dim01–dim12, 2025–2026) and kept consistent with the academy lessons and
 * the data dictionary.
 *
 * Conventions
 * - `termTh`   — the Thai rendering, where one is in common use.
 * - `termYawi` — the Patani-Malay rendering in Jawi (Arabic) script, included
 *                ONLY where the term genuinely has a Jawi form (place names,
 *                ethnonyms, Islamic-education institutions). Technical acronyms
 *                (CKAN, SDMX, PDPA, NEET…) carry no Jawi rendering and omit it.
 * - `domain`   — one of: deep-south, governance, geography, data, agencies.
 * - `related`  — other `term` values in this glossary, for cross-linking.
 *
 * Tone on Deep South / security terms is deliberately neutral and factual.
 */
export const GLOSSARY: GlossaryTerm[] = [
  // ── Deep South / security ──────────────────────────────────────────────────
  {
    term: "Patani",
    termTh: "ปาตานี",
    termYawi: "ڤطاني",
    domain: "deep-south",
    definition:
      "The historical Malay-Muslim cultural region of Thailand's far south — broadly Pattani, Yala and Narathiwat — distinct from the modern Thai province spelled \"Pattani.\" \"Patani\" (one t) names the wider homeland and its Malay-Muslim identity; the majority speak Patani Malay (Yawi).",
    related: ["Deep South / Southern Border Provinces", "Patani Malay (Yawi)", "Pondok"],
  },
  {
    term: "Deep South / Southern Border Provinces",
    termTh: "จังหวัดชายแดนภาคใต้",
    domain: "deep-south",
    definition:
      "Thailand's three southernmost provinces — Yala, Pattani and Narathiwat (plus four districts of Songkhla) — collectively the Southern Border Provinces (SBPs). The region has an armed conflict that reignited in January 2004; Yala accounts for roughly 28% of recorded incidents.",
    related: ["Patani", "BRN", "SBPAC", "Emergency Decree", "Deep South Watch (DSW)"],
  },
  {
    term: "Patani Malay (Yawi)",
    termTh: "ภาษามลายูปาตานี (ยาวี)",
    termYawi: "بهاس ملايو ڤطاني",
    domain: "deep-south",
    definition:
      "The first language of most of Yala's Malay-Muslim majority — a variety of Malay written historically in the Jawi (Arabic) script. \"Yawi\" is the local Thai term both for the spoken language and, loosely, for the Jawi script.",
    related: ["Patani", "Pondok", "Tadika"],
  },
  {
    term: "BRN",
    termTh: "บีอาร์เอ็น",
    domain: "deep-south",
    definition:
      "Barisan Revolusi Nasional (National Revolutionary Front) — the principal armed separatist movement in the Deep South and the main non-state party in the conflict and in successive peace-dialogue rounds with the Thai state.",
    related: ["Deep South / Southern Border Provinces", "Emergency Decree", "SBPAC"],
  },
  {
    term: "SBPAC",
    termTh: "ศอ.บต.",
    domain: "deep-south",
    definition:
      "Southern Border Provinces Administrative Centre (ศูนย์อำนวยการบริหารจังหวัดชายแดนภาคใต้) — the lead civilian coordinating agency for the Deep South. It runs the KEADILAN justice centres and publishes relief, compensation and complaint data; its consultation is expected before any security data is published.",
    related: ["KEADILAN", "Deep South / Southern Border Provinces", "Emergency Decree"],
  },
  {
    term: "Emergency Decree",
    termTh: "พ.ร.ก.ฉุกเฉิน",
    domain: "deep-south",
    definition:
      "The Emergency Decree on Public Administration in Emergency Situations (B.E. 2548 / 2005), repeatedly extended over most Deep South districts. It grants security forces special detention and search powers and adds legal restrictions on how security data may be disclosed.",
    related: ["Martial Law", "BRN", "SBPAC", "Deep South / Southern Border Provinces"],
  },
  {
    term: "Martial Law",
    termTh: "กฎอัยการศึก",
    domain: "deep-south",
    definition:
      "The Martial Law Act (B.E. 2457 / 1914), layered with the Emergency Decree across parts of the Deep South. It gives the military authority over public order and detention, and is one reason security-incident data is held under tight access controls.",
    related: ["Emergency Decree", "Deep South / Southern Border Provinces"],
  },
  {
    term: "KEADILAN",
    termTh: "ศูนย์ดำรงธรรม (เกอดิลัน)",
    termYawi: "كعاديلن",
    domain: "deep-south",
    definition:
      "\"Justice\" centres run by SBPAC — 326 offices across the Southern Border Provinces taking citizen complaints in six categories (assistance, justice, official misconduct, tip-offs, legal advice, information). Live counts are published via the SBPAC open-data API for district-level monitoring.",
    related: ["SBPAC", "Choropleth"],
  },
  {
    term: "Pondok",
    termTh: "ปอเนาะ",
    termYawi: "ڤوندوق",
    domain: "deep-south",
    definition:
      "Traditional Islamic boarding schools central to Malay-Muslim education in the Deep South. Yala has about 161 pondok (126 registered, 35 unregistered); because most sit outside the formal OBEC system, their students are largely invisible to national education statistics.",
    related: ["Tadika", "Patani Malay (Yawi)", "O-NET", "NEET"],
  },
  {
    term: "Tadika",
    termTh: "ตาดีกา",
    termYawi: "تاديكا",
    domain: "deep-south",
    definition:
      "Community-run Islamic after-school / weekend religious schools for children (from Malay taman didikan kanak-kanak). Yala hosts more than 1,200 tadika — a large parallel learning network with no integrated national database.",
    related: ["Pondok", "Patani Malay (Yawi)"],
  },
  {
    term: "Deep South Watch (DSW)",
    termTh: "ศูนย์เฝ้าระวังสถานการณ์ภาคใต้",
    domain: "deep-south",
    definition:
      "The primary academic monitor of the conflict, based at Prince of Songkla University, Pattani. Its Conflict Incident Database records 15,000+ geocoded events since 2004; it captures more incidents than ACLED or UCDP because it reads local Thai and Malay-Jawi sources, not just English media.",
    related: ["Deep South / Southern Border Provinces", "Choropleth", "SBPAC"],
  },

  // ── Governance ─────────────────────────────────────────────────────────────
  {
    term: "ITA",
    termTh: "การประเมินคุณธรรมและความโปร่งใส",
    domain: "governance",
    definition:
      "Integrity and Transparency Assessment — the National Anti-Corruption Commission's annual scoring of every public agency on disclosure and anti-corruption process. Yala City Municipality scored 91.21 (Grade A, FY2024). It measures process and disclosure, not lived outcomes.",
    related: ["LPA", "e-LAAS", "DGA"],
  },
  {
    term: "LPA",
    termTh: "การประเมินประสิทธิภาพขององค์กรปกครองส่วนท้องถิ่น",
    domain: "governance",
    definition:
      "Local Performance Assessment — the Department of Local Administration's evaluation of every local government across five dimensions and 70+ indicators. The Yala City dashboard records an LPA score of 87.87 (\"Very Good\").",
    related: ["ITA", "e-LAAS", "DGA"],
  },
  {
    term: "e-LAAS",
    termTh: "ระบบบัญชีคอมพิวเตอร์ขององค์กรปกครองส่วนท้องถิ่น",
    domain: "governance",
    definition:
      "Electronic Local Administrative Accounting System — the national platform every Thai local government uses to record revenue and expenditure transactions. It is the system of record behind the municipality's budget figures.",
    related: ["ITA", "DGA"],
  },
  {
    term: "DGA",
    termTh: "สำนักงานพัฒนารัฐบาลดิจิทัล",
    domain: "governance",
    definition:
      "Digital Government Development Agency — the agency that runs Thailand's shared digital-government infrastructure (GDX, GDCC, Digital ID) and sets the TH-e-GIF interoperability standards. It also confers the Digital Government Awards Yala won in 2022–2024.",
    related: ["GDX", "GDCC", "TH-e-GIF", "DGA Digital ID / ThaiD"],
  },
  {
    term: "GDX",
    termTh: "ศูนย์แลกเปลี่ยนข้อมูลกลาง",
    domain: "governance",
    definition:
      "Government Data Exchange — DGA's inter-agency data-sharing gateway linking 194 agencies and processing 35M+ data linkages a year via OAuth 2.0 APIs. It is how the municipality could pull DOPA population data automatically instead of keying it in by hand.",
    related: ["DGA", "GDCC", "DOPA", "PDPA"],
  },
  {
    term: "GDCC",
    termTh: "บริการคลาวด์ภาครัฐ",
    domain: "governance",
    definition:
      "Government Data Center and Cloud Service — Thailand's free, ISO 27001/27701-certified government cloud, hosting thousands of agency systems. It offers the municipality vendor-independent, TH-e-GIF-compliant hosting at zero licensing cost.",
    related: ["DGA", "GDX", "TH-e-GIF"],
  },
  {
    term: "DOPA",
    termTh: "กรมการปกครอง",
    domain: "governance",
    definition:
      "Department of Provincial Administration — the ministry that maintains Thailand's civil-registration database. Its statistics portal (stat.bora.dopa.go.th) gives registered-population counts by province, district, tambon and municipality; its API (via GDX) supports identity verification.",
    related: ["GDX", "DGA Digital ID / ThaiD", "PDPA", "NSO"],
  },
  {
    term: "TH-e-GIF",
    termTh: "มาตรฐานการเชื่อมโยงข้อมูลภาครัฐ",
    domain: "governance",
    definition:
      "Thailand e-Government Interoperability Framework — the national standard for how government systems exchange data: RESTful APIs, JSON, OAuth 2.0 / OpenID Connect, HTTPS/TLS 1.2+ and OpenAPI documentation. Compliance is mandatory under the Digital Government Development Plan.",
    related: ["DGA", "GDX", "GDCC", "SDMX"],
  },
  {
    term: "PDPA",
    termTh: "พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล",
    domain: "governance",
    definition:
      "Personal Data Protection Act (B.E. 2562 / 2019, in force 2022) — Thailand's data-privacy law. It requires consent, data minimisation and retention controls for any personal data, with fines up to 5M THB; it governs all citizen-level integrations such as the DOPA identity API.",
    related: ["DOPA", "GDX", "DGA Digital ID / ThaiD"],
  },
  {
    term: "DGA Digital ID / ThaiD",
    termTh: "ไทยดี",
    domain: "governance",
    definition:
      "ThaiD is the national digital-identity app run by DOPA's Bureau of Registration; DGA Digital ID is the OAuth 2.0 / OpenID Connect gateway that mediates ThaiD, NDID and D.DOPA. Together they let the municipality authenticate citizens for e-services without building its own identity system.",
    related: ["DOPA", "PDPA", "DGA"],
  },

  // ── Geography ──────────────────────────────────────────────────────────────
  {
    term: "Tambon Sateng",
    termTh: "ตำบลสะเตง",
    termYawi: "ساتيڠ",
    domain: "geography",
    definition:
      "The single subdistrict (tambon) that the City Municipality of Yala governs — its entire 19.4 km² jurisdiction. Bordered by tambon Yupo, Sateng Nok and Tha Sap; the dashboard's \"municipal\" figures all refer to this small unit, not the wider district or province.",
    related: ["Mueang Yala", "Wongwian", "Kilometre Zero"],
  },
  {
    term: "Mueang Yala",
    termTh: "อำเภอเมืองยะลา",
    termYawi: "موڠ يالا",
    domain: "geography",
    definition:
      "The capital district (amphoe) of Yala Province, which contains the City Municipality (Tambon Sateng) along with surrounding tambon. \"Mueang\" data covers a much larger population and area than the municipality itself.",
    related: ["Tambon Sateng", "Patani", "Pattani River"],
  },
  {
    term: "Wongwian",
    termTh: "วงเวียน",
    domain: "geography",
    definition:
      "Thai for \"roundabout / traffic circle.\" Yala's defining feature is its ring-and-radial street plan — concentric Wongwian ring roads with spider-web radial spokes — laid out in the 1910s and still the spatial frame for the city's wards, routes and GIS.",
    related: ["Kilometre Zero", "Tambon Sateng"],
  },
  {
    term: "Kilometre Zero",
    termTh: "กิโลเมตรที่ศูนย์ / วงเวียนหลักเมือง",
    domain: "geography",
    definition:
      "The central roundabout park at the heart of Yala's planned concentric-circular city, from which the ring roads and radial avenues fan out. Established when the city was laid out under the 10th provincial governor (1913–1915); it anchors the map and the dashboard's map lenses.",
    related: ["Wongwian", "Tambon Sateng"],
  },
  {
    term: "Bang Lang Dam",
    termTh: "เขื่อนบางลาง",
    termYawi: "بڠلاڠ",
    domain: "geography",
    definition:
      "The earth-core rockfill dam in Bannang Sata district (~56 km from the city) that controls flooding on the Pattani River and supplies hydropower (72 MW) and irrigation. Its storage capacity is ~1,420 MCM; real-time level and inflow telemetry feed flood forecasting.",
    related: ["Pattani River", "GloFAS", "CHIRPS", "RID"],
  },
  {
    term: "Pattani River",
    termTh: "แม่น้ำปัตตานี",
    termYawi: "سوڠاي ڤطاني",
    domain: "geography",
    definition:
      "The longest river on the Thai-Malay peninsula (~214 km), running along the western edge of Yala city. Its 3,800+ km² basin — regulated by Bang Lang Dam — drives the area's flood risk and dry-season water supply.",
    related: ["Bang Lang Dam", "GloFAS", "CHIRPS", "RID"],
  },
  {
    term: "Betong",
    termTh: "เบตง",
    termYawi: "بتوڠ",
    domain: "geography",
    definition:
      "Yala's southernmost district, on the Malaysian border — the province's main cross-border trade and tourism gateway, with an international crossing handling 400–500 weekday and ~2,000 weekend crossings, and a designated \"model sustainable development city.\"",
    related: ["Mueang Yala", "Patani"],
  },

  // ── Data ───────────────────────────────────────────────────────────────────
  {
    term: "CKAN",
    domain: "data",
    definition:
      "The open-source open-data catalog platform behind data.go.th, the DGA Government Data Catalog and DEPA's CityData. It exposes a REST API (package_search, package_list, resource_search) so datasets can be harvested programmatically rather than downloaded by hand.",
    related: ["SDMX", "DEPA CityData", "NormalizedFeed"],
  },
  {
    term: "SDMX",
    domain: "data",
    definition:
      "Statistical Data and Metadata eXchange (ISO 17369) — the international standard for sharing statistics. The NSO StatHub serves 100+ dataflows over an SDMX 2.1 API, letting the dashboard auto-refresh labour, income and demographic indicators (and connect directly to Power BI).",
    related: ["NSO", "CKAN", "NormalizedFeed"],
  },
  {
    term: "MPI / TPMAP",
    termTh: "ดัชนีความยากจนหลายมิติ / ทีพีแมป",
    domain: "data",
    definition:
      "The Multidimensional Poverty Index (MPI) measures deprivation across five dimensions (health, education, living, income, access). TPMAP (Thai People Map and Analytics Platform) publishes MPI down to village level — reporting a 20.83% poverty rate for Yala Province, a figure absent from the municipal dashboard.",
    related: ["HAI", "NEET", "Choropleth", "NSO"],
  },
  {
    term: "HAI",
    termTh: "ดัชนีความก้าวหน้าของคน",
    domain: "data",
    definition:
      "Human Achievement Index — NESDC's composite provincial benchmark across eight dimensions. Yala ranks 11th nationally overall (0.6617, \"High\") but masks a severe gap: its Education sub-index ranks 66th of 77 provinces.",
    related: ["MPI / TPMAP", "O-NET", "NEET"],
  },
  {
    term: "NEET",
    domain: "data",
    definition:
      "\"Not in Education, Employment or Training\" — the share of youth in none of those. Yala's NEET rate of about 30.8% is among Thailand's highest, partly a measurement artefact because students in pondok and tadika are not counted as \"in education.\"",
    related: ["O-NET", "Pondok", "Tadika", "HAI"],
  },
  {
    term: "O-NET",
    termTh: "การทดสอบทางการศึกษาระดับชาติขั้นพื้นฐาน",
    domain: "data",
    definition:
      "Ordinary National Educational Test — Thailand's standardised exam for Grades 6, 9 and 12, run by NIETS. Yala's scores sit well below the national average (P.6 ~27.9 vs 35.4), but the figure omits the large Islamic-education sector that I-NET, not O-NET, would cover.",
    related: ["NEET", "HAI", "Pondok"],
  },
  {
    term: "Choropleth",
    domain: "data",
    definition:
      "A thematic map that shades whole areas (districts, tambon) by a value. It is the required default for sensitive data such as security incidents: aggregating to district level shows the pattern while protecting individuals, never plotting a single incident's coordinates.",
    related: ["Deep South Watch (DSW)", "MPI / TPMAP", "Emergency Decree"],
  },
  {
    term: "GloFAS",
    domain: "data",
    definition:
      "Global Flood Awareness System (Copernicus) — provides Pattani River Basin discharge forecasts at ~5 km resolution via the Open-Meteo Flood API, including 2-, 5- and 20-year return-period thresholds. Paired with Bang Lang Dam telemetry it gives 24–48 hours of predictive flood warning.",
    related: ["CHIRPS", "Bang Lang Dam", "Pattani River", "GISTDA"],
  },
  {
    term: "CHIRPS",
    domain: "data",
    definition:
      "Climate Hazards Group InfraRed Precipitation with Station data — a blended satellite-gauge rainfall record at ~5.5 km resolution covering 1981 to near-present. It supplies the long rainfall history used to detect the extreme-rain events that trigger Yala's floods.",
    related: ["GloFAS", "Bang Lang Dam", "Pattani River", "GISTDA"],
  },
  {
    term: "NormalizedFeed",
    domain: "data",
    definition:
      "The platform's internal envelope for every data source: a typed `{ features, meta }` shape where `meta` records the source, fetch time, age and fallback tier. Normalising heterogeneous APIs into one feed is what lets the dashboard show provenance and degrade gracefully.",
    related: ["Fallback tier", "CKAN", "SDMX"],
  },
  {
    term: "Fallback tier",
    domain: "data",
    definition:
      "The freshness/trust level attached to each feed: live → database → cache → scenario → reference → unavailable. It tells operators whether a number is a real-time reading, a stored snapshot, a synthetic scenario or simply missing — surfaced inline in the source catalog.",
    related: ["NormalizedFeed", "DEPA CityData"],
  },
  {
    term: "DEPA CityData",
    termTh: "แพลตฟอร์มข้อมูลเมืองอัจฉริยะ",
    domain: "data",
    definition:
      "The Digital Economy Promotion Agency's Smart City Data Platform (citydata.in.th) where Yala publishes 15 open datasets across the four smart-city dimensions. The datasets are downloadable today; programmatic CKAN harvesting is an unrealised next step.",
    related: ["CKAN", "DGA", "GDX"],
  },

  // ── Agencies ───────────────────────────────────────────────────────────────
  {
    term: "NSO",
    termTh: "สำนักงานสถิติแห่งชาติ",
    domain: "agencies",
    definition:
      "National Statistical Office — Thailand's official statistics agency. It runs the StatHub SDMX API, the Labour Force and Household Socio-Economic surveys and the 2025 Census; the Yala provincial office (073-212-703) is the route to subdistrict-level custom tabulations.",
    related: ["SDMX", "DOPA", "MPI / TPMAP", "HAI"],
  },
  {
    term: "MOPH HDC",
    termTh: "คลังข้อมูลสุขภาพ กระทรวงสาธารณสุข",
    domain: "agencies",
    definition:
      "The Ministry of Public Health's Health Data Center — the standard \"43-file\" health dataset (diagnoses, services, chronic disease, maternal health, mortality) from every public facility. Aggregate indicators are public via opendata.moph.go.th; municipality-level extracts need authorisation.",
    related: ["NSO", "DDPM"],
  },
  {
    term: "GISTDA",
    termTh: "สำนักงานพัฒนาเทคโนโลยีอวกาศและภูมิสารสนเทศ",
    domain: "agencies",
    definition:
      "Geo-Informatics and Space Technology Development Agency — Thailand's national geospatial body. Its Sphere base maps and disaster platform expose flood-extent, fire, drought and PM2.5 layers via WMS/WMTS/REST with a free API key, and operate the THEOS-2 satellite.",
    related: ["GloFAS", "CHIRPS", "PCD / Air4Thai", "DDPM"],
  },
  {
    term: "PCD / Air4Thai",
    termTh: "กรมควบคุมมลพิษ / แอร์โฟร์ไทย",
    domain: "agencies",
    definition:
      "The Pollution Control Department and its Air4Thai network — 77 ground stations measuring PM2.5, PM10, O3, CO, NO2 and SO2 hourly, with an open JSON/XML API. It is the authoritative source for Yala's air-quality readings, which the dashboard currently shows as a single PM2.5 value.",
    related: ["GISTDA", "DDPM"],
  },
  {
    term: "DDPM",
    termTh: "กรมป้องกันและบรรเทาสาธารณภัย",
    domain: "agencies",
    definition:
      "Department of Disaster Prevention and Mitigation — collects disaster impact data (floods, storms, landslides, drought, wildfire) across 49+ indicator categories at province, district and village level. Its assessments document the three major Yala floods of 2022–2024.",
    related: ["GISTDA", "RID", "GloFAS"],
  },
  {
    term: "RID",
    termTh: "กรมชลประทาน",
    domain: "agencies",
    definition:
      "Royal Irrigation Department — manages Thailand's water infrastructure, including Bang Lang Dam on the Pattani River. Its telemetry (via ThaiWater.net) provides the hourly dam level, storage percentage and inflow data the dashboard pairs with GloFAS for flood warning.",
    related: ["Bang Lang Dam", "Pattani River", "DDPM", "GloFAS"],
  },
];
