# Character Random Picker Implementation Plan

**Goal:** Add `/characters/random`, a mobile-first character draw tool that uses the existing coupling portraits, filters by work/role/stage, optionally reflects saved taste/coupling preferences, keeps recent history, and exports a PNG result card.

**Architecture:** A standalone route under the existing character hub. Pure draw/storage/preference modules are separated from UI. Shared portrait lookup moves to `src/data/characterPortraits.ts`; coupling keeps a compatible re-export. The page is a single vertical slice with a responsive filter panel/sheet, a draw stage, result cards, history, and a fixed-width export target.

**Tech stack:** React 18, TypeScript strict, React Router, Vite, existing `modern-screenshot` capture helper, Node 22 test runner, Playwright, pngjs. No new runtime dependencies.

---

## Product decisions

- Route: `/characters/random`.
- Counts: 1, 2 (pair), 3, 5, 10. No duplicates within one draw.
- Filters: scope (all/mainline/PC-98/spin-offs/books), individual works, roles, stage.
- Distribution: character-equal or representative-group-equal.
- Personalization is opt-in. When off, localStorage preference data is not read.
  - favorite weight 3, interested (taste board) weight 1.5, avoid weight 0.
  - favorite wins over avoid when both exist.
- Recent exclusion: last 10 unique characters, relax with a visible notice when the pool is too small.
- History: 50 draws stored, 20 shown; tap to reopen, clear with undo.
- Export: one PNG for the current result set. Single 900x1200, multi 1200px wide auto-height.
- Pair results link to `/coupling/pairs?a=<id>&b=<id>` and prefill A/B once.

## UX outline

- Mobile: hero, filter summary chips, card-back draw stage, result, horizontal history, sticky 56px draw action with safe-area padding.
- Desktop: 320-360px sticky settings panel + stage/result/history.
- Mobile filters use a native `<dialog>` bottom sheet; desktop uses the inline panel.
- Empty pool explains why and offers reset. Empty-by-preference explains and offers turning personalization off.
- Reduced motion skips the card reel. Results are announced through a concise `aria-live` message.
- Export composes portraits, names, representative groups, date, and branding only; no editor chrome.

## Files

```
src/data/characterPortraits.ts
src/features/characters/random/
  types.ts
  drawPool.ts
  randomPickerStorage.ts
  preferenceSignals.ts
  copy.ts
  RandomPickerPage.tsx
  random-picker.css
  random-result.css
  components/
    RandomPortrait.tsx
    RandomFilterPanel.tsx
    RandomFilterSheet.tsx
    RandomDrawStage.tsx
    RandomResultCard.tsx
    RandomHistory.tsx
    RandomExport.tsx
tests/random-picker-logic.mjs
tests/random-picker-ui.mjs
tests/random-picker-export.mjs
tests/random-picker-nav.mjs
```

## Task DAG

1. **Foundation (coordinator):** shared types, portrait helper, compiling vertical slice, route/nav, copy, CSS tokens, storage/draw baseline.
2. **Logic worker:** harden `drawPool.ts`, `randomPickerStorage.ts`, `preferenceSignals.ts`; unit tests.
3. **Shell/filter worker:** `RandomPickerPage.tsx`, filter panel/sheet, draw stage, portrait, page CSS; browser UI tests.
4. **Result/export worker:** result card, history, export target/CSS; PNG export tests.
5. **Integration worker:** hub card, nav polish, pair prefill, nav/regression tests.
6. **Coordinator:** merge branches, run full build and focused suites, fix integration gaps.
7. **Review worker:** independent review of the merged implementation; coordinator fixes confirmed issues.

## Acceptance

- Hub card and subnav route work in ko/ja/en.
- Draw counts, no duplicates, clamped pools, filters, empty states.
- Preference toggle reads only when enabled; favorite/avoid precedence is tested.
- History persists and restores; clear supports undo.
- PNG downloads decode with fixed dimensions on desktop and mobile.
- 320/390px no horizontal overflow; touch targets >=48px; dialog focus/Esc/focus return.
- Reduced motion reveals without the reel.
- Existing coupling, taste-board, share, profile, and E2E suites stay green.
