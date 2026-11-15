# RASAD challenge-core / AI delivery — 2026-11-15

This is the current delivery evidence and supersedes older statements that no ML model was implemented. Brazil-only scope and the original data/checkpoints are preserved. Full cross-sensor calibration, downscaling and reconstruction remain **NOT VALIDATED**.

## Status

| Component | Actual delivery |
|---|---|
| Common-support harmonization | Existing source-preserving 1/2/5 km equal-area, H3, real Atlas/calendar, source/date/quality controls retained |
| Descriptive comparison | Four real MODIS/VIIRS source-pair H3/day comparisons, actual paired count/FRP rows, source-only delivery counts and Jaccard |
| Actual ML | Trained 60-tree gradient boosting model on 282 real positive cell-days; 306 temporal, 252 spatial and 148 joint holdout rows |
| Experimental target | Mean reported FRP conditional on actual source-positive H3 cell-day; not forecasting or sensor adjustment |
| Calibration / downscaling / reconstruction | BLOCKED / NOT VALIDATED; absent opportunity masks, environmental inputs, independent validation |
| Interface | Research panel in Activity Intelligence, Sensor Harmonization and Research & Export; real metrics, limitations, held-out estimate selector, pipeline, JSON/print |
| Original four pillars | Actual observations, environmental availability, observed occupancy progression and descriptive evidence/export remain; no generic risk/dispatch feature added |
| Reproducibility | Small real derived support packet, checksum, tree artifact, evaluation JSON and Node-only training script; no Python package assumption |
| GitHub | Intended remote confirmed by user: `https://github.com/aboodomari205-gif/FIREPULSE.git`; remote access initially returned Repository not found. Final push state recorded below when attempted. |

## Actual metrics

| Holdout | n | Baseline MAE MW | ML MAE MW | Baseline RMSE MW | ML RMSE MW |
|---|---:|---:|---:|---:|---:|
| Temporal | 306 | 24.003 | 27.216 | 54.775 | 59.370 |
| Spatial | 252 | 24.855 | 23.889 | 80.374 | 80.520 |
| Joint temporal/spatial | 148 | 16.561 | 16.472 | 39.198 | 42.450 |

Mixed results are shown in the UI and README, including worse temporal performance. No metric was fabricated, no absent hotspot was labeled a confirmed negative, and no conditional ML result was called validated calibration. Exact split, feature schema, source strata, target and caveats: [method](RASAD_RESEARCH_MODEL.md).

## Exact new sprint changes

- `shared/researchModel.js`: real group/label preparation, deterministic spatial/temporal split, overlap analysis, gradient-boosting training, inference and metrics.
- `scripts/train-research.mjs`: bounded original-data training and checksum-verified bundled real-support replay; actual artifacts.
- `models/brazil-frp-model.json`, `models/brazil-frp-evaluation.json`, `models/brazil-pilot-samples.json`: actual fitted parameters, held-out evidence and real derived samples.
- `server/research.js`, `server/app.js`: bounded inference/evaluation API; generation mismatch guard, explicit archive availability.
- `server/southAmerica.js`: export bounded original-row research stream.
- `src/intelligence/ResearchPrototype.tsx`, `src/intelligence/IntelligenceWorkspace.tsx`, `src/design/rasad-workspace.css`: integrated bilingual research workflow, pair table, metrics, actual held-out predictions and report export.
- `src/intelligence/printEvidence.ts`, `src/intelligence/BrazilPilot.tsx`: select the actual research/pilot report for printing. Existing print CSS only exposed the old Decision Brief; that would hide the new report. Explicit print targeting now fixes this and restores page state after printing.
- `tests/researchModel.test.ts`: label semantics, target exclusion, bounds, artifact identity, disjoint support and independently reproduced real errors.
- `tests/pilot.test.ts`: private-index integration skip on installations without the original data.
- `scripts/verify-rasad-batch1-browser.mjs`: actual research-panel browser/export/mobile checks.
- `scripts/verify-git-delivery.mjs`, `.gitignore`: staged blob checks, private/raw/credential exclusions and size limits.
- `package.json`: runnable `train:research` command.
- `README.md`, this report, `RASAD_RESEARCH_MODEL.md`, current execution status and four vetted screenshot assets under `docs/screenshots/`.

The release commit also includes the existing uncommitted Brazil migration/application work from earlier batches; original checkpoints and source backups remain outside Git. Full commit diff is the authoritative aggregate change list.

## Verified commands

Actual original-row training: `node scripts/train-research.mjs` completed, read 6,876 pilot records, produced 988 labels and actual model artifacts. A pre-training split feasibility check failed with no joint holdout; it was corrected before fitting. No favorable-metric retraining was performed.

`node --test tests/researchModel.test.ts` independently reproduced raw-data sample identity, held-out errors and no-leakage checks. Full suite/build/release/browser results and staged audit are recorded in the final acceptance update below.

Real Chrome research verification on `http://localhost:4190` passed panel metrics, all four source pairs, actual downloaded report, example selection, mobile LTR/RTL and screenshots. Local evidence: `.checkpoints/rasad-ai/browser-proof.json`; downloaded report: `.checkpoints/rasad-ai/downloads/rasad-research-prototype.json`. Browser Chrome needed the previously authorized execution outside the sandbox. Public screenshots contain actual rendered NASA-source results and no credentials.

## Hosting and external blockers

No public application deployment, external dataset upload or paid service was performed. GitHub source/model delivery is authorized separately. GitHub CLI is not installed; Git Credential Manager is configured. The intended remote returns Repository not found, which can indicate an inaccessible private repository or a missing/incorrect repository; no credentials were printed. The user was asked to make that repository available locally or provide its correct link without sending secrets.

Full original history/maps still require the local ignored multi-GB indexed archive or a properly hosted durable API. The small research artifact can be inspected and retrained without that archive; it does not create original map observations. This distinction is explicit in README and UI.

## Final acceptance update

- `npm test`: **161 passed, 0 failed, 0 skipped** on this machine with the original index. Logs: `.checkpoints/rasad-ai/tests.log`.
- `npm run build`: passed on the final code; existing large MapLibre/Three chunk warnings remain.
- `npm run lint`: exit 0 with **10 existing warnings**, no clean-warning claim.
- `node scripts/verify-release.mjs`: passed Brazil-only registration/assets, worker packaging and server/client configuration separation.
- Full five-section Chrome verification, `--pilot`, and `--research`: passed against the actual local production build. Dedicated research verification also checks the print button's selected report, visible print layout and an **actual generated PDF**, not just a click handler.
- Artifact packet: **576,307 bytes total** across three JSON files. No multi-GB archive or original raw NASA input is included in this packet.
- Final built frontend: **5,412,229 bytes** uncompressed; the private indexed archive is not a frontend asset. Public deployment remains unperformed.
- `node scripts/verify-git-delivery.mjs`: staged source audit passed, with **0 detected secret patterns, 0 private/raw files**, all staged files under 20 MiB. This is a bounded pattern/size check, not a guarantee that all historical Git objects contain no secrets.
- Delivery branch: `delivery/rasad-brazil-ai-20261115`. Intended remote confirmed by user. GitHub CLI is absent; Git Credential Manager can see the intended account when run outside the sandbox. Remote access still returns **Repository not found**, so successful push cannot be claimed without resolving repository existence/access.

No generic risk model or fabricated reconstruction was added. The actual trained conditional model, comparison evidence and mixed validation results are the delivered research prototype.
