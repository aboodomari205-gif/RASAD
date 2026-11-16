# RASAD Cloudflare delivery

Current entry point: `npm run build:cloudflare`. Preserve historical release files; do not upload an older FIREPULSE ZIP.

Without `RASAD_DATA_API_ORIGIN`, the build verifies and copies the **committed static packet** in `deployment/pilot`, exported from the original indexed Mato Grosso archive (−57, −14, −55, −12; August 2024). Hosted builds require no private archive or Node API. A generation/count check ties its 6,876 observations to the existing fitted research artifact. `dist/demo/manifest.json` records scope, count, generation and SHA256. No private database, raw archive, credentials or other countries are copied. The browser displays a bilingual limited-data notice.

Pages serves the Vite frontend, authentic Brazil boundary, MapLibre worker and bounded evidence asset. The static browser adapter loads and verifies the packet's SHA-256, then runs the same read-only filtering, pagination, source summaries, H3/equal-area harmonization and fitted-model inference used by the optional Pages Worker. The static pilot issues no backend HTTP requests and works on a file-only HTTPS host. Missing periods stay empty with unknown coverage. Unsupported full-archive routes return an explicit error. This is not a live NASA feed.

Regenerate only on an installation containing the original archive: `node deployment/cloudflare/export-pilot.mjs`. Review and commit the packet and manifest together. The public copies live in `public/rasad-data/` and Vite includes them at `/rasad-data/brazil-pilot-aug2024.json` and `/rasad-data/manifest.json`. The loader checks HTTP success and JSON content type before parsing, then verifies the packet checksum. Packet and manifest requests bypass browser caching. Old `/rasad-data/evidence.json` and `/demo/` assets remain available for cached clients. Never generate substitute observations when the archive is missing.

With `RASAD_DATA_API_ORIGIN=https://your-indexed-api.example`, the same build emits the original read-only API proxy instead. The original Node backend, private indexed SQLite archive and model files remain on that API host. It requires a current Node version, `npm ci`, `npm --prefix server ci`, and the existing archive activation. Pages cannot run that Node/SQLite service directly.

Verification:

```powershell
npm test
npm run lint
npm run build
npm run build:cloudflare
npm run verify:release
npx wrangler pages dev dist --port 5180
# Separate terminal:
node scripts/verify-cloudflare-demo.mjs http://127.0.0.1:5180
$env:RASAD_TEST_ORIGIN='http://127.0.0.1:5180'
npm run test:e2e
```

Deploy after authenticating to an account with the intended Pages project:

```powershell
npx wrangler login
npx wrangler whoami
npx wrangler pages project list
# If the intended project does not yet exist:
npx wrangler pages project create rasad --production-branch main
npx wrangler pages deploy dist --project-name rasad --branch main
```

The checked-out delivery branch is not automatically a production branch. `--branch main` is explicit; confirm project ownership and production branch in the authenticated account. A successful local preview is not public deployment. Open the URL returned by Wrangler in a real browser and rerun the browser suite with `RASAD_TEST_ORIGIN` set to that URL. Public access, production Worker CPU/memory limits, map provider access and deployment permissions remain unverified until then.

Scientific limits: unknown valid-pixel/cloud and acquisition opportunity; no verified negatives or confirmed fires; NOAA-20/21 Standard lineage unresolved. The fixed 60-tree model is conditional-on-detection FRP estimation, with mixed held-out performance. Cross-sensor calibration, downscaling and historical reconstruction are not validated.
