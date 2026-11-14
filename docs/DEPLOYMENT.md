# Production deployment handoff

## Prepared architecture

`vercel.json` builds the existing Vite app to `dist`. `api/[...path].js` exports the listener-free Express application in `server/app.js`. `server/index.js` remains the local port listener. Existing NASA/observation/history contracts are retained. Vercel routes API paths to the Function and extensionless application paths to the SPA. Set Node **24.x** in the Vercel project; deployment runtime must support native erasable TypeScript and `node:sqlite` for the existing data modules. Root and server dependencies are installed by the configured install command.

`FIRMS_MAP_KEY`, `FIREPULSE_DATA_API_ORIGIN`, and `PORT` are **server-side environment variable names only**. Never prefix credentials with `VITE_`. Configure values in the hosting dashboard or authorized local runtime; do not put values in source files, screenshots, command output or client bundles. No environment file was opened by the implementation or tests.

NASA requests are time-bounded (8 seconds), disallow redirects, bound response bytes and return sanitized errors. Their URL/credential is never logged by the new handler. Tests use synthetic credential sentinels only. `/api/health` does not call NASA or claim that an external store is healthy. Same-origin production requests do not require permissive cross-origin credentials.

The successful `/api/hotspots` CSV contract is unchanged. Missing credentials remain 503 and upstream HTTP failures remain 502. Transport exceptions/timeouts now consistently return **502** rather than the old generic 500; this intentional gateway-error change removes unsafe raw-error logging. Map/calendar observation endpoints retain their existing contracts.

## Persistent data service

Host the existing Express/data catalog on a persistent Node service with a durable `server/data/history.sqlite` volume, backups and the reviewed Task 10 import workflow. Or implement a managed SQL/object-storage adapter preserving the contracts. Set `FIREPULSE_DATA_API_ORIGIN` to that service's **HTTPS origin only** (no embedded credentials, path, query or fragment). The serverless facade proxies the allowed read-only observation/intelligence/history routes with bounded requests. Remote failures remain explicit errors. Do not point the origin back at the same Vercel deployment (that would create a proxy loop).

The remote service must serve `/api/observations`, `/api/intelligence/*`, and `/api/history/*` with the existing schema, including the separately labeled Brazil fixture if required for the production demo. The facade currently supports a public read-only service, not an authenticated private gateway; private authentication and service-level rate limits would need a server-side extension. HTTPS validation and response caps are not a claim of complete security certification.

`.vercelignore` and Function exclusions prevent packaging environment files, local data/SQLite databases, checkpoints and credential directories. The public Ajloun boundary is explicitly traced. Local fixture CSVs are not bundled: without the external data service, the pilot remains unavailable and fixture requests return an honest source error. No ephemeral Vercel filesystem writes are used for storage.

## Exact next deployment actions

No Vercel CLI/project/account authorization is available in this workspace. No deployment or URL is claimed. An authorized project owner can:

```powershell
npm ci
npm --prefix server ci
npm test
npm --prefix server test
npm run lint
npm run build
node scripts/verify-release.mjs
npx vercel login
npx vercel link
npx vercel
```

Configure Node 24.x and the required server-side environment names in the linked project's preview settings before deploying/redeploying. `npx vercel` creates a preview; do not use `--prod` until it passes review. After receiving the **actual** preview URL:

```powershell
node scripts/verify-deployment.mjs https://YOUR-ACTUAL-PREVIEW-HOST
```

The verifier requires the real fixture API to work; missing persistent-service setup will fail rather than report success. Check preview access protection if HTTP probes require authentication. Do not paste or log access tokens to bypass protection.

## Deployment acceptance checklist

- [ ] Actual preview URL and successful build recorded.
- [ ] `/`, `/mission`, and refresh resolve to the SPA; hash module navigation/Back works.
- [ ] `/api/health` is JSON, not the SPA fallback.
- [ ] Real observation/history routes return v1 JSON or expected honest availability states.
- [ ] Brazil fixture remains explicit and cannot enter Ajloun; external service serves it.
- [ ] Globe texture/static fallback, GeoJSON and worker asset return successfully.
- [ ] Street/satellite providers and original attributions load in production.
- [ ] Browser walkthrough, keyboard, 390px mobile, reduced motion and network retry pass.
- [ ] No credentials appear in browser URLs/bundles/errors; no local data/checkpoints are public assets.
- [ ] Durable-service backup/restore and import permissions reviewed.
- [ ] CSV/print/copy reviewed by a human; publish only after acceptance.

References: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Express on Vercel](https://vercel.com/docs/frameworks/backend/express), [routing rewrites](https://vercel.com/docs/routing/rewrites), [project configuration](https://vercel.com/docs/project-configuration). These informed configuration; real deployment remains unverified.
