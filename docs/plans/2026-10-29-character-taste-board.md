# Character Taste Board Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a responsive, themed character taste-board editor with custom groups/grids and PNG export, broaden the top-level category to Character Related, and add image exports to all four existing relationship editors without changing their draft data.

**Architecture:** Add a `/characters` entry route and `/characters/tastes` editor while retaining every `/coupling/*` route. Store the taste board in an independent validated local-storage document; render an editor preview and fixed-width export target from the same state. Reuse the existing character picker and PNG capture utilities, extending capture options only where fixed export dimensions or editor-specific export DOM require it. Existing relationship editor drafts remain unchanged.

**Tech Stack:** React 18, TypeScript, React Router, Vite, existing `modern-screenshot` capture helper, Node test runner, Playwright, `pngjs` for exported image assertions.

---

### Task 1: Broaden category navigation without breaking old routes

**Files:**
- Create: `src/pages/CharacterRelated.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`
- Modify: `src/pages/Landing.tsx`
- Modify: `src/features/coupling/copy.ts`
- Test: `tests/coupling-regression.mjs`

**Step 1: Write failing route and label regression tests**

Add tests that assert the landing card says “캐릭터 관련”, `/characters` offers taste-board and relationship destinations, and the existing `/coupling/whiteboard`, `/keyboard`, `/pairs`, `/matrix` routes still resolve.

**Step 2: Run tests to verify they fail for the missing category**

Run: `node --test --test-name-pattern='character related category' tests/coupling-regression.mjs`
Expected: FAIL because `/characters` is not routed and current landing copy says “캐릭터 커플링”.

**Step 3: Implement top-level category and preserve old coupling paths**

Add the new route and bilingual/trilingual localized labels. Keep `/coupling` as the relationship hub and do not alter coupling storage keys or editor route paths.

**Step 4: Verify navigation tests and baseline regressions**

Run: `node --test --test-name-pattern='character related category|home routes into coupling hub' tests/coupling-regression.mjs`
Expected: PASS; both new and legacy routes work.

### Task 2: Add validated taste-board model and storage

**Files:**
- Create: `src/features/characters/tasteBoardTypes.ts`
- Create: `src/features/characters/tasteBoardStorage.ts`
- Test: `tests/taste-board-storage.mjs`
- Modify: `package.json` (add `test:taste-board` script)

**Step 1: Write model/storage tests first**

Cover default 3×3 grid, valid 0–2 character cell, custom group rows/columns, versioned serialization, malformed/future document rejection, maximum per-group and overall cell validation, and preserving empty cells.

**Step 2: Run storage tests to verify the expected failures**

Run: `node --test tests/taste-board-storage.mjs`
Expected: FAIL because the taste-board schema and storage module do not exist.

**Step 3: Implement the independent versioned model and parser**

Use storage key `introduce:characters:taste-board:v1`. Validate IDs against `PROFILE_CHARACTER_BY_ID`, preserve the input cell order and `null` slots, and never touch `DRAFT_KEYS` for the four relationship editors.

**Step 4: Verify storage tests**

Run: `node --test tests/taste-board-storage.mjs`
Expected: PASS with malformed data rejected and valid sparse grids round-tripping.

### Task 3: Build responsive grid editor and themed export preview

**Files:**
- Create: `src/features/characters/TasteBoardEditor.tsx`
- Create: `src/features/characters/taste-board.css`
- Create: `src/features/characters/components/TasteCharacterPicker.tsx` (or reuse `CharacterPicker` with a tested adapter)
- Modify: `src/App.tsx`
- Modify: `src/data/i18n.ts` or scoped copy module under `features/characters`
- Test: `tests/taste-board-regression.mjs`

**Step 1: Write browser tests for blank cells and grid presets**

Test the initial 3×3, one-row 3-cell preset, 4×4 and 5×5, arbitrary custom dimensions, multi-group add/rename/reorder, and that shrinking never silently removes occupied cells.

**Step 2: Run focused test to observe the missing editor**

Run: `node --test --test-name-pattern='taste board grid presets' tests/taste-board-regression.mjs`
Expected: FAIL because the new route/editor has not been implemented.

**Step 3: Implement editor, selection dialog, and responsive preview**

Use explicit click-to-select and click-to-swap flows as the touch-safe baseline; drag may be progressive enhancement. Keep output grid dimensions independent of viewport; use a scrollable/edit dialog on compact widths. Make interactive controls at least 48 CSS px tall where practical. Add minimal, album, and night themes, title/name visibility, and a fixed-width dedicated export target.

**Step 4: Verify browser editor tests**

Run: `node --test --test-name-pattern='taste board' tests/taste-board-regression.mjs`
Expected: PASS for responsive grid editing, empty-cell retention, multi-group state, theme changes, reload persistence, and keyboard-accessible selection.

### Task 4: Add stable PNG export for taste boards

**Files:**
- Modify: `src/lib/captureCard.ts`
- Create: `src/features/characters/components/TasteBoardExport.tsx` (if export DOM is separated from editor)
- Modify: `src/features/characters/TasteBoardEditor.tsx`
- Test: `tests/taste-board-export.mjs`

**Step 1: Write PNG download tests before export implementation**

Verify the download event and filename; decode with `pngjs`; assert fixed pixel dimensions for desktop and mobile viewports, actual last-row/last-group content, theme background, and no editor toolbar/selection chrome.

**Step 2: Run the export tests and confirm they fail**

Run: `node --test tests/taste-board-export.mjs`
Expected: FAIL because the taste-board page has no image export action.

**Step 3: Implement fixed-width capture and download flow**

Extend `captureCardBlob` in a backward-compatible way only as required for a fixed output width. Keep the export target rendered and measurable when captured; do not capture `display:none`. Add progress/disabled state, recoverable failure feedback, safe max-pixel checks, and a mobile-friendly open/save fallback if direct download is unavailable.

**Step 4: Verify actual desktop/mobile PNG bytes**

Run: `node --test tests/taste-board-export.mjs`
Expected: PASS; files decode, output geometry stays equal across viewport classes, and all requested content is present.

### Task 5: Add PNG export actions to existing relationship editors

**Files:**
- Create: `src/features/coupling/components/CouplingImageExport.tsx`
- Modify: `src/features/coupling/editors/WhiteboardEditor.tsx`
- Modify: `src/features/coupling/editors/KeyboardEditor.tsx`
- Modify: `src/features/coupling/editors/PairsEditor.tsx`
- Modify: `src/features/coupling/editors/MatrixEditor.tsx`
- Modify: `src/features/coupling/coupling.css` and editor CSS files
- Test: `tests/coupling-export-regression.mjs`

**Step 1: Write one real-download scenario per editor**

Test the scope text and actual image output. Prepare a multi-edge canvas, relay with more than one page, filtered pair collection, and both matrix modes. Assert no editor-only controls are included and all data for the chosen export scope appears.

**Step 2: Run tests and verify missing export actions fail**

Run: `node --test tests/coupling-export-regression.mjs`
Expected: FAIL because the four editors currently have no PNG export control.

**Step 3: Implement editor-specific output scopes**

Use a dedicated print/export surface or full-content capture target so scroll position, graph zoom, current pagination, and viewport clipping do not omit data. Include relationship color legend and direction where applicable. For pairs, let the action label clarify visible filtered cards versus all cards; default to the current visible collection to match user context.

**Step 4: Verify all four downloads and old draft preservation**

Run: `node --test tests/coupling-export-regression.mjs tests/coupling-regression.mjs`
Expected: PASS; old coupling serialized values remain unchanged and all four output images decode.

### Task 6: Cross-device integration, visual and regression verification

**Files:**
- Modify: `tests/coupling-regression.mjs`
- Modify: `tests/visual/modes.mjs` only if a reusable browser flow is needed
- No credential/config files may be inspected or changed.

**Step 1: Add compact/medium/expanded viewport and touch scenarios**

Exercise 360×800, 390×844, 768×1024 and 1440×1000 layouts. Check no horizontal overflow in the editing shell, all dialogs fit or scroll internally, touch controls are reachable, and the preview remains proportional.

**Step 2: Run all focused browser tests**

Run: `npm run test:taste-board && node --test tests/coupling-export-regression.mjs tests/coupling-regression.mjs`
Expected: PASS with actual PNGs decoded and no browser runtime errors.

**Step 3: Run project verification**

Run: `npm run test:coupling && npm run test:profile && npm run test:share && npm run build && git diff --check`
Expected: all tests pass, TypeScript/Vite build succeeds, and diff check is clean.

**Step 4: Commit, fast-forward `main`, push, and verify parity**

Commit only implementation/design files from this feature branch, preserve unrelated root working-tree changes, merge with fast-forward, push `origin main`, then run `git fetch origin`, `git rev-list --left-right --count origin/main...main`, and check the final status.
