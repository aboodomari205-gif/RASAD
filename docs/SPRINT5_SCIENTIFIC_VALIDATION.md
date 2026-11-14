# Sprint 5 — Scientific interpretation and research verification

Implemented in the existing FIREPULSE repository on 13 November 2026. No deployment, release ZIP, source-dataset modification or new dependency was introduced. The existing matcher, exploratory 1 km / 60 minute baseline, MapLibre configuration, cinematic intro and static deployment architecture are preserved.

## New interactive evidence

**Sensor Difference Explorer**, inside Evidence Engine, separates observations by region, sensor, platform, dataset, source, original confidence scheme, product, revision, processing stage and fixture provenance. Expand an observed month to inspect original records and open them in Atlas. Exact UTC availability is counted explicitly. Only observed months are shown: absent months are unknown, never synthetic zero activity. Bars use a within-source scale with labeled counts; they do not compare fire intensity across sensors. Sensor resolution and orbital specifications are explicitly identified as external documentation facts, not measurements inferred from the archive.

**Matching robustness** is a disclosure inside the existing Agreement Lab. It reuses the existing five threshold configurations and matcher. Each direct MODIS–VIIRS edge has a presence/absence vector, original IDs, spatial separation and exact UTC separation. An edge is “stable” only if present in every tested configuration; otherwise it is “threshold-sensitive.” No probability or validated confidence is implied. A change ledger identifies the actual added/removed edges relative to the preceding configuration. This is a parameter comparison, not historical change. Transitive groups remain distinct from direct edges and from independently confirmed events.

For the full current Ajloun scope, the union across these configurations contains **9 edges: 0 stable and 9 threshold-sensitive**. Five edges occur at 1 km / 7 min and 1 km / 60 min; four additional edges occur at 2 km / 120 min. The narrow settings produce no qualifying edges. These are reproducible software results on delivered observations, not scientific validation or evidence that a sensor missed a fire.

**Research Brief** connects the existing sufficiency gate to three unresolved research questions: acquisition coverage, physical-event correspondence and historical comparability. Each includes specific additional evidence and a next verification step. It issues no operational fire alerts. Exports include original observations, source dataset metadata, selected thresholds, methodology, graph, sensitivity/robustness, sensor-separated temporal summaries and limitations.

The judge guide now offers a robustness action during sensitivity exploration and a research-brief export at its final step. Existing guide controls, source-map handoff and scientific-comparison export are retained.

## Reproducibility and provenance

The new export schema is `firepulse.research-brief/v1`. It includes the existing `firepulse.scientific-comparison/v1` payload and a `firepulse.tested-edge-robustness/v1` analysis. Canonical records and source groups are sorted; the research payload contains no generated timestamp or random value. Repeated exports of the same scope and thresholds are equal. Canonical duplicate/conflicting identity behavior is reused from the matcher.

`provenanceGaps` explicitly lists missing dataset metadata or archive checksums. Current Ajloun dataset metadata includes NASA FIRMS source, product, collection/version, dataset identifiers and source field semantics, but **does not supply archive checksums**. These checksums are not fabricated. Independent delivery integrity verification remains outstanding. Checksums supplied by future datasets are preserved in exports.

Original acquisition precision and processing compatibility continue to constrain matching. Fixture observations and records without exact timestamps cannot create candidate associations. Original confidence values and schemes are retained without conversion. No original NASA observation was edited.

## Executed verification

| Command | Result |
| --- | --- |
| `npm run build` | Passed; existing large-chunk advisory remains |
| `npm run lint` | Passed |
| `npm test` | 86 passed, 0 failed |
| `npm run test:e2e` | Passed |
| `npm run test:language` | Passed |
| `npm run verify:release` | Passed local checks; not public deployment verification |
| `node deployment/cloudflare/build-static.mjs .checkpoints/sprint5-static` | Passed; local test output only |
| `node scripts/verify-static-archives.mjs .checkpoints/sprint5-static` | Passed against static assets without Express |

New deterministic tests cover stable/sensitive edges, exact additions and removals in non-monotonic configurations, inclusive distance/time boundaries, direct edges versus transitive groups, duplicate identities, missing timestamps, fixtures, processing incompatibility, sparse months, platform/confidence separation, incomplete provenance, export round-trip integrity, input-order independence and conflicting identity rejection.

Browser regressions verify 9 matrix rows and 19 present cells across the configurations, actual source product/version metadata, 0 stable / 9 sensitive edges, four newly added edges at the widest setting, repeated export equality, conservative zero/anomaly gates, native Enter disclosure activation, original-source trace, Arabic text, mobile overflow, the six-step guide and all existing region round-trips. Existing suites additionally exercise cinematic fallbacks, map points/popups, date/sensor filters, street/satellite switching, Calendar, analytics, language switching and API errors.

Desktop robustness and Arabic mobile research screenshots were inspected. Nested source-detail spacing was tightened after that review. Reduced-motion behavior is inherited from the existing application, and the new disclosures use native controls without continuous animation.

## Local demonstration

From the repository root:

```powershell
node deployment/cloudflare/build-static.mjs .checkpoints/sprint5-static
node deployment/cloudflare/serve-static.mjs .checkpoints/sprint5-static
```

Open **http://127.0.0.1:5179**, enter the mission and select **Index → Evidence Engine**.

1. Start the guide to select the complete Ajloun scope (5 MODIS / 31 VIIRS).
2. Expand **Matching robustness / tested settings** inside Agreement Lab. Inspect the matrix, edge details and change disclosures.
3. Expand **Sensor Difference Explorer**, select a month and inspect an original observation.
4. Review **Research Brief / evidence to verification**, including missing archive checksums, then export the structured report.
5. Switch to Arabic, use the keyboard to open disclosures, and repeat on a mobile viewport.

Stop the local server before running the static browser verifier, which starts its own server. No Express or environment-file changes are required for this static demonstration. No public URL was deployed or verified.

## Exact changed files

Added:

- `shared/research.ts`
- `src/intelligence/ResearchEvidence.tsx`
- `src/intelligence/research.css`
- `tests/research.test.ts`
- `scripts/verify-research.mjs`
- `docs/SPRINT5_SCIENTIFIC_VALIDATION.md`

Modified:

- `src/intelligence/AgreementLab.tsx` — integrate robustness into the existing lab.
- `src/intelligence/EvidenceEngine.tsx` — sensor explorer, source trace metadata, research actions and guarded export.
- `src/intelligence/JudgeGuide.tsx` — robustness focus/open action and research export.
- `src/i18n/evidence-ar.ts` — reviewed Arabic labels and scientific caveats.
- `scripts/verify-region-sensitivity.mjs` — invoke new browser regressions after the existing guide checks.

Reversible source checkpoint: `.checkpoints/sprint5-before/`. Logs, screenshots and temporary static assets reside under `.checkpoints/sprint5-*`; ordinary build output is in `dist/`. No release ZIP was created or modified.

## Remaining scientific limitations

There is no independently validated calibration, acquisition-coverage record, event truth set or anomaly baseline. Raw sensor counts/confidence are not interchangeable. Stable association status is conditional on the finite tested configurations, not universal robustness. Absence of a pair is not a sensor miss or proof of no fire. Connected groups can be transitive and do not count independent fires. No burned area, fire incidence or operational alert is inferred. Archive checksums are absent from current source metadata. Large analyses retain matcher limits and display caps; requests exceeding computation limits must be narrowed. Original specification documentation and independent observations are still needed for stronger conclusions.
