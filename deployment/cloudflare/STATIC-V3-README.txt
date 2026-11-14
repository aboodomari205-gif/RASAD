FIREPULSE STATIC WORKERS V3
Upload FIREPULSE-STATIC-WORKERS-v3.zip as a replacement deployment using Workers static-file upload (also compatible with static Pages hosting).
This ZIP contains index.html at root, frontend assets and archive-data/ajloun.json plus archive-data/brazil-test.json.
No _routes.json, Pages _worker.js, Express server, database runtime or secrets are required.
The deployment-only build loads those immutable JSON archives directly; original application/API source remains unchanged.
Ajloun: 5 MODIS + 31 VIIRS observations. Brazil: 7 separately identified test-fixture observations.
All currently integrated UI modules use the common observation loader and compute analytics from these real records.
This static edition does not expose /api/history or /api/intelligence endpoints and does not provide live NASA updates.
To refresh data, import reviewed deliveries locally then run node deployment/cloudflare/build-static.mjs and repackage.
Keep the original source/backend for future live/persistent service deployment.
Known Calendar region-switch filtering issue from the audit is not fixed by this packaging change.

Verification: Chrome against a STATIC file server, with no Express/API service, passed real rendered points and click details, date/sensor filters/reset, Brazil isolation, Calendar, all intelligence modules, five evidence pairs, source drill-through, export, Arabic/mobile layout, camera presets and basemap restoration.
The first Python-server attempt failed to render the map worker; a static server with explicit .mjs JavaScript MIME types passed. Actual deployed Cloudflare URL has not been verified.

After upload: refresh the page. Header should show 2020-08-02 through 2025-10-18, ledger 31 VIIRS / 5 MODIS.
Visit /archive-data/ajloun.json on the deployed domain to confirm the 36-feature archive is accessible.
