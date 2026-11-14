CURRENT RECOMMENDED PATH: npm run build:cloudflare; output dist.
See docs/PRODUCTION_DEPLOYMENT_READINESS.md and deployment/static-data/README.md.
The older Worker/release recipes below are historical; they are not the current Pages build.

FIREPULSE - Cloudflare Pages archive deployment

UPLOAD: FIREPULSE-cloudflare-pages.zip (its root contains index.html, assets and _worker.js).
Cloudflare dashboard > Workers & Pages > Create application > Pages > Direct Upload.
Upload the ZIP and deploy. Do not upload the source-code ZIP as website assets.
Official instructions: https://developers.cloudflare.com/pages/get-started/direct-upload/
The bundled advanced-mode _worker.js is supported by dashboard uploads.

This package includes an immutable snapshot of the currently imported NASA archive:
Ajloun: 5 MODIS + 31 VIIRS detections. Brazil: 7 separately labelled development fixture points.
The same existing observation/history/intelligence route handlers and shared aggregation code
are bundled for the Worker runtime. No Express server, SQLite runtime, secrets or credentials
are required on Cloudflare. NASA live /api/hotspots intentionally returns 503.
This is an archive demonstration, not a live NASA feed or a persistent ingestion service.
Update the local archives and rebuild/repackage to publish newer data.
Base map tile providers require internet access. Scientific uncertainty is unchanged.

SOURCE ZIP: contains frontend/backend source, public assets, tests, documentation, build scripts,
and the explicitly supplied NASA deliveries plus Brazil fixture. No node_modules, .env,
credentials, local logs, checkpoints or SQLite database are included.
Restore source: npm ci; npm --prefix server ci; import archives using docs/REAL_DATA_ACTIVATION.md.
Rebuild Pages assets: npm run build; node deployment/cloudflare/build.mjs
Verify bundled API: node deployment/cloudflare/verify.mjs
Then ZIP the CONTENTS of releases/cloudflare-pages, not its parent directory.

Local build and bundled Worker handler tests passed. Actual Cloudflare deployment is not tested.
Known pre-existing audit failures remain: calendar region switching may retain incompatible dates;
the legacy language browser test expects empty Ajloun. See the preceding audit; this packaging
change does not fix or conceal those defects.
