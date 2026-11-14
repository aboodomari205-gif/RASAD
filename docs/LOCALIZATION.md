# Arabic / English

The header language button is available on Earth Alive, Mission Atlas, Burning Calendar and every Intelligence module. English remains the default. The user's explicit choice is stored under `firepulse.language.v1` in localStorage; blocked storage falls back to the current page session. Switching changes document `lang`, `dir`, title, visible copy, accessible labels and open observation popup content without navigating or reinitializing the map.

## Translation boundaries

- `src/i18n/ar.ts`: curated Arabic copy and parameterized display templates, including scientific limitations, missing-data/error messages and report text.
- `translate.ts`: translates presentation strings only; no DOM text observer, HTML replacement, external translation service or backend payload changes. Unknown source identifiers pass through unchanged. `useLanguage.ts` subscribes React to changes; the application re-renders in place.
- `LanguageSwitch.tsx` and `language.css`: shared header control, Arabic type treatment, RTL alignment and responsive spacing.
- Calendar dates use Gregorian `ar-JO` formatting with UTC explicitly retained. Latin digits remain intentional for scientific values and ISO interoperability. Arrow Left advances one day in RTL; Arrow Right goes back. Temporal map scrubbers keep chronological LTR order.
- Names/codes such as NASA FIRMS, MODIS, VIIRS, S-NPP, original confidence values, dataset/product identifiers, timestamps and coordinates retain their scientific identity. CSV column names and raw exports remain language-independent. Displayed/copied/printed descriptive briefs follow the selected language.
- Third-party basemap labels/legal credits and operating-system date-picker chrome remain provider/browser controlled. This does not alter or translate raster imagery or geographical coordinates.

## Adding copy

Wrap user-facing React strings and accessible labels with `t(...)` and add their Arabic equivalents to `ar.ts`. Keep route/module identifiers, filter values, event handlers, CSS selectors and raw observation metadata outside translation. For composed sentences, add a template with numbered placeholders; never concatenate translated strings into API queries. Keep scientific uncertainty and fixture disclaimers equivalent in both languages.

## Verification

- `npm test`: existing data/backend suites plus translation-catalog, placeholder preservation, dynamic calendar labels, raw provenance, Gregorian UTC dates, switch subscriptions and localized-brief tests.
- `npm run test:language`: isolated local API/Vite/Chrome; switches landing/map, verifies Ajloun default and explicit Brazil fixture, same canvas/camera/features, open popup updates, all eight modules, RTL calendar keyboard movement, copied report, mobile overflow/header spacing, persistence and English restoration. Needs local Chrome on Windows. It does not use NASA credentials or replace an existing backend process.
- `npm run test:filters`: existing English map/filter/calendar/navigation regression.
- `npm run build` and `npm run lint`.

Source-only pre-edit checkpoint: `.checkpoints/language-20261111/src/`.
No backend, archive pipeline, datasets, map worker or secret files were changed. The parser added as a development dependency supports translation coverage tests; it is not shipped to the browser.

Human follow-up: test a physical Arabic mobile keyboard and a screen reader in both languages; inspect native print/PDF output and OS-specific date inputs. Automated Chromium checks do not establish cross-browser or linguistic review by an independent Arabic editor.

## Completed validation — 12 November 2026

- All 62 automated tests passed; production build and lint passed. Existing large Three.js/MapLibre chunk warnings remain.
- Arabic/English Chrome verification passed, including all eight modules, popup updates, Gregorian dates, RTL keyboard navigation, report copy, persistence and restoration to English. Header collision checks covered 320, 390, 768, 1024 and 1440 pixel widths.
- Arabic desktop and mobile screenshots were inspected; mobile header spacing was adjusted before the successful final run.
- Existing English filter regression passed, including its final HTTP/deep-link/coverage checks. An earlier HTTP check returned 404; subsequent direct and Vite-proxied diagnostics both returned 200, and the complete original regression passed on rerun. No backend change was made or causal diagnosis claimed.

Modified presentation files: `src/App.tsx`, `src/FireMap.tsx`, `src/calendar/BurningCalendar.tsx`, `src/calendar/CalendarDayDetails.tsx`, `src/components/{AnalysisBoundary,AtlasFilters,AtlasInspector,AtlasTimeline,EarthLanding,MissionBoundary,MissionIntro,MissionUI}.tsx`, `src/design/AtlasPrimitives.tsx`, and `src/intelligence/IntelligenceWorkspace.tsx`.

Added localization files: `src/i18n/{ar.ts,translate.ts,useLanguage.ts,LanguageSwitch.tsx,language.css}`. Added `tests/i18n.test.ts`, `scripts/verify-language.mjs`, and this document. `package.json`/`package-lock.json` add the test command and development-only JSX parser. Existing data and backend files remain unchanged.
