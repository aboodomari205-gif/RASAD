# Harmonization method

The target descriptive estimand is source-specific observed active grid cells and delivered thermal detections per selected AOI and UTC window. It is not equivalent fire events, burned area, a fire rate or calibrated cross-sensor activity.

Canonical ingestion retains the exact UTC acquisition, original source row, platform, sensor, processing declaration, collection, raw version, confidence, brightness field labels, FRP (MW), scan/track, day/night, country and import generation. MODIS numeric confidence and VIIRS categorical confidence are not converted to a common score. Original export brightness labels are retained without inferring that `brightness` is VIIRS I4 or `bright_t31` is I5.

API `version`/`collectionVersion` denotes the declared canonical collection (MODIS 6.1 or VIIRS 2); `source_version` and `archiveRaw.version` preserve the original field, including 6.03, 61.03 and 2.0NRT. This prevents summary/record stratum mismatches without rewriting the raw delivery.

Exact identity is a 160-bit prefix of SHA-256 over sensor, platform, processing, collection, normalized exact UTC, exact numeric coordinates, source-specific confidence, FRP and original brightness/scan/track/day-night fields. No spatial rounding, proximity matching or time tolerance enters deduplication. Numeric MODIS confidence is retained in full; VIIRS category words/letters normalize only for identity. ZIP/source-file location is not part of identity. Standard and NRT are always different identities; both are retained. Within-platform lineage is kept distinct. The full original archives and duplicate delivery ledger remain available for reproduction.

Experimental grid sizes are 1, 2 and 5 km. Projection is cylindrical equal area on an authalic sphere of radius 6371007.1809 m, standard parallel 30 degrees: x=R*lambda*cos(30), y=R*sin(phi)/cos(30). Negative coordinates use mathematical floor. This is equal-area on the stated spherical model, not an ellipsoidal distance or burned-area estimator. Counts of unique cells are recomputed from all filtered rows in the explicit <=31-day window, separately per dataset; monthly cells are never obtained by summing daily cells. Grid sensitivity changes aggregation, not calibration.

Existing Agreement Lab uses geodesic spatial proximity, exact UTC differences, processing eligibility and explicit configurable thresholds. Associations can be many-to-many and are candidate co-observations, never independently confirmed events or evidence that a sensor missed a fire. Same UTC day does not imply simultaneous overpasses.

Source-balanced evidence pages round-robin deterministically across available datasets to avoid hiding all but the first imported source. They are bounded previews, not random, exposure-weighted or scientifically representative samples. Agreement and record-level briefs apply only to that displayed page. Complete calendar and seasonal summaries query the database separately; exact full-window CSV streams all qualifying rows for <=31 days.

Historical comparisons prefer eligible Standard strata. NRT is provisional and never pooled into a Standard reference. Both processing contributions remain separately identified in calendar detail and exports. Summing contributions is descriptive delivery accounting, not calibration or unique-fire counting.
