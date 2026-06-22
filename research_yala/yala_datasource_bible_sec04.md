## 4. Economic, Business, and Labor Data

### 4.1 Business and Trade Data

The Department of Business Development (DBD, กรมพัฒนาธุรกิจการค้า) DataWarehouse at `datawarehouse.dbd.go.th` provides free public access to all registered juristic persons in Yala Province.[^1^] Users query by province (จังหวัดยะลา) and district (อำเภอเมืองยะลา serves as the proxy for Yala City Municipality, since DBD does not maintain a separate municipal-level registry).[^2^] Available fields include registered capital, financial statement summaries, International Standard Industrial Classification (ISIC) sector codes, director and shareholder information (fee-based for certified extracts), and monthly counts of new registrations, amendments, and dissolutions.[^3^] The interface is Thai-language only; no registration is required. For time-series analysis, the DBD Statistics Division publishes monthly reports at `dbd.go.th/common-article/2` under "ข้อมูลนิติบุคคลรายจังหวัด" (Business Registration Statistics by Province).[^4^] The Yala Provincial Commerce Office (สำนักงานพาณิชย์จังหวัดยะลา) can provide supplementary trend analysis upon request.[^5^]

| Source | Base URL | Data Type | Update Frequency | Geographic Level | Access Method |
|---|---|---|---|---|---|
| DBD DataWarehouse | `datawarehouse.dbd.go.th` | Juristic person registrations, ISIC codes, financial statements | Real-time (registrations); Annual (financials) | Province → District | Free public search; Thai-language interface[^1^] |
| DBD Statistics Division | `dbd.go.th/common-article/2` | Monthly/annual new registrations by province | Monthly | Province | Downloadable PDF/Excel[^4^] |
| SSO Data Catalog | `catalog.sso.go.th` | 53 datasets: employer-employee counts, Sections 33/39/40 insured persons, employment injury data | Monthly/Quarterly | Province | Open data portal; XLSX format[^6^] |
| Provincial Commerce Office | `yala.moc.go.th` | Sectoral breakdowns, OTOP registrations, local trade data | Annual | Province | Direct request; FOIA if needed[^5^] |
| Customs Department | `customs.go.th` | Border trade volume, commodities, customs revenue | Monthly | Border checkpoint (Betong) | Department reports; FOIA for checkpoint data[^7^] |
| OSP (SSME) | `ssme.go.th` | SME counts, employment, BDS utilization | Annual | Province | Reports and data portal[^8^] |

The SSO Data Catalog at `catalog.sso.go.th` hosts 53 statistical datasets with provincial breakdowns, including employer-employee counts, Section 33 (private employee), Section 39 (self-employed), and Section 40 (freelance) insured persons data, contribution receipts, and work-related injury statistics — all in XLSX format.[^6^] The SSO Yala Provincial Branch at 64 Sukhyang Road, Sateng provides additional local datasets.[^6^]

Betong District, Yala's southernmost district bordering Malaysia, functions as the province's primary cross-border trade gateway. In FY2013, Thai exports through Betong reached approximately US$139 million, the peak year in available records.[^7^] Betong was designated a model sustainable development city (เมืองต้นแบบการพัฒนาแบบยั่งยืน), with airport development planned.[^9^] The Betong International Border Crossing processes 400–500 crossings on weekdays and approximately 2,000 on weekends.[^10^] Checkpoint-specific trade data requires direct request to Customs; the Provincial Commerce Office may hold aggregated summaries.[^7^]

### 4.2 Labor Market and Employment

The National Statistical Office (NSO, สำนักงานสถิติแห่งชาติ) Labor Force Survey provides the most authoritative labor market data for Yala. For Q2 2025 (April–June), the Labor Force Participation Rate (LFPR, อัตราการเข้าร่วมของกำลังแรงงาน) stood at 67.31%, with unemployment at 0.86% (2,234 persons out of a labor force of 260,942).[^11^] This shifts from Q3 2024 annual figures (LFPR 67.98%, unemployment 0.43%), reflecting seasonal agricultural patterns.[^12^] Of the employed population (258,707 persons), approximately 61.8% work in agriculture — roughly 155,007 persons — followed by wholesale/retail trade at 8.5% and accommodation/food services at 5.0%.[^11^]

| Indicator | Q3 2024 (Annual) | Q2 2025 (Latest) | Source |
|---|---|---|---|
| Labor Force Participation Rate | 67.98% | 67.31% | NSO LFS[^11^][^12^] |
| Unemployment Rate | 0.43% | 0.86% | NSO LFS[^11^][^12^] |
| Employed (total) | 261,498 | 258,707 | NSO LFS[^11^] |
| Agricultural employment share | 61.8% | ~61.8% | NSO LFS[^11^] |
| Informal workers (total) | 198,150 | — | Provincial Labor Office[^13^] |
| Informal workers (% of employed) | 76.5% | — | Provincial Labor Office[^13^] |
| Job vacancies notified (Q2 2025) | — | 441 positions | Provincial Employment Office[^14^] |
| Job seekers registered (Q2 2025) | — | 465 persons | Provincial Employment Office[^14^] |
| Foreign workers — legal (Q2 2025) | — | 4,833 persons | Provincial Employment Office[^14^] |

The informal economy in Yala is substantial: 198,150 informal workers represent approximately 76.5% of the employed labor force, with 78.0% (154,546 persons) concentrated in agriculture.[^13^] Among non-agricultural informal workers (43,604 persons), wholesale/retail trade accounts for 48.6% and accommodation/food services for 28.6%.[^13^] The Provincial Employment Office Yala (สำนักงานจัดหางานจังหวัดยะลา) registered 441 vacancies and 465 job seekers in Q2 2025, achieving 159 placements.[^14^] Legal foreign workers totaled 4,833 persons, of whom 91.3% were Myanmar nationals.[^14^] Skills training in Q2 2025 covered 4,540 participants.[^14^]

The National Economic and Social Development Council (NESDB, สำนักงานสภาพัฒนาการเศรษฐกิจและสังคมแห่งชาติ) publishes Gross Provincial Product (GPP, ผลิตภัณฑ์มวลรวมภูมิภาค) through its GD Catalog dashboard. In 2018 (constant 2002 prices), Yala's GPP reached 43,006 million THB, yielding per capita GPP of 91,815 THB — 38.8% of the national average of 236,815 THB.[^15^] The NESDB GPP Dashboard at `datastudio.google.com/reporting/704fe6c7-aecb-4362-9062-3dc971c75982` enables inter-provincial comparison and sectoral decomposition.[^16^] Sectoral data (2011–2018) shows agriculture contributed approximately 16,260 million THB in 2018, while accommodation/food services grew 55.7% and financial/insurance services expanded 66.6%.[^15^]

The Bank of Thailand (BOT, ธนาคารแห่งประเทศไทย) Web Statistics at `app.bot.or.th/BTWS_STAT` provides provincial banking data updated monthly.[^17^] As of June 2025, Yala hosted 16 bank branches and 16 ATMs serving 31,547 deposit accounts and 1,595 loan accounts. Deposit balances totaled 23,362 million THB against loan balances of 12,548 million THB, producing a deposit-loan ratio of 56.10% — Yala is a net depositor province where capital flows outward rather than being retained for local investment.[^17^]

| Metric | Value | Year | Source |
|---|---|---|---|
| GPP (constant 2018 prices) | 43,006 M THB | 2018 | NESDB[^15^] |
| GPP per capita | 91,815 THB | 2018 | NESDB[^15^] |
| GPP per capita as % of national | 38.8% | 2018 | NESDB[^15^] |
| Agriculture GPP share | ~31.2% | 2018 | NESDB / Provincial Industry Office[^15^][^18^] |
| Agricultural employment share | ~61.8% | 2025 | NSO LFS[^11^] |
| Productivity gap ratio (employment / GPP share) | ~1.98× | — | Calculated from NESDB + NSO[^11^][^15^] |
| Rubber production (Q2) | 55,843 tons | 2024 | OAE Zone 9[^18^] |
| Rubber price change YoY | −16.1% | Q2 2025 | OAE[^19^] |
| Palm oil production | 4,158 tons | Q2 2025 | OAE Zone 9[^18^] |
| Palm oil change YoY | +2.4% | Q2 2025 | OAE[^18^] |
| Bank deposits | 23,362 M THB | Apr 2025 | BOT[^17^] |
| Bank loans | 12,548 M THB | Apr 2025 | BOT[^17^] |
| Deposit-loan ratio | 56.10% | Apr 2025 | BOT[^17^] |
| Tourism visitors | 1,545,731 persons | 2023 | MOTS[^20^] |
| Tourism revenue | 4,720.73 M THB | 2023 | MOTS[^20^] |

### 4.3 Tourism and Diversification

Tourism has emerged as a measurable diversification pathway for Yala's agricultural-dependent economy. The Ministry of Tourism and Sports (MOTS, กระทรวงการท่องเที่ยวและกีฬา) recorded 1.55 million visitors to Yala in 2023, generating 4,720.73 million THB in revenue — approximately 11% of GPP.[^20^] Key attractions include Hala-Bala Wildlife Sanctuary (พื้นที่คุ้มครองสิ่งแวดล้อม ฮาลา-บาลา) for ecotourism, Betong Hot Springs (บ่อน้ำร้อนเบตง), Phra Mahathat Chedi Phra Phutthathammaprakat, and community tourism sites at Ban Na Tham and Ban Bon Nam Ron.[^20^] The MOTS Yala Provincial Office (Tel: 073-213-722, Email: yala@mots.go.th) serves as the primary access point for monthly and annual tourism statistics.[^20^]

The Office of Small and Medium Enterprises Promotion (OSP, สำนักงานส่งเสริมวิสาหกิจขนาดกลางและขนาดย่อม) at `ssme.go.th` maintains SME ecosystem data for Yala.[^8^] In March 2025, SSME signed an MOU with Yala Rajabhat University to establish the Southern Border Province Entrepreneur Development Institute. Programs include Business Development Service (BDS) cost support of 50–80% up to 200,000 THB and low-interest loans at 1% up to 10 million THB per SME.[^8^] The FPRI-SSME MSME Sectoral Indicator Project, launched July 2025, is conducting ecosystem mapping for Yala SMEs.[^8^]

The productivity metrics in Table 3 reveal a structural vulnerability. Agriculture employs approximately 61.8% of Yala's workforce but contributes only about 31.2% of GPP, implying agricultural workers generate roughly half the per-worker output of non-agricultural workers.[^11^][^15^] This gap is amplified by commodity price volatility: rubber prices declined 16.1% year-over-year in Q2 2025 while production remained flat (55,843 tons), compressing farm incomes.[^19^] The OAE Farm Gate Price Index fell 16.1% YoY and the Farmer Income Index 16.9% YoY.[^19^] Palm oil offered marginal counterbalance with production up 2.4% YoY to 4,158 tons.[^18^]

For municipal planners, the divergence between employment composition and output contribution signals that GPP sectoral data from NESDB and labor force data from NSO must be tracked as an integrated panel. The ratio of agricultural employment share to agricultural GPP share — approximately 1.98× — serves as a concise vulnerability indicator: values above 1.5× suggest over-dependence on low-productivity primary-sector employment. Rubber price feeds from the Rubber Authority of Thailand (RAOT, การยางแห่งประเทศไทย) at `raot.co.th`, combined with GISTDA satellite-derived land use data and RID irrigation coverage maps, enable dashboard layers that identify specific subdistricts (ตำบล) where diversification interventions yield the highest marginal returns.[^18^][^21^]
