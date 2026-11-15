# RASAD NASA acceptance matrix

**Active geography is Brazil only.** Historical South America-wide deliveries remain preserved as source material; only Brazil is exposed by active selectors and default API paths. The statuses below describe evidence/software capability and do not widen the active study area.

DONE applies only to the stated bounded feature, not to full calibration.

| Objective | Status | Actual dataset / feature | Verification | Limitation |
|---|---|---|---|---|
| Real MODIS historical data | DONE | Supplied M-C61 archive, 2000–2026 | Independent raw inventory, import ledger and database yearly sums | Delivered detections; not complete opportunity. |
| Real VIIRS historical data | PARTIAL | Supplied NOAA-20 2018–2026 and NOAA-21 2023–2026 declarations | Every archive member parsed; source/date tables reconciled | S-NPP absent; early dates and Standard lineage unresolved. |
| Unified canonical observations | DONE | All accepted imported strata | Provenance/UTC/confidence/source tests and chunk audit | Source-specific original values retained. |
| Common spatial grid | DONE | Original coordinates, 1/2/5 km cells | Independent ZIP/GEOS/projection HTTP comparison | Authalic-sphere equal area; 31-day exact window. |
| Sensor-aware aggregation | DONE | All active datasets | Full daily/monthly/yearly sum reconciliation | FRP and processing contributions kept separate. |
| Scientifically supported harmonization | DONE | Common grid and UTC source channels | Grid area/set tests and independent comparison | Descriptive integration; no sensor-independent fire series. |
| Cross-sensor calibration status | BLOCKED | Positive hotspot tables only | Input inventory and NASA product review | No opportunity/cloud/fire masks or independent held-out truth. |
| Historical burning calendar | DONE | Full server-side UTC daily/monthly summaries | Production Chrome calendar drill-down; database totals | Missing periods unknown; raw views bounded. |
| Seasonal patterns | DONE | Eligible Standard MODIS source histories | Source-specific heatmap and preceding-year references | Detection-conditioned; no unbiased climatology. |
| Unusual activity/anomalies | PARTIAL | Exact Standard same-month references | Median/rank/percentile/tie/missingness tests | Exposure-aware anomaly and spatial significance map unavailable. |
| Spatial AOI selection | DONE | Brazil country boundary and Brazil H3 pilot | Brazil-only registry/API tests; generalized country boundary | Coastline/border membership is approximate; arbitrary drawn AOI not implemented. |
| Date-range filtering | DONE | Original UTC acquisition dates | API invalid/bounded range and browser filters | Expensive exact analyses/export limited to 31 UTC days. |
| Downloadable data | DONE | Full-window CSV, summary CSV, scoped JSON, calendar SVG | Independent 9,829-row export reconciliation and unit/browser checks | Record-level research briefs identify bounded evidence. |
| Provenance and uncertainty | DONE | SHA-256, original row, source/processing/generation | Manifest reconciliation; inspector browser checks | NOAA lineage warning; unknown opportunity explicit. |
| Functional complete application | PARTIAL | Existing application, five public sections | 152-test suite, production build and representative Chrome checks | Logo absent; all permutations and hosting load not certified. |
| Innovation and scientific value | DONE | Sensor Trust Lens + common-grid sensitivity | Independent grid experiment and transparent exports | Useful descriptive evidence; calibrated inference remains blocked. |
