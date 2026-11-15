# Smallest Brazil pilot delivery checklist

All requests below use **W −57, S −14, E −55, N −12**, EPSG:4326, Mato Grosso, Brazil. No Brazil-wide raster download is requested. The actual August 2024 pilot query contains 6,876 delivered MODIS/VIIRS detections and 152 occupied resolution-6 H3 cells, across 31 observed dates. This establishes useful detection overlap, not matched acquisition opportunity or calibrated labels.

| Exact product | Exact initial dates / smallest useful delivery | Official access | Target under `data/incoming/` | Login |
|---|---|---|---|---|
| FIRMS S-NPP VIIRS 375 m C2 Standard | 2024-08-01–2024-08-31; one bbox CSV/ZIP with Readme | https://firms.modaps.eosdis.nasa.gov/download/ | `firms/viirs_snpp/` | Earthdata archive access |
| MOD13Q1.061 NDVI/EVI, detailed QA and pixel reliability | Composites overlapping 2024-08-01–2024-08-31; bbox subset, preserve composite dates | https://www.earthdata.nasa.gov/data/catalog/lpcloud-mod13q1-061 | `vegetation/ndvi_evi/` | Earthdata |
| MCD12Q1.061 LC_Type1 + QC | 2024-01-01–2024-12-31; one annual bbox subset | https://www.earthdata.nasa.gov/data/catalog/lpcloud-mcd12q1-061 | `vegetation/land_cover/` | Earthdata |
| NASADEM_HGT.001 elevation + quality/void information | Static terrain; smallest bbox-covering subset, retain original acquisition metadata | https://www.earthdata.nasa.gov/data/catalog/lpcloud-nasadem-hgt-001 | `terrain/dem/` | Earthdata |
| ERA5-Land hourly, 2m temperature/dewpoint, 10m u/v wind | 2024-08-01 00:00–2024-08-31 23:00 UTC; four variables, bbox only | https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land | `weather/era5_land/` | CDS account/licence, local API token |
| CHIRPS-2.0 daily rainfall | 2024-08-01–2024-08-31; 31 bbox subsets; insufficient alone for drought baseline | https://www.chc.ucsb.edu/data/chirps/ | `precipitation/chirps/` | No |
| MCD64A1.061 BurnDate, Uncertainty, QA (optional) | 2024-08-01–2024-08-31; one monthly bbox subset | https://www.earthdata.nasa.gov/data/catalog/lpcloud-mcd64a1-061 | `burned_area/mcd64a1/` | Earthdata |
| MOD14/MYD14 C6.1 + MOD03/MYD03 geolocation; VIIRS C2 VNP14IMG/VJ114IMG/VJ214IMG full masks, matching geolocation/cloud/valid-pixel QA | Start with every intersecting overpass for 2024-08-01–2024-08-02, including no-fire overpasses; expand only after paired-support audit | https://search.earthdata.nasa.gov/ | `firms/opportunity/` | Earthdata |

Check provider subset size before downloading; byte sizes have not been verified. Save native files and metadata unchanged. Do not paste credentials into chat. Keep tokens in local ignored configuration. One month establishes a software pilot, not independent year/geography validation; valid calibration will need additional disjoint years and spatial blocks after opportunity review.

Environmental integration currently accepts **extracted JSON point indicators**, not native raster files or arbitrary CSV. Run `node scripts/import-environment.mjs extracted-input.json`. It validates product, physical units/ranges, WGS84 Brazil geometry, UTC validity, declared scaling/QA, source-file existence and SHA256; existing output cannot be overwritten. The pilot API revalidates imported indicators and filters by polygon and selected time interval. Point indicators are not AOI means. Native HDF/GeoTIFF/NetCDF extraction remains unavailable: no input rasters and no numpy/rasterio/GDAL/xarray are installed in the current Python environment. Installing software alone would not provide missing inputs or scientific validation.

No external upload, publication or dataset download was performed. Existing original source paths remain authoritative; no huge copies are needed.
