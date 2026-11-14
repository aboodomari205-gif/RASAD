# Judge readiness pass

13 November 2026. Scope: minimal judge-facing wording and labeling over the verified prototype. **GO for the locally verified, explicitly scoped demonstration.** This is not verified official submission compliance. No new observations, imports, modules, scientific algorithm changes, dependency installations, deployment, publication or ZIPs were introduced.

## Claim audit and changes

Read `FINAL_CLOSURE_REPORT.md`, `FINAL_DATA_SATELLITE_AUDIT.md`, `SUBMISSION_STORY.md` and `SUBMISSION_REQUIREMENTS_CHECKLIST.md` before changes. The row-level audit establishes Terra and Aqua in the full MODIS delivery, but **all five inside-Ajloun MODIS detections are Aqua**; all **31 inside-Ajloun VIIRS detections are S-NPP**. Original source records remain unchanged.

| Surface | Claim review | Action |
| --- | --- | --- |
| Earth landing | Previous generic orbit/planet text did not explain the sensor problem or calendar contribution | Replace only the short description; retain title, composition, imagery attribution and Enter controls |
| Atlas | Source header and record metadata derive actual platform fields; no current-Ajloun Terra detections were asserted | No map/layout/data changes |
| Calendar | Both-source contributions are separate; unknown source/day is not zero; shared UTC day is not simultaneous/event confirmation | Add explicit full-delivery versus inside-Ajloun platform statement and coverage caveat |
| Evidence Engine | Matching remains exploratory, groups remain transitive candidates, baseline/anomaly limits remain visible | Add the same explicit scope statement when Ajloun records are present |
| Research Brief | Original observation platforms, source datasets, thresholds, provenance gaps and verification questions are retained; no operational alerts | Preserve existing interface and deterministic payload; audited against actual platforms |
| Guided demo | Real-observations step previously omitted the Terra/Aqua distinction | State actual platforms and delivered-versus-complete-coverage boundary; preserve controls and source return flow |
| Arabic | New English copy needs equivalent scientific meaning | Add reviewed Arabic strings for the short explanation and full platform/scope statement |

The newly visible statement says the **delivery** includes Terra/Aqua and the **current pilot detections** are Aqua/S-NPP. It is a fact about the audited full archive/pilot, not a promise that every filtered view contains all 36 records. Brazil views do not display the Ajloun claim. Original confidence scales, FRP meanings, unsupported temperature/version interpretations and missing-coverage restrictions remain intact.

## First explanation and reading budget

New landing description:

> MODIS and VIIRS see thermal activity differently. FIREPULSE aligns their delivered observations on one UTC calendar, preserving each source and its uncertainty.

This is 22 whitespace-separated words: approximately 10–15 seconds at a conservative 100–150 words/minute, comfortably within a 30-second reading budget. This is a reading-length estimate, **not measured first-time comprehension**. The existing title remains cinematic; the new description now states the actual NASA problem and bounded contribution. Arabic carries the same meaning. A human novice rehearsal remains an owner acceptance item.

## Judge path and actual verification

Use the existing path: **Enter Mission → Index → Burning Calendar → October 2020 → Both sources / separate contributions → Download displayed month CSV → Index → Evidence Engine → Research Brief**. Starting the existing guide restores full Ajloun scope if previous day/sensor filters remain active.

Existing production-browser acceptance visits the real Calendar, selects October 2020, verifies one MODIS and one VIIRS contribution, parses CSV and original IDs, tests individual/both modes and Atlas handoff, then exercises evidence/guide/research export workflows. The guide and research checks validate actual payload counts and reproducibility; no static mockup substitutes for these interactions. The route audit visits all nine routes in desktop and Arabic mobile while checking retained MapLibre identity and viewport width.

Executed commands:

```powershell
npm run build
npm run lint
npm test
npm run verify:release
node deployment/cloudflare/build-static.mjs .checkpoints/judge-readiness-static
npm run test:e2e
npm run test:language
node scripts/verify-static-archives.mjs .checkpoints/judge-readiness-static --audit --after
```

Build, lint, **89 unit/backend tests**, release verification and the static test build passed. Build retains the existing large-chunk advisory. E2E, language and static production-browser acceptance all passed, including 18 desktop/Arabic mobile route checks and no uncaught exceptions in the static suite. Browser result logs are `.checkpoints/judge-e2e.log`, `judge-language.log` and `judge-browser.log`; these record the executions in this pass, rather than inferred prior sprint results.

Screenshots: E2E creates `firepulse-earth-desktop.png` and `firepulse-earth-mobile.png` in the OS temporary directory. Production audit refreshes `.checkpoints/sprint6-desktop-*.png` and `sprint6-ar-mobile-*.png`. Combined-calendar acceptance captures `.checkpoints/closure-calendar-ar.png`; research acceptance captures `.checkpoints/sprint5-research-mobile.png`. These names are existing verification outputs, not claims that the code is from those historical sprint versions.

## Exact changed files

- `src/components/EarthLanding.tsx` — short problem/contribution description only.
- `src/calendar/BurningCalendar.tsx` — actual platform scope and coverage wording.
- `src/intelligence/EvidenceEngine.tsx` — actual Ajloun platform scope and coverage wording.
- `src/intelligence/JudgeGuide.tsx` — precise real-observation step.
- `src/i18n/evidence-ar.ts` — Arabic equivalents.
- `docs/JUDGE_READINESS_REPORT.md` — this report.

Reversible source checkpoint: `.checkpoints/judge-readiness-before/`. Local build output is under `dist/` and `.checkpoints/judge-readiness-static/`; no release package was prepared.

## Local review and remaining acceptance

```powershell
node deployment/cloudflare/serve-static.mjs .checkpoints/judge-readiness-static
```

Open **http://127.0.0.1:5179** and follow the exact judge path above. Stop a manual server on port 5179 before automated verification, which starts its own server.

Remaining: independently verify actual official submission rules/required assets, conduct the human 30/90-second rehearsal, and complete physical-device/screen-reader/target-browser checks. Current observations do not establish continuous 2000-to-present history, complete acquisition coverage, calibrated equivalence, validated anomalies or confirmed fire events. Source hashes were rechecked in the data audit but are not bound into frontend export metadata by this copy-only pass. No public deployment or NASA endorsement is claimed.


Visual review completed on the current rendered landing desktop and Arabic mobile Calendar screenshots. The new opening description and platform statement were legible, retained the existing visual hierarchy and did not cause viewport overflow.
