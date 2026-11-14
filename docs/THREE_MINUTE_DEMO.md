# Three-minute live demonstration

Target duration: 180 seconds. The underlying interactions and exports were browser-tested; this is not a measured human rehearsal or a guarantee of first-time completion time. Use English or Arabic consistently. Do not tour every module.

## Preflight

In the repository, run `npm run dev`, then open http://localhost:5173/. Use the existing Start Mission CTA. Explicitly select Ajloun if a previous session selected Northern Jordan. Select year 2023, all available dates and both sensors; clear incompatible confidence/FRP filters. The map should show 22 detections, not the full-history 143. Do not reimport data, erase storage or change source files. Run verify-claim-audit.mjs for automated path verification; full acceptance commands are in NASA_CHALLENGE_READINESS.md.

## Script and actions

| Time | Actual action | Suggested explanation / expected evidence |
|---|---|---|
| 0–20 s | Start Mission; choose Ajloun | Two satellite sensor families observe thermal activity differently. FIREPULSE preserves those differences while organizing delivered detections into a source-aware calendar and transparent candidate associations. A hotspot is not a confirmed wildfire. |
| 20–45 s | Atlas, year 2023, both sensors/all dates | This scope contains 22 delivered observations: 2 MODIS Aqua and 20 VIIRS across S-NPP/NOAA-20/NOAA-21. The full Ajloun catalog has 143; the selected year is deliberately smaller. UTC dates and source metadata remain intact. |
| 45–70 s | Open Burning Calendar; July 2023; select July 14; download displayed-month CSV | July contains 2 MODIS and 16 VIIRS records. July 14 contains 2 and 11 respectively. The CSV contains 18 monthly observation rows, not only the selected day's rows. Empty dates are unknown coverage, not proof of zero activity. |
| 70–95 s | Open Evidence Engine; Start Guide to restore its 2023 scope | At the exploratory 1 km / 60 minute baseline there are 12 candidate edges, 13 participating observation IDs and 1 connected group. These three quantities answer different questions. The guide restores the intended scope after Calendar interaction. |
| 95–125 s | Inspect the first candidate's source metadata; choose the 1 km / 7 minute sensitivity preset | One Aqua observation at 2023-07-14 10:43 UTC is about 0.708 km and 7 minutes from an S-NPP observation at 10:36 UTC. Changing only the time window from 60 to 7 minutes reduces results to 5 edges, 6 IDs and 1 group. This exposes assumption sensitivity; it does not establish which threshold is scientifically correct. |
| 125–150 s | Expand scientific context / coverage gate | Delivered-date overlap is not proof of co-observation opportunity. We cannot infer missed fires, verified zero days, calibrated anomalies or complete coverage. NOAA-20/21 processing is delivery-declared and discrepancies with current FIRMS documentation remain unresolved. Original rows are retained. |
| 150–180 s | Open Research Brief and export its structured report at 1 km / 7 min | The report carries 22 observations, five candidate edges, original source IDs/provenance, thresholds and limitations. Methodology remains unvalidated; historical-median and anomaly outputs are null. The contribution is a reproducible, source-separated calendar and auditable exploratory comparison, not a universal sensor conversion or fire-event detector. |

## Concrete comparison to show

- MODIS Aqua: 2023-07-14T10:43:00Z, raw version 61.03, FRP 431.4 MW, original confidence 100 (MODIS numeric scheme).
- VIIRS S-NPP: 2023-07-14T10:36:00Z, raw version 2, FRP 177.72 MW, original confidence l (VIIRS low category).
- Exact computed distance: 0.7076524796932839 km; UTC separation: 7 minutes. Both delivered standard-processing records.
- Confidence values are not interchangeable. Do not average the FRPs into a fire intensity estimate. The pair is not independently confirmed to describe one event.

The tested 2023 sensitivity sequence is: 0.25 km/6 min = 0/0/0; 0.5 km/7 min = 0/0/0; 1 km/7 min = 5/6/1; 1 km/60 min = 12/13/1; 2 km/120 min = 22/13/1 (edges / participating IDs / groups). Use only two settings in the timed presentation.

## Scope discipline and recovery

Do not say five Ajloun MODIS records or 31 VIIRS records: those belong to an older pilot snapshot. Do not imply Terra is represented in this selected 2023 Ajloun comparison: its two MODIS records are Aqua. Full input MODIS delivery platform composition is a different scope.

Source handoff to Atlas may intentionally narrow date/sensor selection. Save that optional action until after the timed comparison, or restart the guide before expecting 22 records. Do not describe a transitive connected group as one independent fire. Use Back/Next/Exit/Restart normally; no automatic camera loop is required.

If map tiles are unavailable, disclose that external dependency and use the real Calendar, observation metadata and exports; do not substitute invented points or claim the map was verified in that session. If counts differ, stop and check region/year/date/sensor filters instead of narrating expected numbers over different data.

Official challenge-page access failed during review. Describe alignment with the supplied objectives as conditional; do not claim verified eligibility, submission deadline, NASA endorsement or public deployment. Before submission, obtain current official rules and conduct one timed human rehearsal.
