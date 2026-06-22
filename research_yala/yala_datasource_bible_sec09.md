## 9. Geospatial Data and GIS Infrastructure

A geographic information system (GIS) forms the spatial backbone of Yala Municipality's data dashboard, enabling layering of population, infrastructure, hazard, and administrative data over a common geographic reference. This chapter catalogs national platforms, satellite imagery, base geographic datasets, and environmental GIS layers, with access instructions for each.

### 9.1 National Geospatial Platforms

**GISTDA Sphere** (sphere.gistda.or.th), operated by the Geo-Informatics and Space Technology Development Agency (GISTDA, สทอภ.), is Thailand's primary national geospatial infrastructure. It provides base map layers via WMS, WMTS, TMS, XYZ, and REST JSON protocols, all requiring free API key registration[^3-1^][^3-2^]. Five base map layers are available: `sphere_streets` (Thai-language street map), `thailand_images` (satellite/aerial imagery), `sphere_hybrid` (imagery with labels), and two color-blind accessibility variants. All layers default to Thai (`th`) with English (`en`) as an option, and support EPSG:3857 projection. JavaScript (MapLibre GL JS), Android, iOS, Flutter, and React Native SDKs are provided[^3-1^].

The Sphere REST API exposes nine services: search/suggest, place search, nearby POI, reverse geocoding, routing, matrix routing, elevation, embed map, and static map generation[^3-2^]. The `disaster-recurring` endpoint returns historical disaster frequency at queried locations, enabling flood and fire risk profiling for individual tambon. The elevation service queries GISTDA's DEM for height values at specified coordinates.

The **Royal Thai Survey Department** (RTSD, ราชการสำรวจแห่งประเทศไทย) maintains the L7018 1:50,000 topographic map series (830 sheets nationwide)[^3-9^]. Digital products include GeoTIFF, GeoPDF, shapefiles, the FLDB GIS vector database, DEMs, and orthoimagery. Access requires an official letter to the RTSD Director General specifying map sheets, scale, format, and purpose; turnaround is 15–30 business days with nominal fees for government agencies[^3-9^]. RTSD also operates 100+ CORS stations providing RTK positioning at 1–3 cm horizontal accuracy via NTRIP protocol for precise municipal surveying[^3-9^].

The **Land Department's LandsMaps** system provides parcel-level boundaries through a public WMS endpoint at `http://110.164.49.68:8081/geoserver/WMSDOL/wms?`[^3-7^]. The dataset covers 34 million+ parcels with 14+ attributes per parcel: area (square wa/rai), parcel number, title deed reference (chanote), responsible land office, government appraisal price, tax classification, city planning zone, and land use designation[^3-7^]. No authentication is required for WMS; ThaiD or OpenID unlocks advanced features including the LandsMaps mobile app's valuation lookups.

| Platform | Operator | Base URL / Endpoint | Protocols | Authentication | Key Data for Yala |
|----------|----------|---------------------|-----------|----------------|-------------------|
| GISTDA Sphere | GISTDA | sphere.gistda.or.th | WMS, WMTS, TMS, REST JSON | API key (free) | Base maps, geocoding, routing, elevation, disaster recurring[^3-1^] |
| GISTDA Disaster | GISTDA | disaster.gistda.or.th | REST JSON, WMS, WMTS, STAC | API key (free) | Flood extent, fire hotspots, drought index, PM2.5[^3-3^] |
| RTSD Maps | Royal Thai Survey | rtsd.go.th | GeoTIFF, Shapefile, GeoPDF | Official letter | 1:50,000 topo maps, DEM, FLDB vector, admin boundaries[^3-9^] |
| LandsMaps | Land Department | 110.164.49.68:8081/geoserver/WMSDOL/wms | WMS (read-only) | None for WMS; ThaiD for advanced | 34M+ parcels, 14+ attributes, appraisal prices[^3-7^] |

For Yala's dashboard, the recommended integration sequence uses GISTDA Sphere as the base map, overlays RTSD administrative boundaries, adds LandsMaps parcel boundaries as reference, and activates GISTDA Disaster flood/fire layers during hazard events — providing complete national geospatial coverage at zero licensing cost.

### 9.2 Satellite and Remote Sensing Data

**THEOS-2**, Thailand's earth observation satellite launched 9 October 2023, delivers 0.5 m panchromatic and 2 m multispectral imagery with a 10.3 km swath[^3-5^][^3-6^]. Off-nadir pointing (up to 45°) achieves <5-day revisit over Thailand, with daily coverage of 74,000 km²[^3-5^]. Government users qualify for reduced pricing via GISTDA Business Development (0-2141-4564 ext. 66, 69; usd@gistda.or.th)[^3-6^]. THEOS-1 archive (15 m MS / 2 m PAN, 2008–present) offers a lower-cost alternative for historical analysis.

**Sentinel-2** (Copernicus) provides 10 m multispectral imagery (13 bands) with 5-day revisit, available free via the Copernicus Data Space STAC API[^3-19^]. The harmonized L2A surface reflectance product (`COPERNICUS/S2_SR_HARMONIZED` in Google Earth Engine) is atmospherically corrected and ready for NDVI computation — the preferred source for land use monitoring where THEOS-2 resolution is unnecessary[^3-15^].

**Digital Elevation Model** selection depends on accuracy requirements and budget:

| DEM Source | Resolution | Vertical Accuracy | Cost | Download Method | Recommended Use |
|------------|-----------|-------------------|------|-----------------|-----------------|
| ALOS AW3D30 | 30 m | 3–5 m RMSE | Free | JAXA EORC registration[^3-13^] | **Default for Yala dashboard** |
| SRTM 1-Arc-Second | 30 m | 5–7 m RMSE | Free | USGS EarthExplorer[^3-14^] | General topography, slope analysis |
| NASADEM | 30 m | ~5 m RMSE | Free | USGS EarthExplorer | Improved SRTM with error correction |
| ASTER GDEM v3 | 30 m | 8–12 m RMSE | Free | USGS EarthExplorer | Backup only (noise in vegetated terrain) |
| TanDEM-X 90 m | 90 m | 4 m RMSE | Free (90 m) | DLR registration | Regional watershed analysis |
| RTSD DEM | Variable | Most accurate (undisclosed) | Paid | RTSD request | Engineering-grade applications[^3-9^] |

ALOS AW3D30 is the recommended default: it offers the best accuracy-to-effort ratio among free sources (3.28 m RMSE documented by JAXA)[^3-13^]. Tile N06E101 covers Yala city (6.3–6.9°N, 101.0–101.6°E). Download requires free JAXA EORC registration; the package includes DSM, quality mask, and quality assurance files in GeoTIFF format[^3-13^].

**Google Earth Engine** (GEE) provides a cloud-based platform with a multi-petabyte catalog including Landsat (1984–present), Sentinel-2 (2015–present), MODIS, SRTM, and 500+ datasets[^3-15^]. Free registration is available for government use. For Yala, GEE enables server-side processing of satellite time series without local infrastructure. A JavaScript API workflow for NDVI change detection defines the municipality bounding box (`ee.Geometry.Rectangle([101.25, 6.52, 101.35, 6.62])`), retrieves cloud-filtered Sentinel-2 composites for two periods, computes NDVI via the normalized difference of B8 (near-infrared) and B4 (red) bands, and generates a change raster by subtracting the earlier from the later period[^3-15^]. The Dynamic World V1 dataset (`GOOGLE/DYNAMICWORLD/V1`) provides 10 m near-real-time land cover across nine classes and integrates directly with Sentinel-2 for comprehensive land use mapping[^3-15^].

### 9.3 Base Geographic Data for Yala

**Administrative boundaries** should be sourced from HDX (Humanitarian Data Exchange) RTSD distribution rather than GADM[^3-9^][^3-10^]. HDX provides Level 0 (country) through Level 3 (tambon, ~7,250 units) boundaries derived directly from RTSD and vetted by OCHA/ITOS[^3-9^]. Yala City Municipality (Thesaban Nakhon Yala, เทศบาลนครยะลา) covers 19.4 km² encompassing Tambon Sateng (ตำบลสะเตง), within Amphoe Mueang Yala (อำเภอเมืองยะลา)[^3-16^]. Adjacent tambon are Yupo (ยุโป) to the north, Sateng Nok (สะเตงนอก) to the east and south, and Tha Sap (ท่าสาป) to the west. The recommended download is `tha_admbnda_adm3_rtsd_20220121.shp`, filtered to Yala Province via `ADM1_EN` or `ADM1_TH`[^3-9^].

**OpenStreetMap (OSM)** Thailand provides free road networks, building footprints, and POIs under ODbL 1.0[^3-8^]. Geofabrik publishes daily PBF extracts (~308 MB) with shapefile (~680 MB) and GeoPackage options[^3-8^]. The recommended workflow imports the full Thailand PBF to PostGIS via `osm2pgsql`, then clips to the Yala bounding box (`-b=101.0,6.3,101.6,6.9`) using `osmconvert`[^3-8^]. OSM coverage in Yala is good for major roads and moderate for buildings/POIs, though rural tracks may be incomplete and boundaries may not match RTSD sources[^3-8^].

**Road network completeness** requires three sources: DRR rural roads (dataportal.drr.go.th, shapefile/WMS)[^3-11^], DOH national highways (bmm.doh.go.th, Hw 409/410/418)[^3-8^], and OSM urban streets/alleys[^3-8^]. **Yala City Plan** (ผังเมืองรวมยะลา), maintained by DPT, defines six land use zones — red (commercial), yellow (residential), purple (industrial), green (agricultural/open space), blue (public facilities), and white (undesignated)[^3-17^]. PDF maps are available from the DPT portal; digital shapefiles require formal request to DPT Yala Provincial Office[^3-17^].

| Data Layer | Primary Source | URL / Access | Format | Update Frequency | Coverage |
|------------|---------------|--------------|--------|------------------|----------|
| Admin boundaries (tambon) | HDX (RTSD) | data.humdata.org/dataset/thailand-administrative-boundaries[^3-9^] | Shapefile, KML, GeoJSON | Annual | Level 0–3; filter to Yala |
| Road network (rural) | DRR | dataportal.drr.go.th[^3-11^] | Shapefile, WMS | Annual | All rural roads; filter to Yala |
| Road network (highways) | DOH | bmm.doh.go.th | Shapefile | Periodic | National highways incl. Hw 410 |
| Road network (urban) | OSM | download.geofabrik.de/asia/thailand.html[^3-8^] | PBF (~308 MB) | Daily | Full Thailand; clip to Yala bbox |
| City plan zoning | DPT | dpt.go.th (formal request) | PDF available; Shapefile on request | Per revision | Yala municipal area |
| Buildings / POIs | OSM | Same as above[^3-8^] | PBF | Daily | Variable completeness |
| Parcel boundaries | LandsMaps | 110.164.49.68:8081/geoserver/WMSDOL/wms[^3-7^] | WMS (view only) | Event-driven | 34M+ parcels nationwide |

### 9.4 Water and Environmental GIS

**Royal Irrigation Department (RID, กรมชลประทาน)** water data provides critical inputs for flood risk assessment. Real-time reservoir storage, rainfall, and river levels are accessible via app.rid.go.th/reservoir/ and ThaiWater.net[^3-12^]. For Yala, the Bang Lang Dam (เขื่อนบังลัง) in Bannang Sata District stores 1,420 million m³ with a 2,080 km² catchment and irrigation coverage of ~380,000 rai (60,800 ha)[^9-8^]. The Pattani River Basin covers 3,805.65 km² across Yala and Pattani provinces with ~715,000 population and 1,500–2,200 mm annual rainfall[^9-8^].

The RID GIS catalog contains 25+ categories: watershed boundaries, flood-prone area designations, river networks, dam/weir locations, and irrigation zone polygons[^9-8^]. Watershed boundaries for the Pattani basin, cross-section data for flood modeling, and irrigation zone delineations are available through RID Regional Office 10 upon formal request. The ThaiWater API delivers standardized water level data with station code, timestamp, level (m MSL), and quality flags[^9-8^].

**Land use/land cover** data comes from three complementary sources. GISTDA produces a national land cover classification via the Sphere platform. **Dynamic World V1** (Google/GEE) provides 10 m near-real-time land cover with nine classes, updated as Sentinel-2 imagery arrives[^3-15^]. **ESA WorldCover** offers 10 m global land cover with 11 classes from Sentinel-1/2. The recommended approach uses Dynamic World as the primary near-real-time layer, ESA WorldCover for independent validation, and GISTDA national land cover for alignment with Thai planning standards. All three are free: Dynamic World via GEE (`GOOGLE/DYNAMICWORLD/V1`), ESA WorldCover via its viewer, and GISTDA via Sphere API[^3-15^].

**GISTDA environmental monitoring** extends to operational hazard systems. The Flood Monitoring portal (flood.gistda.or.th) provides satellite-derived flood extents from Sentinel-1 SAR, THEOS-2, and MODIS, with API endpoints for 1/3/7/30-day flood layers plus a flood frequency (recurring areas) layer[^3-3^][^3-4^]. The Fire Monitoring portal (fire.gistda.or.th) delivers near-real-time hotspot detection from MODIS (1 km) and VIIRS (375 m), with SMS alerts dispatched within 20 minutes to subscribed officers[^3-3^]. Historical disaster data for both hazards is queryable through the Sphere `disaster-recurring` endpoint by specifying Yala coordinates or province name[^3-1^]. These layers should integrate into the dashboard's Climate Resilience module, activated during hazard events and available on-demand for risk assessment.

| Environmental Layer | Source | URL / Endpoint | Format | Update Frequency | Spatial Resolution |
|---------------------|--------|---------------|--------|------------------|-------------------|
| Reservoir / river levels | RID | app.rid.go.th/reservoir/[^3-12^] | Web tables, ThaiWater API | Real-time (hourly) | Station points |
| Flood extent | GISTDA | flood.gistda.or.th, disaster.gistda.or.th | WMS, REST JSON, STAC | Daily (satellite) | 10–30 m[^3-3^] |
| Fire / hotspot | GISTDA | fire.gistda.or.th | WMS, REST JSON | Near real-time (20 min alerts) | 375 m (VIIRS), 1 km (MODIS)[^3-3^] |
| Land cover (near-real-time) | Dynamic World | GEE: GOOGLE/DYNAMICWORLD/V1 | GEE API | Per Sentinel-2 overpass | 10 m[^3-15^] |
| Land cover (annual) | ESA WorldCover | WorldCover viewer | GeoTIFF download | Annual | 10 m |
| Land cover (national) | GISTDA | sphere.gistda.or.th | WMS, API | Periodic | Variable |
| Watershed boundaries | RID | Regional Office 10 (request) | Shapefile | Periodic | Basin-scale[^9-8^] |
| DEM / terrain | ALOS AW3D30 | JAXA EORC portal[^3-13^] | GeoTIFF | Static | 30 m |
