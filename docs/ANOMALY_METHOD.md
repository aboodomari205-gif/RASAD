# Historical observed-condition method

Validated exposure-aware anomaly: **unavailable**. Conditional delivered-count comparison: implemented.

For each exact dataset/source/sensor/platform/product/collection/processing/confidence stratum, compare one delivered month with positive delivered observations for the same calendar month in preceding years. Require at least three preceding observed years (user-selectable support 3–10). NRT, unknown provenance and unresolved NOAA-20/21 Standard lineage are ineligible. MODIS Standard strata may have enough supplied history; eligibility is computed from actual rows rather than hardcoded years.

Show the reference periods, reference count, median (including the mean of the two middle values for even n), difference from median, competition rank and denominator, ties, unrepresented prior years and prior maximum. A strictly greater-than-prior-maximum label is a descriptive screen, not a universal emergency threshold or a calibrated probability. Tied maxima are not called new records. Missing months never become zero. Unsupported references show no numerical score.

Positive-delivery selection bias is material: a month without delivered positives is absent from the reference, and acquisition completeness is unknown. Sampling, clouds, exposure and sensor/system changes can explain count differences. Multiple-period screening has no multiple-testing or causal adjustment. A descriptive high count is not a confirmed wildfire emergency, severity estimate, operational warning or forecast.

Sensor Trust Lens and the existing Observed Period Explorer expose these gates, exact years and source-separated summaries. Quality-filtered historical references are unavailable until compatible complete historical filtering is supported; clear those filters to inspect the explicit unfiltered exact-source reference. Quality-filtered daily/monthly summaries and grids are supported for <=31-day windows; large unsupported queries fail clearly rather than using a partial page as a reference.
