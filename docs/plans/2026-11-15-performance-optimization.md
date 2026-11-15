# Initial loading and editor performance implementation

**Goal:** Reduce initial downloads and synchronous draft writes while preserving routes, shared links, photos, and editor drafts.

**Architecture:** Lazy route and concept boundaries keep editor code off the home page. Home calendar data is generated from the full snapshot and uses the same date rules. Form persistence retains its existing format with delayed writes and lifecycle flushing.

**Tech stack:** React 18, React Router 6, TypeScript, Vite 5, Node.js 22, Playwright.

## Changes

- Lazy-load non-home pages and each concept implementation/CSS. The compact gallery and form panel use metadata without importing implementations. Resolve legacy A–O links eagerly so the form provider cannot strip `?c=` before redirecting to v1. Suspend the whole concept page until its implementation is ready, keeping export controls unavailable during loading.
- Generate `src/data/homeCalendar.json` with `node scripts/build_home_calendar.mjs` in `predev` and `prebuild`. Keep only display fields and yearly/monthly/weekly matching fields, preserving source ordering. Full calendar data is loaded only by the calendar page. Re-export the shared date API from its original entry point for compatibility.
- Debounce form saves by 300ms; persist initial restored state immediately. Flush the latest pending state on pagehide, hidden visibility, and unmount. Track the last saved state to avoid duplicate lifecycle writes. Keep storage keys, photo serialization, quota fallback and migration behavior.
- Mount the coupling draft provider inside the lazy coupling layout. Keep one provider across its hub/editor routes and flush on departure. Deferred whiteboard viewport updates are published in layout cleanup before the provider’s passive teardown flush, and provider draft refs update synchronously. A layout-installed pagehide listener also publishes the pending viewport before serialization.
- Replace quadratic reciprocal-edge detection with an endpoint-to-edge-ID index after the original 1,000-edge p95 exceeded the agreed 4ms threshold. Preserve forward-only matching and distinct edge identities.

## Download measurement

Measured against a before-change production build and the final production build using Chromium, empty browser contexts, and the home teaser fully rendered. Values below are bytes from requested local JS/CSS files; gzip is computed per file. External fonts/images and HTTP headers are excluded. These are download-size measurements, not user-perceived latency measurements.

| Home resources, including teaser | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| JavaScript, uncompressed | 677,177 | 364,031 | 46.2% |
| JavaScript, gzip | 182,443 | 107,047 | 41.3% |
| CSS, uncompressed | 112,655 | 40,935 | 63.7% |
| CSS, gzip | 22,241 | 8,590 | 61.4% |

Vite's displayed uncompressed chunk sizes differ from UTF-8 file byte counts for multilingual content; the table uses actual file bytes. The initial entry's gzip size fell from approximately 141.6KB to 85.7KB.

## Verification

- `npm run test:performance` builds into a temporary directory and tests actual production requests, selected-concept loading, blocked-chunk export readiness, photo draft debounce/lifecycle saves, coupling exit/reentry persistence, and reciprocal-edge equivalence.
- Calendar comparison checks every day of 2024 and 2026 against an independent reference of the original rules, plus Seoul's year boundary.
- Existing profile and mode regression checks now wait for lazy screens to render before reading DOM collections; no arbitrary delays were added to those checks.
- `node scripts/benchmark_whiteboard.mjs` compares the old expression and the actual optimized function in Chromium using deterministic 100/500/1,000-edge fixtures, 50 warm-up runs and 200 five-call timing samples per case. p95 is per call; this does not measure complete rendering or dragging latency.

## Whiteboard calculation measurement

Chromium 156.0.8078.4, local deterministic microbenchmark, milliseconds per call at p95:

| Edges | One-way: original → optimized | Reciprocal: original → optimized |
| --- | ---: | ---: |

| 100 | 0.12 → 0.04 | 0.08 → 0.04 |
| 500 | 1.50 → 0.12 | 0.70 → 0.14 |
| 1,000 | 5.32 → 0.24 | 3.04 → 0.28 |

The 1,000-edge one-way case drops from 5.32ms to 0.24ms (about 95%). These timings vary with device and load.

## Completed validation

Node.js 22.19.0. All completed with zero failures:

- `npm run build:site` (current site and v1 archive).
- `npm run test:share` (3), `npm run test:profile` (11), `npm run test:coupling` (27), `npm run test:coupling-export` (4), `npm run test:random` (13).
- `npm run test:taste-board`: 42 passed, WebKit initially skipped because its binary was missing; after installing the matching top-level Playwright WebKit binary, the focused WebKit mobile export test passed as well.
- `npm run test:performance`: 9 passed, including production request checks and immediate viewport navigation/pagehide persistence.
- `npm run qa:modes`: 33 PNG downloads across 32 Wide states and current Compact export.
- Chromium E2E: 230 passed, 1 configured skip for the built-archive-only case.
- WebKit E2E: 142 passed, 1 configured skip for macOS Tab-link traversal behavior.
- `git diff --check`.

The coupling regressions and all four coupling exports were rerun after the final viewport-teardown fix. Development-server checks must not overlap the v1 archive build: generated HTML under `.v1/dist` can trigger a Vite page reload mid-test. Existing collection-count checks now wait for their lazy page content instead of relying only on URL changes.
