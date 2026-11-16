# Final pre-deployment audit — 16 November 2026

## Repairs

- Preserve the authentic Natural Earth 5.1.2 Brazil country polygon, with an emerald outline above imagery and below native observation markers. Country overview/refit uses the full polygon; the overview reserves timeline space. Natural Earth is generalized at 1:110m, not a cadastral boundary.
- Keep the research pilot as a separate optional outline, initially hidden. Preserve every original coordinate and full backend functionality.
- Add compact previous/date/next navigation with reviewed Arabic copy; preserve delivered-date playback, filters, inspection, basemap switching and calendar.
- Add a Cloudflare Pages build that packages 6,876 authentic August 2024 Mato Grosso observations, the fitted 60-tree model, actual evaluation and provenance. Runtime inference uses the fitted model, not fabricated estimates. Show the limited-data scope in English and Arabic.
- Preserve the remote-backend Pages build when `RASAD_DATA_API_ORIGIN` is supplied. Preserve original source, archives, checkpoints and previous release files.

## Actual checks

- `npm test`: **165 passed, 0 failed**. Includes independent reproduction of sample checksum, splits, model evaluation, unavailable archive handling and observation contracts.
- `npm run build`, `npm run build:cloudflare`, `npm run verify:release`: **passed**. Vite retains its large MapLibre chunk warning.
- `npm run lint`: **passed with 12 existing warnings**, including hook dependencies and render-time refs.
- Chrome against the backend and packaged demo: actual MapLibre and successful public imagery tile responses; native sensor filters; H3 and 5 km equal-area rendering; timeline/date changes/playback; AI roadmap; calendar; desktop and 390 px Arabic RTL. The full country boundary and optional pilot controls passed a separate Chrome suite. Screenshots were visually inspected and overview framing was corrected.
- Expanded Chrome audit against **Wrangler Pages local runtime**, `http://127.0.0.1:5180`: zoom controls, pan, native-marker popup, held-out example selection, actual evaluation JSON download checked against the original model artifact, real PDF generation, harmonization JSON/CSV downloads with reconciled row counts. No uncaught exceptions, console errors or failed HTTP responses in that run.
- `node scripts/verify-cloudflare-demo.mjs http://127.0.0.1:5180`: **passed**. Exact unique-record pagination conservation, original positions, source-aware daily summaries, H3/equal-area overlap, model predictions within floating-point rounding, actual evaluation equality, out-of-window empty results, rejected other-country requests and explicit 503 when the evidence asset is missing.
- Wrangler compiled the advanced-mode Worker and served the real package locally. This is a local compatibility check, **not public deployment**.
- Git audit: scanned 394 previously tracked files for common credential/private-key signatures; no matches or tracked files over 25 MiB. Tracked paths contain no private SQLite/CSV/ZIP archives or environment files. This bounded scan is not a guarantee that all historical commits are secret-free.

## Delivery status and limitations

Wrangler `whoami` reports **not authenticated**. No Cloudflare deployment was attempted and no public Cloudflare URL is verified. Do not interpret the local runtime's synthetic `CF_PAGES_URL` as a deployed site. Exact authentication, project and deployment commands are in [Cloudflare delivery](../deployment/cloudflare/DELIVERY.md).

Cloudflare serves a bounded real-data research demo. Full archive browsing, ingestion and live NASA access require the original backend/archive and any required credentials. Production account permissions, public URL behavior and deployed Worker resource limits remain unverified.

Unknown acquisition opportunity, valid-pixel/cloud masks and NOAA-20/21 Standard lineage constrain interpretation. Source-only delivery is not verified absence. Detections are not confirmed fires. The FRP experiment is conditional on delivered detections and has mixed held-out results; calibration, downscaling and reconstruction remain unvalidated.
