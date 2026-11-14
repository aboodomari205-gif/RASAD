# FIREPULSE — Final mission review

Review date: 13 November 2026. Scope: repository documentation, scientific implementation, existing acceptance evidence and a fresh local production-browser review. Application code and NASA source observations were not changed. No deployment or release package was produced.

## Decision

**Ready for a scoped technical demonstration; conditionally ready for submission after the MUST FIX items below. Full official challenge compliance remains UNVERIFIED.** The product demonstrates a real, provenance-separated regional detection calendar plus exploratory cross-sensor association and sensitivity analysis. It does not establish a calibrated continuous MODIS/VIIRS fire history. Competition readiness should be framed around this precise contribution rather than the number of modules.

## Official requirements and source verification

The official challenge search result describes a web application integrating MODIS/VIIRS hotspot records into a burning-activity calendar for an area of interest, supporting examination of historical patterns, unusual conditions and critical periods. Both direct challenge URLs returned HTTP 502 during this review. The indexed official summary was retrievable, but detailed obligations, required platforms, judging deliverables and submission rules could not be checked. **Do not infer complete compliance from that summary.**

Sources checked:

- [Official challenge](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/) — indexed summary available; direct page failed.
- [Alternate official challenge URL](https://www.spaceappschallenge.org/2026/challenges/harmonization-of-modis-and-viirs-hot-spots/) — direct page failed.
- [MODIS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_MODIS_Firehotspots.html) — retrieved; supports UTC, numeric confidence and pixel FRP interpretation.
- [VIIRS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_VIIRS_Firehotspots.html) — retrieved; categorical confidence and platform distinctions must remain intact.
- [FIRMS downloads](https://firms.modaps.eosdis.nasa.gov/download/) and [delivery README](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt) — retrieved. Delivery conventions identify MODIS C6.1 and S-NPP VIIRS C2 standard active-fire products; these are not burned-area products.

These references support the limited interpretations above, not archive-specific raw revision decoding, authenticating local downloads, or proving acquisition coverage. No NASA endorsement is implied.

## Demonstrated alignment versus scientific heuristics

| Capability | Evidence | Assessment |
| --- | --- | --- |
| Regional historical detection calendar | `src/calendar/aggregation.ts`, `shared/observations.ts`, actual observed-day browser checks | Demonstrated, with sensor separation and unknown missing days |
| Actual Ajloun observations | 36 records: 5 MODIS, 31 VIIRS; polygon and rendered-point checks | Demonstrated regional sample; observed dates 2020-08-02–2025-10-18 are not complete coverage |
| UTC/source harmonization | Canonical model, shared filters, source-separated aggregates | Demonstrated structural and temporal alignment |
| Candidate correspondence | `shared/evidence.ts`; Haversine distance, exact UTC, compatible processing | Exploratory heuristic; 1 km / 60 min is not calibrated |
| Matching sensitivity | `shared/agreement.ts`, `shared/research.ts` | Demonstrated parameter sensitivity, not accuracy validation |
| Event interpretation | Five default candidate pairs, six participating observations, one connected group | Neither unique fire count nor independently confirmed event count |
| Robustness | Nine edges across tested settings; zero stable across all five, nine sensitive | Conditional on selected settings; not probability or validated confidence |
| Research usefulness | Coverage gate, provenance traces, reproducible research export | Demonstrated transparent verification workflow |
| Critical-period/anomaly inference | Scores deliberately unavailable | Not demonstrated scientifically; historical descriptions alone cannot establish unusual conditions |
| Broad platform/global history | Ajloun and S-NPP-scoped archive demonstration | Not global coverage or verified fulfillment of all platform obligations |

The core innovation is **a traceable path from source-separated calendar observations to candidate cross-sensor relationships, sensitivity and explicit evidence limits**. Presentation should show Calendar early: it is central to the retrieved challenge summary, while most recent demo emphasis is on Evidence Engine.

## Judge journey: 30 and 90 seconds

Actual local production browser checks exercise entry, navigation, real observations, source handoff, thresholds, gate and export. The six-step guide is functional. Fresh review uses `scripts/verify-static-archives.mjs` with the production static directory and the full audit flag; it captures nine routes in desktop and Arabic mobile and verifies the retained map canvas. See `.checkpoints/final-review-browser.log` and the Sprint 6 audit JSON/screenshots.

**30-second comprehension: at risk, not established.** The Earth landing's generic living-Earth message and the Atlas's landscape-first composition do not immediately explain sensor incompatibility or why this product solves it. Evidence Engine is labeled GUIDED DEMO, but still requires entry and index navigation. A first-time judge may see an attractive map before understanding the calendar contribution. This is an expert review finding, not a measured first-user study.

**90-second essential demonstration: technically feasible, human completion unverified.** Automated checks complete the interactions, but automated clicks do not establish human reading or discovery time. Original-source inspection leaves Evidence Engine; returning through Index adds friction. Long scientific sections can exceed the time budget. No independent novice timed trial was performed, so a universal 90-second claim would be unsupported.

Suggested rehearsed sequence: 0–15 s state the sensor problem and enter; 15–30 s show 5/31 and a real calendar day; 30–50 s show candidate pair source/deltas; 50–65 s vary thresholds; 65–80 s explain unknown coverage and verdict; 80–90 s export Research Brief. Treat these as rehearsal targets, not achieved usability measurements.

## Product clarity and redundancy

- Nine modules dilute the central story. Fire DNA and Anomaly Detection are scientifically cautious, but their names suggest richer inference than their descriptive/unavailable outputs provide. Keep them outside the essential presentation path.
- Decision Brief, Scientific Brief and Research Brief have distinct payloads but overlapping names. Judges need one recommended final output: Research Brief. Existing exports need not be removed.
- Agreement Lab, pinned sensitivity and robustness repeat counts at different levels. Explain their roles once: preset comparison, user-selected reference, and edge persistence.
- Historical controls, fingerprints, multiple disclosures and long caveats make Evidence Engine tall on mobile. Essential caveats should remain visible, with secondary detail disclosed progressively.
- Trust the Signal repeats brief navigation. This is minor friction rather than a broken scientific workflow.
- Desktop cartography and Arabic mobile hierarchy are coherent; reviewed screenshots and automated overflow checks support this. Physical-device, screen-reader and non-Chromium acceptance remain outstanding.

## Provenance, integrity and reproducibility

`docs/REAL_DATA_ACTIVATION.md` records 19 MODIS input rows → 5 inside / 14 outside, and 128 VIIRS rows → 31 inside / 97 outside; zero rejected/duplicates in those imports. `docs/NASA_ARCHIVE_AUDIT.json` contains prior immutable ZIP/CSV hashes. Those historical audit records are useful evidence, not a fresh authentication of NASA's delivery chain in this review.

Important distinction: checksums exist in the audit documentation, while current frontend dataset metadata does not supply them. Research export correctly reports these provenance gaps. Bind original archive/CSV hashes, import parameters, boundary checksum and exported dataset IDs in one authoritative manifest before representing independently reproducible delivery integrity as complete.

Raw MODIS `6.03`/`61.03`, VIIRS raw version and shared temperature headers remain opaque source values. Explicit export profiles preserve them; they are not used as temperature aliases in matching. `server/productVerification.js` now permits the explicit named export profiles, whereas the older product-verification document still describes an unconditional import hold. This discrepancy must be reconciled in documentation without claiming the unresolved fields were scientifically decoded.

Research payloads sort source IDs and omit generation-time randomness; unit and browser checks establish repeated export equality. This establishes software reproducibility, not calibration. Unknown acquisition coverage prevents verified-zero activity, missed-fire claims, complete historical trends and validated anomalies. Original confidence scales and raw sensor counts remain non-interchangeable.

## Scored readiness matrix

Reviewer scores, not NASA judging scores. Scale: 0 absent; 1 major gap; 2 partial; 3 credible scoped prototype; 4 strong with limited acceptance gaps; 5 fully evidenced within the stated scope.

| Dimension | Score / 5 | Basis |
| --- | ---: | --- |
| Challenge alignment | 3 | Calendar and source-aware integration demonstrated; full official obligations unverified; calibrated consistent history unavailable |
| Scientific integrity | 4 | Strong limits, provenance and reproducibility; documentation conflicts and unresolved delivery semantics remain |
| Functional completeness | 4 | Real observations and complete guided/export path; inference modules honestly restricted |
| Usability | 3 | Working controls and recovery; deep navigation, long evidence page and overlapping brief names |
| Visual polish | 4 | Coherent Earth/map identity, inspected responsive/RTL presentation |
| Accessibility | 3 | Keyboard/focus/reduced-motion checks; no independent screen-reader or physical-device certification |
| Performance | 3 | Retained map and measured local production operation; large map/3D chunks and no constrained-device benchmark |
| Presentation | 3 | Functional story available; first-30-second message and human 90-second rehearsal not verified |

Do not average these into a scientific-validity percentage. Submission blockers are more important than the total.

## Highest-impact remaining work

### MUST FIX BEFORE SUBMISSION

1. **Reconcile authoritative documentation.** README still claims empty Ajloun data; DATA_PROVENANCE and KNOWN_LIMITATIONS deny activated history; SENSOR_DIFFERENCES denies matching; DEMO_AND_SUBMISSION scripts a Brazil-first unavailable-Ajloun story; NASA_PRODUCT_VERIFICATION retains obsolete blocking/completion findings. Replace the submission-facing narrative with current scope and link historical audit notes clearly. This review intentionally does not edit those files.
2. **Verify full official requirements and submission deliverables.** Retrieve the detailed challenge/rules through an accessible official channel. Record required platforms, scope, attribution, team/project fields and deliverables. Until then mark compliance unverified; do not declare full challenge completion.
3. **Run and record one novice timed rehearsal.** Ask the participant to explain the problem/value at 30 seconds and finish the essential flow in 90 seconds. Use a short calendar-centered script and one named final Research Brief. If comprehension fails, make a small explanatory-copy/discoverability correction, not another architecture sprint.

### SHOULD FIX

1. Connect documented source/boundary/import hashes to the exported dataset provenance manifest; retain unresolved channel/version semantics explicitly.
2. Put Calendar into the short judge path and distinguish the three brief destinations in presentation copy. Reduce repetitive explanation rather than removing scientific limits.
3. Verify a real touch device, screen reader and target browser; measure a constrained network/device before making performance claims.

### OPTIONAL

Consolidate repeated brief links and selectively trim secondary module navigation. Additional VIIRS platforms, event truth studies and coverage integration are future scientific extensions unless official requirements make them mandatory. No new module is needed to close the presentation gaps.

## Final acceptance checklist

Use the existing installation; no credentials or environment-file edits are required for static archive review.

```powershell
npm run build
npm run lint
npm test
npm run test:e2e
npm run test:language
npm run verify:release
node deployment/cloudflare/build-static.mjs .checkpoints/final-review-static
node scripts/verify-static-archives.mjs .checkpoints/final-review-static --audit --after
```

The static builder writes local test assets only. It is not a deployment or ZIP operation. The browser test owns its local server; stop manual servers on port 5179 first. To review visually afterward:

```powershell
node deployment/cloudflare/serve-static.mjs .checkpoints/final-review-static
```

Open `http://127.0.0.1:5179` and confirm:

- [ ] Fresh session starts at Earth; Skip/Enter work; Ajloun is the pilot default.
- [ ] Reset scope shows 36 Ajloun detections, separate 5 MODIS / 31 VIIRS, exact metadata and clickable points.
- [ ] Calendar observed-day selection transfers the actual UTC date to Atlas; missing days remain unknown.
- [ ] Brazil is explicitly fixture-only; Ajloun → Brazil → Ajloun preserves isolation and reconciles filters.
- [ ] Default matching gives 5 pairs / 6 participating observations / 1 group; 6-minute tolerance removes these candidates without claiming no activity.
- [ ] Tested robustness shows 0 stable / 9 sensitive edges, with traceable additions and original source IDs.
- [ ] Unknown coverage and unavailable anomaly claims remain visible; no event, burned-area or calibrated-confidence claims appear.
- [ ] Guide source handoff/resume, Next/Back/Restart/Exit and both scientific/research exports work.
- [ ] Research JSON repeats deterministically for unchanged scope and reports missing checksum metadata.
- [ ] Invalid historical periods do not hide valid matching; historical reports are blocked and guide restart recovers.
- [ ] Arabic RTL, mobile overflow, keyboard focus and reduced motion pass; complete independent device/screen-reader checks separately.
- [ ] Documentation and official requirements blockers above are closed, or remaining uncertainty is explicitly declared in the submission.
- [ ] Record the human 30/90-second rehearsal and actual team/attribution/submission materials.

Sprint 6's executed baseline was 86 passing unit/backend tests plus build/lint/E2E/language/static checks; this review re-exercises the current production browser. The checklist commands are a reproducible submission gate, not a claim that every command was rerun during this documentation-only review. No public deployment verification, global coverage, independent calibration or NASA endorsement is claimed.

**Completion boundary:** close the three MUST FIX items, perform the acceptance run and submit the honestly scoped demonstration. Do not start another open-ended feature sprint to replace missing external scientific evidence.
