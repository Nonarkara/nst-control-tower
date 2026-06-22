## 11. International and Regional Data Sources

International open data sources complement Thailand's national statistical systems by providing cross-country benchmarks, subnational geospatial data, climate monitoring at grid scales finer than province-level, and population estimates between census rounds. For Yala City Municipality (Thesaban Nakhon), these sources fill three gaps: the absence of subnational SDG tracking in most Thai government systems, insufficient historical climate data at municipal resolution for flood risk modelling, and the need for small-area demographic estimates for service planning.

### 11.1 United Nations and Development Data

#### 11.1.1 UNDP SDG Profile for Yala

The UNDP SDG Profile for Yala is a 22.8 MB PDF published in June 2024 covering all 17 Sustainable Development Goals with province-level indicators benchmarked against national averages[^1^]. Produced by the Ministry of Interior, UNDP, NIDA, and TDRI, the report includes public perception survey results from 15 target provinces and alignment analysis with Yala's Provincial Development Plan (2022–2027). Key indicators span poverty rates (SDG 1), health worker density and under-5 mortality (SDG 3), O-NET education scores (SDG 4), water and sanitation access (SDG 6), employment statistics (SDG 8), urban development (SDG 11), disaster-affected persons (SDG 13), and forest area (SDG 15). English and Thai versions are available; there is no API, so data must be extracted manually from PDF tables[^1^].

#### 11.1.2 World Bank Open Data API

The World Bank Indicators API provides over 16,000 time-series indicators via a free REST endpoint (`https://api.worldbank.org/v2/country/THA/indicator/`) returning JSON or XML under CC BY 4.0[^2^]. Relevant databases include World Development Indicators (1,400+ indicators), Subnational Poverty (ID 38), Subnational Population (ID 50), and SDG indicators (ID 46). No authentication is required. Province-level poverty data is available for Yala; most other indicators are country-level only[^2^].

#### 11.1.3 UN ESCAP SDG Portal

The Asia-Pacific SDG Gateway (data.unescap.org) tracks all 17 SDGs across 58 member states with time series from 2000 onward[^3^]. The portal acknowledges that "disaggregation of most indicators at the local level is either incomplete or unavailable" — Thailand data is country-level only, with no provincial breakdown. Its value for Yala is regional benchmarking against ASEAN neighbours[^3^].

#### 11.1.4 UN OCHA HDX

The Humanitarian Data Exchange (HDX) hosts 152+ datasets for Thailand, with eight resources exposed through the HDX HAPI daily API: UNHCR refugee data, ACLED conflict events, INFORM risk scores, WFP food prices, OPHI poverty rates, UNFPA baseline population, WFP rainfall, and metadata availability[^4^]. The HAPI base URL is `https://hapi.humdata.org/`. Province-level subnational coverage is available for most datasets, making this the highest-frequency international feed directly relevant to Yala[^4^].

| Source | Base URL / API Endpoint | Data Type | Geographic Level | Update Frequency | Licence |
|--------|------------------------|-----------|-----------------|-----------------|---------|
| UNDP SDG Profile Yala | `undp.org/publications/SDG-profile-yala` (PDF) | 17 SDG indicators | Province (Yala) | One-time (2024) | UNDP Open Access[^1^] |
| World Bank Indicators API | `api.worldbank.org/v2/country/THA/indicator/` | 16,000+ time series | Country; subnational poverty | Annual | CC BY 4.0[^2^] |
| UN ESCAP SDG Portal | `data.unescap.org` | Asia-Pacific SDG indicators | Country only | Annual | UN Open Data[^3^] |
| HDX HAPI | `hapi.humdata.org` | Conflict, refugees, population, rainfall | Province-level | Daily | CC BY-IGO / CC BY / CC0[^4^] |

The UNDP SDG Profile is the only source providing a comprehensive indicator-by-indicator assessment calibrated specifically to Yala and aligned with the Provincial Development Plan[^1^]. HDX HAPI distinguishes itself through daily programmatic refresh — the only automated pipeline for conflict, population, and rainfall data at province resolution[^4^]. The World Bank and ESCAP sources serve national and regional benchmarking respectively[^2^][^3^].

### 11.2 Climate and Environmental Data

#### 11.2.1 CHIRPS Rainfall

CHIRPS (Climate Hazards Group InfraRed Precipitation with Stations) provides daily rainfall estimates at ~5.5 km resolution from 1981 to the present, distributed as public domain (CC0) data[^5^]. Access channels include direct HTTP download from `data.chc.ucsb.edu` and the Google Earth Engine ImageCollection `UCSB-CHG/CHIRPS/DAILY`. Preliminary pentad products are available two days after each period ends; final monthly products release in the third week of the following month. The 40+ year record enables flood and drought trend analysis for Yala[^5^].

#### 11.2.2 GloFAS Flood Forecasting

The Global Flood Awareness System (GloFAS), operated by Copernicus EMS, provides ensemble river discharge forecasts at ~5 km resolution for the Yala River Basin with 30-day lead times[^6^]. The system includes historical reanalysis from 1984 (GloFAS v4), rapid impact assessments linking streamflow to inundation estimates, and 4-month seasonal outlooks. The Open-Meteo Flood API (`https://flood-api.open-meteo.com/v1/flood`) returns daily discharge in m³/s with ensemble statistics for any coordinate pair without authentication. Return-period thresholds classify minor (2-year), moderate (5-year), and severe (20-year) flooding[^6^].

#### 11.2.3 Global Forest Watch

Global Forest Watch provides 30 m resolution tree cover loss data from 2001 to present, weekly GLAD deforestation alerts, and daily fire alerts[^7^]. The REST API (`https://production-api.globalforestwatch.org/v1/`) requires Bearer token authentication and supports zonal statistics. The Hansen Global Forest Change dataset provides the most reliable historical record of forest cover dynamics for Yala. As of late 2025, some GFW streams have experienced disruption due to U.S. federal funding changes, though the Hansen dataset remains fully available[^7^].

#### 11.2.4 NASA SEDAC GPWv4

NASA SEDAC Gridded Population of the World v4 provides population grids at ~1 km resolution for 2000, 2005, 2010, 2015, and 2020[^8^]. GPWv4 disaggregates census data from ~13.5 million administrative units globally. Programmatic access is through the US GHG Center STAC API (`https://earth.gov/ghgcenter/api/raster`). While coarser than Meta HRSL (30 m) or WorldPop (100 m), its strict alignment to official census counts makes it valuable for cross-reference validation[^8^].

| Source | Base URL / API Endpoint | Resolution | Temporal Coverage | Update Frequency | Primary Use for Yala |
|--------|------------------------|-----------|-------------------|-----------------|----------------------|
| CHIRPS | `UCSB-CHG/CHIRPS/DAILY` (GEE); `data.chc.ucsb.edu` | ~5.5 km | 1981–present | Daily/Monthly | Flood trend analysis; drought monitoring[^5^] |
| GloFAS | `flood-api.open-meteo.com/v1/flood` | ~5 km | 1984–present + 30-day forecast | Daily | Yala River Basin flood early warning[^6^] |
| Global Forest Watch | `production-api.globalforestwatch.org/v1/` | 30 m (tree cover); 10 m (RADD) | 2001–present; Daily (fires) | Weekly/Daily | Forest loss; fire alerts[^7^] |
| NASA SEDAC GPWv4 | `earth.gov/ghgcenter/api/raster` (STAC) | ~1 km | 2000–2020 (5-year) | 5-year | Population validation[^8^] |

CHIRPS and GloFAS are the most operationally urgent given documented flood events affecting thousands of Yala households in 2022, 2023, and 2024[^5^][^6^]. Their ~5 km resolution supports basin-scale early warning sufficient to trigger municipal response protocols. Global Forest Watch complements GISTDA's national fire monitoring with global-standard deforestation tracking[^7^].

### 11.3 Population and Demographic Estimates

#### 11.3.1 Meta High Resolution Population Density

Meta's High Resolution Population Density Maps provide circa-2020 population estimates at ~30 m resolution with demographic breakdowns by age group and sex[^9^]. Fourteen files per country cover total population, male, female, women of reproductive age (15–49), children under 5, youth (15–24), and elderly (60+). Data is accessible via HDX download or Google Earth Engine (`projects/sat-io/open-datasets/hrsl/hrslpop`). The 30 m grid enables precise population mapping within Yala municipality's 19.4 km² boundary for disaster scenario modelling[^9^].

#### 11.3.2 WorldPop

WorldPop provides 100 m resolution gridded population counts for Thailand with annual estimates from 2000 to 2030, including projections[^10^]. The dataset distinguishes 20 age bands by gender and offers constrained (population allocated to built-settlement areas, recommended for municipal planning) and unconstrained variants. Access is via `https://hub.worldpop.org`, HDX, or Google Earth Engine (`WorldPop/GP/100m/pop`). The UN-adjusted variant aligns totals with UN World Population Prospects[^10^].

#### 11.3.3 IOM DTM

The IOM Displacement Tracking Matrix collects mobility data at 91 active country operations including Thailand[^11^]. In Thailand, flow monitoring is active at the Myanmar border (Tak, Ranong, Kanchanaburi, Chiang Rai) and population mobility monitoring at the Lao and Cambodia borders. No dedicated DTM operations exist at the Yala-Malaysia border. The methodology remains relevant should displacement monitoring expand to southern border provinces[^11^].

#### 11.3.4 OpenAQ

OpenAQ aggregates air quality measurements from Thailand's Pollution Control Department network through a stable v3 API (`https://api.openaq.org`)[^12^]. Endpoints include `/v3/locations` for station metadata, `/v3/locations/{id}/latest` for current readings, and `/v3/measurements` for historical data. Parameters span PM2.5, PM10, SO₂, NO₂, CO, O₃, and black carbon. Station density in Southern Thailand is significantly lower than in Bangkok; Yala may need to rely on the nearest available stations, potentially in Hat Yai[^12^].

| Source | Base URL / Access | Resolution | Demographic Detail | Temporal Coverage | Licence |
|--------|------------------|-----------|-------------------|-------------------|---------|
| Meta HRSL | HDX; GEE: `projects/sat-io/open-datasets/hrsl/hrslpop` | ~30 m | Total, male, female, 5 age groups | Circa 2020 | CC BY International[^9^] |
| WorldPop | `hub.worldpop.org`; GEE: `WorldPop/GP/100m/pop` | ~100 m | 20 age bands × 2 genders; constrained/unconstrained | 2000–2030 (annual) | CC BY 4.0[^10^] |
| IOM DTM | `dtm.iom.int/dtm-api` | Flow monitoring points | None | Varies | IOM Open Data[^11^] |
| OpenAQ | `api.openaq.org` (v3) | Station-level | None | Historical to real-time | Open data[^12^] |

Meta HRSL offers the finest spatial resolution (30 m), best suited for mapping population within Yala municipality for flood exposure estimates[^9^]. WorldPop adds temporal depth with projections to 2030 and the most detailed age-sex breakdown from any international source, essential for ageing-society planning[^10^]. IOM DTM currently has no Yala operations but provides a validated methodology expandable to the Malaysia border[^11^]. OpenAQ fills an environmental health gap, though utility depends on station proximity given sparse Southern Thailand coverage[^12^].

Together, the twelve sources catalogued in this chapter — four UN and development databases, four climate and environmental systems, and four population and demographic estimates — provide the international data layer for Yala's municipal dashboard. Where national Thai systems offer administrative data at province or district level, these sources add subnational geospatial granularity, predictive models, and standardised API-accessible feeds.
