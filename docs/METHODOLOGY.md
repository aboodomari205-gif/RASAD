# Scientific methodology

FIREPULSE is a descriptive satellite-observation application, not a validated wildfire prediction or dispatch system. No NASA endorsement or independent scientific validation is claimed.

## Observation unit and aggregation

One record is a source thermal-pixel detection. It is not necessarily a unique physical fire, confirmed wildfire or burned area. Canonical observations retain dataset identity, sensor/platform, acquisition UTC, WGS84 position, nullable FRP, raw confidence and provenance. Shared `filterObservations` applies region, date/time, sensor, platform, dataset, confidence, FRP and bounding-box scopes. FRP bounds exclude missing FRP; a reported zero is retained. Exact duplicates use the shared sensor/product-aware hash; spatially adjacent or cross-sensor records are never merged into an event.

Daily/monthly/yearly series stay separate by dataset, instrument, platform, product, processing, version, confidence scheme and source. Counts describe delivered detections. Reported FRP sums are MW and expose reporting completeness; they are neither energy nor comparable normalized fire intensity. Numeric zero alone must be interpreted with the bucket status. Only explicit verified, complete coverage can establish a covered zero; missing dates remain unavailable. Current CSV imports provide no verified coverage.

## Harmonization and charts

`firepulse.sensor-alignment/v1` aligns raw provenance-separated series in UTC calendar periods. It does not calibrate sensors, match events, estimate disagreements, calculate sensor conversion factors or establish observation opportunities. Resolution is nominal; scan/track and acquisition metadata remain raw. Source charts use separate scales; a visual height comparison is not a calibrated intensity ratio. The Season Clock selects a primary year, with multi-year source tables. Ring size is logarithmic for legibility; exact values are available in the table. Hollow marks indicate unavailable/not reported values. No climatological normal is displayed.

Season year checkboxes select comparison rows within the shared UTC date range; unselected years are omitted, not rendered as missing/zero activity. Brief/export and other modules retain the explicit shared From/Through window shown in their controls, including intervening years. A month drilldown explicitly narrows that shared window. Missing FRP produces a hollow FRP-ring mark rather than a fabricated zero-power signal.

## Fire DNA and anomaly gate

Fire DNA requires at least two observed years **within one comparable real standard-processing dataset/sensor/platform/product/collection/source series**. Fixture and NRT data do not qualify. This is a conservative software prerequisite for a descriptive monthly fingerprint, not validation of recurrence, complete annual coverage or risk. No recurrence statistic or prediction is produced.

`firepulse.baseline-eligibility/v1` reports missing prerequisites: observations, non-fixture provenance, comparable series, exploratory observed-year count, complete source availability, verified platform-specific coverage and an independently reviewed scoring method. The three-year screening threshold is **not a scientifically sufficient baseline**. Full-window sampling and seasonality still need scientific review. Numerical scores and baselines remain null; no scoring method is activated, even if synthetic tests satisfy some prerequisites. Tests establish software behavior only.

## Decision Brief

The brief summarizes the current scope, separate source groups, actual acquisition metadata, availability and limitations. Its generation time is explicitly separate from observation freshness. CSV contains canonical provenance, raw confidence, nullable FRP and fixture labeling; cells are quoted and spreadsheet-formula prefixes neutralized. Print/copy are user-triggered; no operational recommendation is inferred.

Primary sources: [NASA MODIS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_MODIS_Firehotspots.html), [NASA VIIRS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_VIIRS_Firehotspots.html), [FIRMS archive downloads](https://firms2.modaps.eosdis.nasa.gov/download/). See [sensor differences](SENSOR_DIFFERENCES.md), [provenance](DATA_PROVENANCE.md) and [archive procedures](../ARCHIVE_INGESTION.md).
