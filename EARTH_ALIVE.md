# FIREPULSE — Earth Alive / Phase 1

The initial viewport is now a cinematic, interactive Earth composition. React Three Fiber renders NASA's correctly UV-mapped, 2048 × 1024 Blue Marble texture on a sphere. A thin custom atmospheric rim, restrained static stars, directional lighting, and a slow idle rotation create depth without postprocessing. Motion handles title-line reveals, CTA interaction, and the handoff UI. Frame transforms stay in Three refs, not React state.

## Reversible checkpoint

Before edits, the frontend source, scripts, package manifests, configuration, README, and ignore file were copied to `.checkpoints/earth-alive-20261111-184743/`. This source-only checkpoint excludes backend files, `.env`, secrets, observation datasets, and dependencies. `.checkpoints/` is ignored. No backend, data processor, or NASA endpoint was changed. No Git commit was made.

## Entry and renderer lifecycle

Enter Mission performs a bounded camera push toward the globe. Skip Intro / Enter Directly (or Escape) bypasses the push. After the Earth renderer unmounts, a 650ms handoff allows R3F's deferred renderer disposal before MapLibre is created. The scene-to-Ajloun transition is a visual handoff; exact geographic camera continuity is not implemented. First mission entry initializes the existing map in Ajloun pilot mode. Brazil remains an explicit, separate development-fixture selection.

The mission is mounted once and retained during panel changes. Clicking the FIREPULSE wordmark returns to a static NASA Earth composition while preserving the active map instance and region. Returning does not create a second Three renderer alongside MapLibre. Entry choice is not persisted; reloading opens Earth Alive again. Existing observation points, sensor counts, hover/selection, metadata popups, satellite/street toggle, date filters, polygon, camera cancellation and scientific caveats remain intact.

## Accessibility, cost and failure behavior

- Drag the globe horizontally, or focus its region and use arrow keys to rotate/tilt. Touch uses pointer capture with vertical page panning retained.
- Pause rotation stops idle frame requests; Resume restores them. Pointer/keyboard controls work while paused.
- Rendering uses a demand loop requested at most 30 times/second, DPR capped at 1.35, a 2048px texture, modest sphere geometry, and 240 stars in one points draw. Hidden tabs request no frames. No expensive postprocessing or additional WebGL canvas is used.
- Reduced motion is observed through a live media-query subscription. It uses the static Earth photo and direct entry, with no idle globe or camera push.
- Loading status reports actual texture loading without a percentage or artificial waiting period. Entry remains available while assets load. Texture errors, unsupported WebGL, and context loss fall back to the attributed still image. If both images fail, an honest imagery-unavailable message appears; mission entry remains usable.
- The mission itself still needs WebGL. If unavailable, a recovery panel explains this limitation and offers return/retry rather than crashing the app.
- Keyboard focus is visible. Initial landing focus goes to Skip, and entry restores focus to mission controls. Small viewports can scroll the full landing composition.

## Dependencies and assets

Added `three`, `@react-three/fiber`, `@react-three/drei`, and development types `@types/three`. Existing Motion is reused. Earth and mission code are separate lazy chunks. Package installation reported zero vulnerabilities.

Earth texture: 1,511,379 bytes. Static fallback: 334,214 bytes. Sources, transformations, credits and public-domain reuse terms are documented in `public/earth/ATTRIBUTION.md`. NASA SVS item 2915 is credited visibly on the landing. Imagery is a historical composite, never labeled live or used as thermal observation data.

## Validation and remaining manual checks

Run `npm run build`, `npm run lint`, `node --test server/observations.test.js`, and `node scripts/verify-motion.mjs`.

The browser script launches local headless Chrome in an isolated temporary profile. It verifies the textured scene, pause/keyboard controls, camera entry, first Ajloun default, renderer handoff, Brazil's 7 real observations, date filter to 2 observations, rendered map points, metadata popup/focus, mission camera interruption, basemap overlay restoration, Ajloun isolation, mobile width, static return preserving the map, reduced-motion entry, texture failure, context-loss fallback, and a fully unavailable WebGL context. Temporary screenshots are kept outside the project. It requires local Windows Chrome and Node with built-in WebSocket support.

Manual browser checklist:
1. Fresh load: review Earth texture orientation, atmospheric edge, title reveals and readable labels at desktop, tablet, 390px mobile, and short landscape heights. Historical imagery/credit labels must remain visible.
2. Drag or touch the globe; use arrow keys and Pause/Resume. Verify smooth response and page scrolling on a real touch device.
3. Enter Mission: verify the camera push and clean visual handoff, then the Ajloun polygon/default region. Try entry before texture loading finishes.
4. Reload and Skip Intro / Enter Directly; also press Escape. Entry must work without waiting for assets. Verify focus reaches mission controls.
5. Explicitly select Brazil: verify its test-fixture label and actual points. Hover/select points and list rows; inspect metadata, confidence, FRP, popup and highlight. Filter each real date and All dates; verify separate sensor counts.
6. Switch Satellite/Street while filtered; the Ajloun outline and correct observations must return after style load. Return to Ajloun: Brazil points and popups must clear immediately.
7. Click FIREPULSE to return to Earth, then reenter: the map instance and explicit region choice should be retained. The return view is deliberately static to avoid concurrent renderers.
8. Enable reduced motion before loading and while on the landing. Verify the still image, no globe rotation/push, and direct entry. Block the texture, disable WebGL, or simulate context loss to verify honest fallback/recovery messages.

Remaining limitations: visual handoff rather than geospatial continuity; historical day texture without a separate night/cloud simulation; no persistence of the entry choice; no physical-device performance, assistive-technology or touch-hardware validation. Large renderer/map chunks still trigger Vite's size warning, though they load separately. Low-end hardware should be profiled manually.
