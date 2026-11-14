# Current demonstration and submission framing

Current verified local demonstration: **36 real Ajloun detections (5 MODIS / 31 VIIRS)** with observed-date extent **2020-08-02 through 2025-10-18**. This is not continuous coverage. Default exploratory 1 km / 60 min matching gives **5 candidate edges, 6 participating observations, 1 connected group**. Across the five tested settings: **9 union edges, 0 stable across all five**. No calibrated sensor equivalence, confirmed fires, validated anomalies or historical median is claimed.

Use the real Ajloun sample, not the synthetic Brazil fixture. The demonstration is calendar-first: original observations - separate contributions on a common UTC calendar - inspect sources - provisional correspondence - sensitivity - limits - reproducible Research Brief.

Follow [30/90-second story](SUBMISSION_STORY.md), [requirements gate](SUBMISSION_REQUIREMENTS_CHECKLIST.md) and [closure acceptance](FINAL_CLOSURE_REPORT.md). The optional Earth introduction and retained MapLibre workspace remain part of the experience. No public hosting or submission is claimed.

Local static operation uses `node deployment/cloudflare/build-static.mjs .checkpoints/final-closure-static` then `node deployment/cloudflare/serve-static.mjs .checkpoints/final-closure-static`. Open http://127.0.0.1:5179. No credentials are required.

Impact is research transparency: aligned source histories with explicit uncertainty and inspectable associations. Do not present descriptive patterns as validated critical-period forecasts. A human 30/90-second rehearsal, actual team fields, required official deliverables and independent device checks remain owner acceptance tasks.
