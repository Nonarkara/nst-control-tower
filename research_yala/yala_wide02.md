## Facet: Geospatial & GIS Data Sources for Yala Municipality

### Key Findings

- **GISTDA Sphere** is Thailand's national open geospatial platform providing WMS/WMTS map services, satellite imagery (THEOS-2, Sentinel, Landsat), and APIs for spatial data integration. It serves as the core infrastructure for Thailand's National Spatial Data Infrastructure (NSDI) [^32^][^43^].
- **Royal Thai Survey Department (RTSD)** produces 1:50,000 (L7018) and 1:250,000 topographic maps covering 90%+ of Thailand, with Feature Level Database (FLDB) providing GIS-ready data. Over 200 CORS stations provide real-time kinematic positioning [^13^][^14^][^15^].
- **Land Department (กรมที่ดิน)** operates the LandsMaps system providing digital land parcel data via WMS, with land value assessment data (ราคาประเมิน) available for each parcel [^34^][^36^].
- **OpenStreetMap Thailand** is available via Geofabrik daily extracts (308 MB PBF, 700 MB GeoPackage) with administrative boundaries, road networks, buildings, and POIs for the entire country [^39^][^35^].
- **Google Earth Engine** provides access to multi-petabyte satellite catalog (Landsat, Sentinel, MODIS) via JavaScript Code Editor, Python API, and REST API. Thailand boundary data is available via FAO GAUL [^33^][^37^].
- **Sentinel-2** offers 10m resolution multispectral imagery with 5-day revisit frequency, ideal for Yala's land use/land cover mapping and vegetation monitoring [^109^][^110^].
- **Thailand's Fundamental Geographic Data Set (FGDS)** defines 13 core layers including admin boundaries, transport, water bodies, land use, land parcels, and DEM [^17^].
- **The Yala Comprehensive City Plan (ผังเมืองรวมเมืองยะลา)** defines zoning regulations including residential density, commercial areas, and riparian buffer zones (3m along Huai Ba Mo, 6m along Phru Ba Mo wetlands) [^90^].
- **SRTM DEM** at 30m and 90m resolution is freely available for Yala (within tiles N06E100, N06E101). CGIAR-CSI processed version achieves ~5-8m vertical accuracy [^85^][^89^].
- **ALOS World 3D-30m (AW3D30)** from JAXA provides the most accurate global 30m DSM, available via free registration [^107^][^113^].
- **Thailand's road network** is classified in OSM with national highways (DOH) and rural roads (DRR). The MOT Data Catalog provides shapefile downloads via web services [^363^][^390^].
- **RID maintains GIS databases** for 25+ categories including watershed boundaries, flood-prone areas, river networks, dams, weirs, and cross-section data [^60^][^63^].
- **PWA maintains GIS systems** for water meter locations, pipeline networks, and DMA (District Metering Area) zones, though data access is internal [^84^][^86^].
- **International platforms** (UN OCHA HDX, GeoNode) host humanitarian geospatial data including admin boundaries, hazard maps, and population data for Thailand [^83^][^359^].

---

### Major Data Sources

#### 1. GISTDA Sphere Platform
- **Source**: Geo-Informatics and Space Technology Development Agency (Public Organization)
- **URL**: https://sphere.gistda.or.th
- **Portal**: https://gistdaportal.gistda.or.th
- **Data Available**: 
  - Base maps (WMTS/WMS) - satellite imagery, topographic maps
  - THEOS-2 high-resolution imagery (0.5m panchromatic, 2m multispectral)
  - Flood monitoring (flood.gistda.or.th)
  - Fire/hotspot monitoring (fire.gistda.or.th)
  - Drought monitoring (drought.gistda.or.th)
  - Forest cover change (gfms.gistda.or.th)
  - PM2.5 air quality data integration
  - Poverty mapping data
- **Spatial Resolution**: 0.5m (THEOS-2 panchromatic), 2m (THEOS-2 MS), 10m (Sentinel-2)
- **Coverage**: Thailand + neighboring region
- **Access Method**: WMS/WMTS API, REST API, Sphere Map API (JavaScript library)
- **Update Frequency**: Varies by layer (real-time for flood/fire, periodic for land use)
- **License**: Free for non-commercial use; business use requires license (contact sphere@gistda.or.th)
- **Relevance**: Critical foundation layer for Yala municipal dashboard. Provides base maps, satellite imagery for change detection, and hazard monitoring (flood, fire) [^32^][^40^][^43^][^48^]

#### 2. Royal Thai Survey Department (RTSD)
- **Source**: Royal Thai Survey Department, Royal Thai Armed Forces Headquarters
- **URL**: https://www.rtsd.mi.th
- **Data Available**:
  - 1:50,000 topographic maps (L7018 series, 830 sheets covering entire country)
  - 1:250,000 topographic maps (Series 1501, 52 sheets)
  - 1:25,000 maps for development areas (350 sheets)
  - Digital Elevation Models (DEM)
  - Orthophotos
  - Feature Level Database (FLDB) - GIS vector data with attributes
  - Aerial photographs (historical archives from 1952)
  - CORS network data (200+ stations)
- **Spatial Resolution**: 1:50,000 (contour interval 20m), 1:25,000 (10m contours)
- **Coverage**: 90%+ of Thailand land area
- **Access Method**: Map Information Center (physical/online request), Web Map Service (WMS), digital download (paid)
- **Update Frequency**: Continuous revision program (~100 sheets/year converted to digital)
- **License**: Government use prioritized; public access via request and payment
- **Relevance**: Authoritative base maps and elevation data for Yala municipality planning [^13^][^14^][^15^][^16^][^18^]

#### 3. Department of Lands (กรมที่ดิน)
- **Source**: Thailand Department of Lands
- **URL**: https://landsmaps.dol.go.th
- **Portal**: https://gdcatalog.go.th/dataset/gdpublish-mapland-parcel
- **Data Available**:
  - Digital land parcel boundaries (รูปแปลงที่ดิน)
  - Chanote (title deed) location data
  - Land value assessment (ราคาประเมินรายแปลง)
  - Cadastral maps (1:4,000 scale)
  - WMS layer of land parcels
- **Spatial Resolution**: 1:4,000 (urban), 1:50,000 (reference)
- **Coverage**: Nationwide (all registered land parcels)
- **Access Method**: LandsMaps web application, WMS (for QGIS/ArcGIS), ThaiD/OpenID authentication for detailed data
- **Update Frequency**: Continuous (as transactions registered)
- **License**: Data for display/reference only; not for legal use. Authentication required.
- **Relevance**: Essential for land parcel mapping, property valuation, and land use planning in Yala [^34^][^36^][^42^]

#### 4. OpenStreetMap (OSM) Thailand
- **Source**: OpenStreetMap community
- **URL**: https://download.geofabrik.de/asia/thailand.html
- **Wiki**: https://wiki.openstreetmap.org/wiki/Thailand
- **Data Available**:
  - Road network (classified by highway type)
  - Building footprints
  - Administrative boundaries (province, district, sub-district)
  - Points of interest (schools, hospitals, temples, shops)
  - Waterways (rivers, streams, canals)
  - Land use polygons
- **Spatial Resolution**: Variable (points ~meters, roads ~meters, buildings ~meters)
- **Coverage**: Full country including Yala Municipality
- **Access Method**: 
  - PBF extracts (Geofabrik, daily): thailand-latest.osm.pbf (308 MB)
  - GeoPackage (700 MB), Shapefile (680 MB)
  - Overpass API for queries
  - OSM API for editing/retrieval
- **Update Frequency**: Daily (Geofabrik extracts)
- **License**: ODbL (Open Database License) - requires attribution and share-alike
- **Relevance**: Free, community-maintained data for Yala roads, buildings, and POIs. Admin boundaries available from GISTDA/geoBoundaries integration [^39^][^35^][^46^]

#### 5. Google Earth Engine (GEE)
- **Source**: Google
- **URL**: https://code.earthengine.google.com
- **Data Available**:
  - Landsat 4/5/7/8/9 (30m multispectral, archive from 1972)
  - Sentinel-1 SAR (10m)
  - Sentinel-2 (10m optical)
  - MODIS (250m-1km, daily)
  - SRTM DEM (30m)
  - ALOS DSM (30m)
  - FAO GAUL administrative boundaries (Thailand)
  - Climate data, population data, nighttime lights
- **Spatial Resolution**: 10m-1km depending on dataset
- **Coverage**: Global (including all of Thailand/Yala)
- **Access Method**: 
  - JavaScript Code Editor (browser)
  - Python API (ee package)
  - REST API
  - Cloud processing (no local download needed)
- **Update Frequency**: Near real-time (Sentinel-2: ~5 days), historical archive
- **License**: Free for research, education, and non-profit; commercial use requires license
- **Relevance**: Most powerful platform for analyzing Yala's land use change, vegetation health, urban expansion over time. Thailand boundary: `ee.FeatureCollection('FAO/GAUL/2015/level0').filter(ee.Filter.eq('ADM0_NAME', 'Thailand'))` [^33^][^37^][^38^]

#### 6. Sentinel-2 (Copernicus Programme)
- **Source**: European Space Agency (ESA) / Copernicus
- **URL**: https://dataspace.copernicus.eu
- **Data Available**:
  - Multispectral imagery (13 bands: blue, green, red, NIR, red-edge, SWIR)
  - Surface reflectance products
  - NDVI, NDWI, NDBI indices derivable
  - True color and false color composites
- **Spatial Resolution**: 10m (visible + NIR), 20m (red-edge + SWIR), 60m (atmospheric)
- **Coverage**: Global (56S to 84N), including all of Thailand
- **Access Method**: 
  - Copernicus Data Space Ecosystem (web portal + API)
  - Google Earth Engine (pre-processed)
  - AWS Open Data Registry
  - Python API (sentinelsat library - note: legacy)
- **Update Frequency**: 5 days (with 2 satellites), near real-time
- **License**: Free and open Copernicus data policy
- **Relevance**: Primary satellite data for Yala land cover classification, vegetation monitoring, crop health assessment, urban expansion tracking [^109^][^110^][^292^][^368^]

#### 7. Landsat (USGS/NASA)
- **Source**: USGS / NASA
- **URL**: https://earthexplorer.usgs.gov
- **Data Available**:
  - Landsat 4-5 TM (30m, 1982-2012)
  - Landsat 7 ETM+ (30m, 1999-present)
  - Landsat 8-9 OLI/TIRS (30m, 2013-present)
  - Collection 2 Surface Reflectance
  - Thermal infrared (100m resampled to 30m)
- **Spatial Resolution**: 30m (multispectral), 15m (panchromatic)
- **Coverage**: Global, archive from 1972
- **Access Method**: USGS Earth Explorer (web), USGS LandsatLook Viewer, GEE (cloud)
- **Update Frequency**: 16-day revisit (Landsat 8/9 combined: 8 days)
- **License**: Free and open
- **Relevance**: Long-term archive enables historical land use change analysis for Yala (decades of urban expansion, deforestation, water body changes) [^383^][^384^][^385^]

#### 8. SRTM Digital Elevation Model
- **Source**: NASA / CGIAR-CSI (processed)
- **URL**: https://dwtkns.com/srtm30m/ (30m); http://srtm.csi.cgiar.org (90m)
- **Data Available**:
  - Digital elevation model (bare ground elevation)
  - Processed void-filled version (CGIAR-CSI v4.1)
- **Spatial Resolution**: 30m (SRTM-1), 90m (SRTM-3)
- **Coverage**: Global (60N to 60S), tile-based (1x1 degree for 30m, 5x5 degree for 90m)
- **Access Method**: Direct download (GeoTIFF), web interface, GEE
- **Yala Tiles**: N06E100, N06E101 (30m); N05E095_N10E100 (90m coverage)
- **Update Frequency**: Static (2000 acquisition); processed versions updated periodically
- **License**: Free (US Government product)
- **Relevance**: Elevation data for Yala flood modeling, watershed analysis, slope calculation. CGIAR-CSI version achieves ~5-8m vertical accuracy in Thailand [^85^][^87^][^89^][^93^]

#### 9. ALOS World 3D-30m (AW3D30)
- **Source**: JAXA (Japan Aerospace Exploration Agency)
- **URL**: https://www.eorc.jaxa.jp/ALOS/en/dataset/aw3d30/aw3d30_e.htm
- **Data Available**:
  - Digital Surface Model (DSM, includes buildings/vegetation)
  - Quality assurance mask (cloud/snow/sea flags)
  - Stack number (scene count per pixel)
- **Spatial Resolution**: 30m (1 arc-second)
- **Coverage**: Global (60N to 60S), 1x1 degree tiles
- **Access Method**: Free registration + download (GeoTIFF format)
- **Update Frequency**: Static (processed 2016-2019)
- **License**: Free with registration ( JAXA Terms of Use)
- **Relevance**: More accurate than SRTM for Yala's terrain; includes surface features. Used as reference DEM in Thai flood studies [^107^][^113^]

#### 10. ASTER Global Digital Elevation Model (GDEM v3)
- **Source**: NASA / METI Japan
- **URL**: https://asterweb.jpl.nasa.gov/gdem.asp
- **Download**: NASA Earthdata, USGS Earth Explorer
- **Data Available**: Global DEM at 30m resolution
- **Spatial Resolution**: 30m (1 arc-second)
- **Coverage**: 83N to 83S (99% of Earth's landmass)
- **Access Method**: USGS Earth Explorer, NASA Earthdata Search (free registration)
- **Update Frequency**: Static (v3 released 2019)
- **License**: Free (NASA/METI agreement)
- **Relevance**: Alternative DEM source for Yala; includes water body dataset (ASTWBD) [^108^][^115^][^116^]

#### 11. Department of Rural Roads (DRR) Road Network
- **Source**: Department of Rural Roads (กรมทางหลวงชนบท), Ministry of Transport
- **URL**: https://datagov.mot.go.th/dataset/
- **Data Available**:
  - Rural road network (shapefile/JSON)
  - Road attributes: route code, name, location, physical characteristics, slope details, coordinates
  - Bridge network web service
- **Spatial Resolution**: Vector (line features with coordinates)
- **Coverage**: Nationwide rural roads
- **Access Method**: MOT Data Catalog (JSON, SHP downloads), web services (WMS/WFS)
- **Update Frequency**: Periodic
- **License**: Open government data
- **Relevance**: Yala's rural road network data for connectivity analysis and municipal planning [^390^][^391^]

#### 12. Department of Highways (DOH) Road Network
- **Source**: Department of Highways (กรมทางหลวง), Ministry of Transport
- **URL**: https://datagov.mot.go.th
- **Data Available**:
  - National highway network (1-4 digit highways)
  - Highway service points (rest areas, weigh stations)
  - Road infrastructure data
- **Spatial Resolution**: Vector (line features)
- **Coverage**: All national highways
- **Access Method**: MOT Data Catalog (CSV, shapefile), OSM (integrated)
- **Update Frequency**: Periodic
- **License**: Open government data
- **Relevance**: Highway 410 (Yala-Betong), Highway 409 (Pattani-Yala) connectivity [^363^][^390^]

#### 13. Royal Irrigation Department (RID) Hydrographic Data
- **Source**: Royal Irrigation Department (กรมชลประทาน)
- **URL**: RID internal GIS systems
- **Data Available**:
  - River network and centerlines
  - Watershed boundaries
  - Flood-prone area polygons
  - Dam, weir, bridge, sluice gate locations
  - River cross-section data
  - Hydrological station data (rainfall, discharge, water level)
  - Canal/irrigation network
- **Spatial Resolution**: Variable (1:50,000 to detailed survey)
- **Coverage**: All major river basins in Thailand
- **Access Method**: Direct data request to RID; some data via GISTDA flood portal
- **Update Frequency**: Annual to real-time (hydrological data)
- **License**: Government use; public access via request
- **Relevance**: Critical for Yala flood risk assessment (Sai Buri River basin, Bang Lang Reservoir watershed). RID maintains 25+ GIS layer categories [^60^][^61^][^62^][^63^]

#### 14. Department of Public Works and Town & Country Planning (DPT)
- **Source**: DPT (กรมโยธาธิการและผังเมือง)
- **URL**: https://landuseplan.dpt.go.th
- **Data Available**:
  - Comprehensive city plans (ผังเมืองรวม) for all municipalities
  - Land use zoning polygons
  - Building control lines
  - No-construction zone boundaries
  - Searchable by title deed number, location, plan name, or coordinates
- **Spatial Resolution**: Variable (plan-scale)
- **Coverage**: All 900+ municipalities in Thailand including Yala
- **Access Method**: Web-based Landuse Plan system, mobile app
- **Update Frequency**: Per municipal planning cycle (typically 5 years)
- **License**: Public access for viewing
- **Relevance**: Yala's comprehensive city plan defines residential, commercial, industrial, conservation zones; riparian buffers (3m along Huai Ba Mo, 6m along Phru Ba Mo) [^90^][^117^]

#### 15. Yala Comprehensive City Plan (ผังเมืองรวมเมืองยะลา)
- **Source**: DPT, approved by Ministerial Regulation
- **URL**: https://download.asa.or.th/03media/04law/cpa/mr54-yl-02.pdf
- **Data Available**:
  - Zoning categories: low-density residential, medium-density residential, high-density commercial/residential
  - Riparian buffer zones (3m along Huai Ba Mo creek, 6m along Phru Ba Mo)
  - Prohibited land uses per zone (factories, fuel storage, livestock, cemeteries, etc.)
  - Building density and height restrictions
- **Spatial Resolution**: Plan-level (varies)
- **Coverage**: Yala City Municipality (เทศบาลเมืองยะลา)
- **Access Method**: PDF download from Architects Association
- **License**: Public document (Royal Gazette publication)
- **Relevance**: Directly guides land use decisions and zoning enforcement in Yala municipal dashboard [^90^]

#### 16. Provincial Waterworks Authority (PWA) GIS
- **Source**: PWA (การประปาส่วนภูมิภาค)
- **URL**: https://www.pwa.co.th
- **Data Available**:
  - Water meter locations (GPS coordinates)
  - Water pipeline network
  - District Metering Area (DMA) zones
  - Water pressure data
  - Water quality monitoring points
- **Spatial Resolution**: Sub-meter (GPS coordinates)
- **Coverage**: Provincial service areas (Yala has a PWA branch office)
- **Access Method**: Internal PWA systems; some data via web services
- **Update Frequency**: Continuous (as infrastructure changes)
- **License**: Internal government use
- **Relevance**: Water supply infrastructure mapping for Yala; DMA zones support water loss reduction [^84^][^86^][^91^]

#### 17. Land Development Department (LDD) Land Use Data
- **Source**: LDD (กรมพัฒนาที่ดิน)
- **URL**: https://dinonline.ldd.go.th
- **Data Available**:
  - Land use/land cover maps (Level 3, shapefile format)
  - Soil survey data
  - Data available at sub-district (ตำบล) level
  - Multiple years for change analysis
- **Spatial Resolution**: 1:25,000
- **Coverage**: Nationwide
- **Access Method**: "ดินออนไลน์" (Soil Online) system - search and download shapefiles
- **Update Frequency**: Variable by province (some updated to 2019)
- **License**: Free for non-commercial use; not for legal reference
- **Relevance**: Official land use classification for Yala municipality and surrounding areas [^49^]

#### 18. UN OCHA Humanitarian Data Exchange (HDX)
- **Source**: UN Office for the Coordination of Humanitarian Affairs
- **URL**: https://data.humdata.org
- **Data Available**:
  - Subnational administrative boundaries (Thailand: province, district, sub-district)
  - Population statistics
  - Health facility locations
  - Hazard maps (flood, earthquake)
  - Common Operational Datasets (CODs)
- **Spatial Resolution**: Variable
- **Coverage**: Global (Thailand-specific datasets available)
- **Access Method**: Web download (Shapefile, GeoJSON, CSV, GeoTIFF)
- **Update Frequency**: Varies by dataset
- **License**: Open (Creative Commons), varies by provider
- **Relevance**: Thailand admin boundaries, population data for Yala municipal planning [^83^][^88^][^92^]

---

### APIs & Technical Access

| API/Platform | Endpoint/URL | Protocol | Authentication | Data Format |
|-------------|-------------|----------|---------------|-------------|
| **GISTDA Sphere Map API** | https://basemap.sphere.gistda.or.th/service?key=YOUR-API-KEY | WMTS/WMS | API Key required | Raster tiles (PNG/JPEG) |
| **GISTDA Sphere Raster Tile** | https://sphere.gistda.or.th/docs/web-service/raster-tile | WMTS | API Key | Map tiles |
| **GISTDA NGIS Portal** | NGIS map portal | WMS/WFS/WMTS/WCS/CSW | Government access | Vector, Raster, Metadata |
| **Land Dept WMS** | landsmaps.dol.go.th/wms | WMS | ThaiD/OpenID | GML, Shapefile |
| **Google Earth Engine** | code.earthengine.google.com | JavaScript/Python/REST | Google account | Earth Engine objects |
| **USGS Earth Explorer** | earthexplorer.usgs.gov | Web/ SOAP API | Free registration | GeoTIFF, HDF |
| **Copernicus Data Space** | dataspace.copernicus.eu | OData API, OpenSearch | Free registration | SAFE, GeoTIFF, NetCDF |
| **OpenStreetMap Overpass** | overpass-api.de/api/interpreter | Overpass QL | None | JSON, XML, CSV |
| **Geofabrik Thailand** | download.geofabrik.de/asia/thailand.html | HTTP download | None | PBF, SHP, GPKG |
| **MOT Data Catalog** | datagov.mot.go.th | REST API, Download | None | JSON, SHP, CSV |
| **DPT Landuse Plan** | landuseplan.dpt.go.th | Web portal | None | Web-based query |
| **HDX** | data.humdata.org | CKAN API | Free account | Multiple formats |
| **RTSD Map Service** | rtsd.mi.th (Map Information Center) | WMS | Registration | Raster, Vector |
| **PWA Internal GIS** | Internal systems | WMS | Internal | Vector (pipeline network) |

---

### Trends & Signals

- **Shift to Cloud-Based GIS**: Thailand is transitioning from standalone GIS systems to cloud-based National Geo-informatics Infrastructure (NGIS) under GISTDA leadership, with WMS/WFS services being the standard distribution method [^17^][^43^].
- **THEOS-2 Satellite Constellation**: GISTDA launched THEOS-2 in 2023, providing 0.5m resolution imagery with 2-day revisit over Thailand, significantly improving domestic Earth observation capability [^41^].
- **Open Data Movement**: Multiple Thai agencies now provide open geospatial data through portals (MOT Data Catalog, DPT Landuse Plan, LDD Soil Online), though data quality and completeness vary [^390^][^117^][^49^].
- **Real-Time CORS Network**: Thailand's CORS network expansion to 210+ stations enables centimeter-level real-time positioning, supporting precision cadastral surveys and infrastructure mapping [^17^][^21^].
- **GEE Adoption for Municipal Analysis**: Google Earth Engine is increasingly used by Thai researchers for municipal-level land use change analysis, offering cloud-based processing without heavy local infrastructure [^33^][^118^].
- **Flood Risk Driving GIS Demand**: The 2011 Thailand floods catalyzed GIS infrastructure development; RID's Smart Water Management Platform demonstrates integrated flood forecasting using DEM, satellite imagery, and real-time sensor data [^60^][^63^].

---

### Controversies & Limitations

- **Data Access Restrictions**: Many Thai government geospatial datasets (RTSD topographic maps, Land Department parcel data) require government affiliation, payment, or formal request letters, limiting municipal-level access [^15^][^34^].
- **Deep South Data Sensitivity**: Yala's location in the southern border provinces means some geospatial data (security installations, military checkpoints) may be restricted or generalized for security reasons [^382^].
- **Vertical Accuracy of DEMs**: SRTM 30m has ~5-16m vertical error; ALOS AW3D30 offers better accuracy but is a DSM (includes buildings/trees) not a DTM, requiring correction for hydrological modeling [^89^][^62^].
- **Cloud Cover Issues**: Yala's tropical location means frequent cloud cover in optical satellite imagery; Sentinel-1 SAR data (radar) can penetrate clouds but has different characteristics [^62^].
- **Administrative Boundary Discrepancies**: OSM Thailand admin boundaries may have gaps or inconsistencies; official boundaries from DOPA/GISTDA should be used for authoritative municipal work [^35^].
- **Coordinate System Complexity**: Thailand uses multiple datums (WGS84 for GPS, Indian 1960 for older maps, local grid systems); transformation may be needed when integrating datasets [^18^][^21^].
- **PWA Pipeline Data Gap**: Water pipeline GIS data is held internally by PWA and not publicly available; municipalities need formal MOU or data sharing agreements to access [^84^][^86^].

---

### Recommended Deep-Dive Areas

| Area | Why It Warrants Depth |
|------|----------------------|
| **GISTDA Sphere API Integration** | Primary data source for base maps and satellite imagery; API key access and WMTS integration need hands-on testing for Yala dashboard |
| **Land Department WMS Integration** | Land parcel data is critical for municipal tax, zoning enforcement; need to test WMS access in QGIS/ArcGIS for Yala area |
| **GEE Land Use Change Analysis** | Historical Landsat/Sentinel archive enables decadal analysis of Yala's urban expansion; Python notebook approach recommended |
| **RID Flood Risk Data** | Yala's flood vulnerability makes RID watershed and flood zone data essential; requires direct agency contact for full dataset |
| **DPT Zoning Compliance System** | City plan enforcement requires automated checking of construction permits against zoning polygons; API integration opportunity |
| **ALOS DEM for Flood Modeling** | 30m DSM + hydrological processing (fill sinks, flow accumulation) needed for Yala flood inundation mapping |
| **OSM Data Quality in Yala** | Road network completeness, building footprint coverage, and POI accuracy need field validation for municipal use |

---

### Source List

[^13^] https://grokipedia.com/page/royal_thai_survey_department - Royal Thai Survey Department overview
[^14^] https://geospatial.com/country_profiles/thailand/ - Thailand country mapping profile (Geospatial World)
[^15^] https://unstats.un.org/unsd/geoinfo/RCC/docs/rccap19/crp/E_Conf.102_CRP6_Thailand%20Country%20Report%20.pdf - Thailand Country Report to UNRCC-AP 19th Session
[^16^] https://www.rtsd.mi.th/main/wp-content/uploads/2016/11/document-1.pdf - RTSD Map Data and Topographic Map catalog
[^17^] https://www.fig.net/resources/proceedings/2016/2016_10_AP_CDN/1.7_Thailand_GISTDA.pdf - Status of Thailand's Geospatial Data Infrastructure (GISTDA/FIG)
[^18^] https://unstats.un.org/unsd/geoinfo/rcc/docs/rccap18/CRP/18th_UNRCCAP_econf.100_crp%2015.pdf - Thailand Cartographic Activities Report 2007-2009
[^21^] https://un-ggim-ap.org/sites/default/files/media/meetings/Plenary04/201605/W020161129693306748865.pdf - Thailand Geospatial Report 2013-2015 (UN-GGIM-AP)
[^32^] https://gistdaportal.gistda.or.th/ - GISTDA Portal
[^33^] https://alice-lab.com/thsf-gee-2/ - Google Earth Engine Access and Usage Guide
[^34^] https://gdcatalog.go.th/dataset/gdpublish-mapland-parcel/resource/2a1fca32-4d51-4641-a8af-4487fb996f5c - LandsMaps Land Parcel Search System
[^35^] https://community.openstreetmap.org/t/administrative-boundaries-of-districts-in-thailand/118876 - OSM Thailand Administrative Boundaries Discussion
[^36^] https://www.youtube.com/watch?v=b2127UuYDkU - Land Dept WMS in QGIS Tutorial
[^37^] https://dlab.berkeley.edu/news/mapping-time-series-satellite-images-google-earth-engine-api-1 - Mapping Time-Series with GEE API
[^38^] https://medium.com/@khadijamahanga/extracting-satellite-images-from-google-earth-engine-gee-193557edab16 - Extracting Satellite Images from GEE
[^39^] https://download.geofabrik.de/asia/thailand.html - Geofabrik Thailand OSM Download
[^40^] https://sphere.gistda.or.th/terms - GISTDA Sphere Terms of Use
[^41^] https://www.gistda.or.th/download/article/article_20230207093143.pdf - GISTDA Products/Services (THEOS-2, ground stations)
[^43^] https://www.unescap.org/sites/default/files/event-documents/Thailand%20.pdf - Thailand Country Statement (ESCAP Regional Space Plan)
[^46^] https://atlas.co/data-sources/geofabrik/ - Geofabrik data source profile
[^48^] https://www.gistda.or.th/news_view.php?n_id=6705&lang=EN - GISTDA Sphere API Service announcement
[^49^] https://dinonline.ldd.go.th/ - LDD Soil Online / Land Use Data Download
[^60^] https://icid-ciid.org/icid_data_web/WIF4-Full-Papers2025/wif4_w.2.3.06.pdf - RID Smart Water Management Platform
[^61^] https://www.witpress.com/Secure/elibrary/papers/SD15/SD15091FU2.pdf - GIS flood volume estimation (RID data)
[^62^] https://ir.buu.ac.th/dspace/bitstream/1513/622/1/63910066.pdf - Flood risk mapping using Sentinel-1 and HEC-RAS
[^63^] https://openjicareport.jica.go.jp/pdf/12127213_01.pdf - JICA Master Plan Study (Chao Phraya Basin GIS Data)
[^64^] https://www.sciencedirect.com/science/article/abs/pii/S0966692312002888 - Road network connectivity in Lop Buri (DRR/DOH data)
[^83^] https://atlas.co/data-sources/humanitarian-data-exchange/ - Humanitarian Data Exchange profile
[^84^] https://datascience.cmu.ac.th/storage/articles/22.pdf - PWA Water Meter GIS Development (CMU)
[^85^] https://csidotinfo.wordpress.com/data/srtm-90m-digital-elevation-database-v4-1/ - CGIAR-CSI SRTM 90m DEM
[^86^] https://www.witpress.com/Secure/elibrary/papers/WS17/WS17014FU1.pdf - MWA Water Quality GIS Platform
[^87^] https://csuwan.weebly.com/360436343623360936603650362736213604--download.html - Thailand road network shapefile download (academic)
[^88^] https://guides.library.brandeis.edu/c.php?g=990410&p=7534576 - Humanitarian GIS Data Research Guide
[^89^] https://www.sciencedirect.com/science/article/abs/pii/S0034425706002008 - SRTM accuracy assessment in Thailand
[^90^] https://download.asa.or.th/03media/04law/cpa/mr54-yl-02.pdf - Yala Comprehensive City Plan (Ministerial Regulation)
[^91^] https://neda.or.th/2023//upload/download/file/file-1518421996216-Thai-562.pdf - PWA Water Utility Management
[^92^] https://www.un-spider.org/links-and-resources/data-sources/humanitarian-data-exchange-humdata-unocha - HDX on UN-SPIDER
[^93^] https://dwtkns.com/srtm30m/ - 30m SRTM Downloader
[^107^] https://gisgeography.com/free-global-dem-data-sources/ - 5 Free Global DEM Data Sources
[^108^] https://www.mdpi.com/2072-4292/12/7/1156 - ASTER GDEM and ASTWBD (MDPI Remote Sensing)
[^109^] https://www.oecd.org/content/dam/oecd/en/publications/reports/2022/06/monitoring-land-use-in-cities-using-satellite-imagery-and-deep-learning_962d2cdd/dc8e85d5-en.pdf - OECD Land Use Monitoring with Sentinel-2
[^110^] https://www.mdpi.com/2072-4292/12/14/2291 - Sentinel-2 for Land Cover Mapping Review
[^113^] https://www.eorc.jaxa.jp/ALOS/en/dataset/aw3d30/aw3d30_e.htm - ALOS World 3D-30m Dataset
[^115^] https://lpdaac.usgs.gov/documents/434/ASTGTM_User_Guide_V3.pdf - ASTER GDEM v3 User Guide
[^117^] http://plludds.dpt.go.th/ - DPT Landuse Plan System (redirects to landuseplan.dpt.go.th)
[^118^] https://ijg.e-geoinfo.com/index.php/journal/article/view/3225 - Land Use Change in Pathumthani using Landsat (methodology applicable to Yala)
[^292^] https://atlas.co/data-sources/copernicus-open-access-hub/ - Copernicus Open Access Hub profile
[^359^] https://geosolutionsgroup.com/technologies/geonode/ - GeoNode platform overview
[^360^] https://un-spider.org/links-and-resources/data-sources/copernicus-open-access-hub - Copernicus Open Access Hub on UN-SPIDER
[^363^] https://wiki.openstreetmap.org/wiki/Thailand/Transportation - OSM Thailand Road Classification
[^368^] https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-2 - Sentinel-2 on Copernicus Data Space
[^382^] https://patricklepetit.jalbum.net/PATTANI/LIBRARY/Democracy%20and%20conflict.pdf - Democracy and Conflict in Southern Thailand (Deep South context)
[^383^] https://www.un-spider.org/links-and-resources/data-sources/landsat-usgs - Landsat on UN-SPIDER
[^385^] https://simplygis.in/2025/12/01/how-to-download-landsat-satellite-data-from-usgs-earth-explorer/ - Landsat Download Guide
[^387^] https://csuwan.weebly.com/360436343623360936603650362736213604--download.html - Thailand shapefile downloads (roads, rivers)
[^390^] https://datagov.mot.go.th/dataset/ - MOT Data Catalog (DRR/DOH datasets)
[^391^] https://datagov.mot.go.th/en/dataset/?tags=GIS - MOT GIS Datasets
[^393^] https://sphere.gistda.or.th/docs/web-service/raster-tile - GISTDA Sphere Raster Tile API Documentation
