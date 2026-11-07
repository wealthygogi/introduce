# Local verification before push

GitHub Actions starts after a push; this repository does not install a local pre-push hook. Run verification locally before pushing so failures are caught before the branch is updated.

Use Node.js 22, matching the GitHub Actions workflows. This version supports the `--experimental-strip-types` flag used by `npm run test:taste-board`.

## Browser setup (once per machine)

```sh
npm ci
npx playwright install chromium
```

## Full local check before push

Run from the repository root:

```sh
npm run build:site
npm run test:share
npm run test:profile
npm run test:coupling
npm run test:taste-board
npm run test:coupling-export
npm run qa:modes
npm run test:e2e -- --project=chromium
```

For a focused iteration, run `npm run build` and the suite for the changed area; still run the full check before pushing. Taste-board changes require `npm run test:taste-board`. Download, mobile, or browser-rendering changes also require `npm run qa:modes` and the relevant E2E project.

## WebKit / Safari-family check

Install WebKit once, then run the WebKit E2E project when changing downloads, mobile behavior, or browser-specific rendering:

```sh
npx playwright install webkit
npm run test:e2e -- --project=webkit
```

The WebKit E2E project covers the download and mobile specs. Chromium runs the full E2E suite. Do not set `CI=1` for ordinary local E2E runs: that switches Playwright from the Vite dev server to the built preview server.

## GitHub Actions coverage

- Pushes to `main` run the site build and deploy it; run the full verification locally before pushing.
- Full Chromium E2E plus visual mode downloads, and WebKit download/mobile E2E, run on pull requests to `main`, weekly, or by `workflow_dispatch`.
- Browser-check Actions do not replace the local pre-push checks above; they run only through their configured PR, scheduled, or manual triggers.
