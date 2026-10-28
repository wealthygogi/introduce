# Four Coupling Editors UX Refinement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the approved Material-informed UX refinements across the free canvas, keyboard relay, pair cards, and relationship matrix without changing saved draft schemas or touching unrelated work.

**Architecture:** Keep each editor's domain behavior and undo history local, and add a small shared transient-feedback component for reversible actions. Use existing editor draft state for edits and keep responsive/adaptive matrix controls presentational; add browser regression tests before each behavior change.

**Tech Stack:** React, TypeScript, CSS, existing native dialog/details patterns, Playwright-driven `node:test` regression suite in `tests/coupling-regression.mjs`.

---

## Scope and safety

- Do not edit or stage the currently unrelated changes in `src/components/FormPanel.tsx`, `src/styles/global.css`, `docs/fuujinroku-demo/`, `prototype/series-grouping.html`, `public/fuujinroku/`, `src/data/fuujinroku.ts`, `src/lib/animatedVideo.ts`, `src/pages/Fuujinroku.tsx`, or `src/styles/fuujinroku.css`.
- Preserve `introduce:coupling:*:v1` draft schemas and migration behavior.
- Use only the coupling regression suite for browser changes; test additions belong in its existing editor-specific test sections.
- Keep Korean, Japanese, and English UI strings in sync.

## Task 1: Add reusable transient Undo feedback and wire it to canvas deletion

**Files:**
- Create: `src/features/coupling/components/CouplingSnackbar.tsx`
- Modify: `src/features/coupling/editors/WhiteboardEditor.tsx`
- Modify: `src/features/coupling/coupling.css`
- Modify: `src/features/coupling/whiteboard/whiteboard.css`
- Test: `tests/coupling-regression.mjs`

**Step 1: Add a failing component contract test**

Add a browser test on the whiteboard route that deletes a selected edge, asserts the snackbar message and Undo action appear, and invokes Undo to restore the edge. Do not test the timeout yet; avoid a production-only test prop.

**Step 2: Run the focused regression suite and confirm it fails**

Run: `npm run test:coupling`
Expected: the new assertion fails because neither the shared component nor its canvas integration exists.

**Step 3: Implement the shared snackbar**

Create a controlled component accepting `message`, optional `actionLabel`/`onAction`, `onDismiss`, and a duration. Render one `role="status"` live region, one optional action button, and a dismiss button. Start/restart a timer on message changes and clean it up on unmount. Keep the live region non-modal and ensure it does not cover editor primary controls. Integrate it with edge deletion using the existing undo stack.

Add compact responsive CSS in `coupling.css`; use a high-contrast surface and visible focus styles. Do not put persistent save warnings into this transient component.

**Step 4: Re-run the focused suite**

Run: `npm run test:coupling`
Expected: the deletion/Undo browser test passes; existing tests remain green.

## Task 2: Canvas contextual edge editing and recovery

**Files:**
- Modify: `src/features/coupling/editors/WhiteboardEditor.tsx`
- Modify: `src/features/coupling/whiteboard/whiteboard.css`
- Test: `tests/coupling-regression.mjs`

**Step 1: Write failing tests for edit and Undo actions**

Extend the whiteboard tests to select an existing edge, open its details, verify relation/direction/preference, change a value and apply it, then delete the edge and invoke the snackbar Undo. Assert the original edge data is restored from the UI and the persisted v1 draft.

**Step 2: Run the focused tests and confirm failure**

Run: `npm run test:coupling`
Expected: tests fail because selected edges currently expose delete only and deletion has no snackbar.

**Step 3: Implement selected-edge context editing**

Add an explicit “Edit relationship” action to the selected edge context. Initialize the editor controls from that edge, distinguish edit mode from defaults for a new connection, and provide an Apply action that updates that edge through the existing `remember`/`commit` path. Closing or cancelling edit mode must leave the edge unchanged. Keep node deletion behavior unchanged.

**Step 4: Add Undo feedback for reversible canvas actions**

For edge/node deletion and successful connection creation, preserve the existing undo snapshot and show a snackbar whose Undo calls the existing `undo()` function. Avoid stacking multiple snackbars. Do not add transient feedback for every pointer movement or zoom update.

**Step 5: Run canvas regression tests**

Run: `npm run test:coupling`
Expected: existing canvas gesture, toolbar, fit, and undo tests plus the new edit/recovery tests pass.

## Task 3: Keyboard relay shortcuts and direct confirmation editing

**Files:**
- Modify: `src/features/coupling/editors/KeyboardEditor.tsx`
- Modify: `src/features/coupling/keyboard/keyboard.css`
- Test: `tests/coupling-regression.mjs`

**Step 1: Add failing filtered-shortcut and confirmation-edit tests**

After selecting a center, filter partner search to a known character and press `1`; assert that the first visible filtered result is selected, not the first library character. In confirmation, assert relationship and preference controls can be changed without navigating back to the relationship step, and that confirming persists the revised values.

**Step 2: Run the focused tests and confirm failure**

Run: `npm run test:coupling`
Expected: the shortcut test selects the static library result and the confirmation controls are absent.

**Step 3: Derive shortcut choices from visible picker results**

Expose the current filtered/sorted result IDs from `CharacterPicker` through a narrowly scoped callback or shared selector. Use those IDs for `1–9` and the displayed shortcut hint. Ignore absent indices and preserve IME/composition and editable-field guards.

**Step 4: Add direct relation/preference edits to confirmation**

Render the same relation and preference controls in confirmation, initialized from the pending connection. Keep the chosen target and existing-edge warning visible. Ensure editing a saved edge still updates only after the explicit confirm action.

**Step 5: Run keyboard relay regressions**

Run: `npm run test:coupling`
Expected: relay sequencing, center retention, reverse-pair update, IME, shortcut alignment, and direct confirmation-edit tests pass.

## Task 4: Pair-card collection controls and deletion recovery

**Files:**
- Modify: `src/features/coupling/editors/PairsEditor.tsx`
- Modify: `src/features/coupling/pairs/pairs.css`
- Test: `tests/coupling-regression.mjs`

**Step 1: Add failing collection and deletion tests**

Create several cards with different relation types and names. Assert collection-level relation filtering and sort order operate on the collection, while the editor form remains unchanged. Delete a card and assert the snackbar Undo restores the same card and its order.

**Step 2: Run the focused tests and confirm failure**

Run: `npm run test:coupling`
Expected: no collection controls or per-delete snackbar exists.

**Step 3: Add collection-level filtering and sorting**

Add controls outside the individual cards for all/relationship filtering and stable sorting (creation order, A–Z, and reverse direction). Derive a visible card list from `draft.pairs`; never reorder or delete persisted cards just by changing a view control. Keep reset and form save behavior as-is.

**Step 4: Group secondary card actions and add Undo**

Keep Edit discoverable as a direct action. Group reorder and Delete under a labeled per-card secondary-actions disclosure on compact layouts, while retaining accessible names. Reuse the shared snackbar for deletion and restore the complete pre-delete snapshot with one Undo.

**Step 5: Run pair-card regressions at desktop and compact widths**

Run: `npm run test:coupling`
Expected: pair validation, direction, memo, deduplication, edit/reorder, filter/sort, delete/Undo, and existing responsive checks pass.

## Task 5: Matrix input context, Undo, and compact pair-entry mode

**Files:**
- Modify: `src/features/coupling/editors/MatrixEditor.tsx`
- Modify: `src/features/coupling/matrix/matrix.css`
- Test: `tests/coupling-regression.mjs`

**Step 1: Add failing matrix context, Undo, and compact-mode tests**

Assert the grid has a nearby persistent summary of selected relation, preference, and directed/undirected mode. Apply and remove a cell value, then undo each action and verify the exact record is restored. At a compact viewport, switch to a pair-entry view, select two roster members, apply the current relation, and verify the same draft record appears in the relation summary.

**Step 2: Run the focused tests and confirm failure**

Run: `npm run test:coupling`
Expected: no persistent context summary, pair-entry view, or transient Undo feedback exists.

**Step 3: Keep the matrix input context visible**

Place a compact selected-mode summary directly adjacent to the workspace and ensure selected relation/preferences are not communicated only by color. When switching directed/undirected modes, explain that each mode has its own record collection and do not mutate the inactive collection.

**Step 4: Add compact pair-entry mode**

Add a view switch available at compact widths: Matrix / Pair entry. Pair entry uses two labeled character selectors drawn from the current roster, excludes the same character in both selectors, and applies the already-selected relation/preference/mode through the same `changeRelation` path. Show current records in the existing relation summary and offer an edit/remove route. Keep the matrix available; do not change the 16-character limit or saved schema.

**Step 5: Add matrix Undo feedback**

After cell apply/remove and roster removal, show the shared snackbar and call the existing history-backed `undo()` on action. Ensure one undo restores the full prior roster and both directed/undirected data where applicable.

**Step 6: Run matrix regressions at desktop and compact widths**

Run: `npm run test:coupling`
Expected: directed independence, symmetric unordered records, roster limit, keyboard grid navigation, Undo, compact pair-entry, and persistence tests pass.

## Task 6: Cross-editor visual, accessibility, and compatibility verification

**Files:**
- Review: `src/features/coupling/coupling.css`
- Review: `src/features/coupling/components/CouplingSnackbar.tsx`
- Review: all four editor CSS files
- Test: `tests/coupling-regression.mjs`

**Step 1: Add/extend compact target and keyboard-only checks**

Assert snackbar actions are keyboard reachable, Escape/dismiss does not steal focus, selected-state text remains present without color, and no critical editor controls fall below the agreed 44–48px touch target range without a documented dense-grid exception.

**Step 2: Run all coupling browser tests**

Run: `npm run test:coupling`
Expected: all regression tests pass.

**Step 3: Run production build and whitespace validation**

Run: `npm run build && git diff --check`
Expected: build succeeds and no whitespace errors are reported.

**Step 4: Check TypeScript/LSP diagnostics and persisted data**

Run the repository's available type-check command if present; inspect diagnostics for all modified TypeScript files. In browser tests, verify all four `introduce:coupling:*:v1` storage keys retain their current shape and that unrelated local changes remain unstaged.

**Step 5: Summarize changed files and verification**

Report the four editor behaviors, shared feedback behavior, test/build output, any deviations, and explicitly state that unrelated work was preserved. Do not push unless requested.
