# Coupling FAB and Keyboard UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clarify whiteboard action hierarchy and make keyboard relay a single, sequential, beginner-friendly workflow.

**Architecture:** Keep move, connect, line settings, undo, and more in `.coupling-board-controls`; move view, redo, layout, and reset into overflow. In the keyboard editor, place center picker, relationship/preference controls, partner picker, and confirmation inside one active-step panel. Keep data schema and persistence unchanged.

**Tech Stack:** React, TypeScript, CSS, Playwright via `node --test tests/coupling-regression.mjs`.

---

### Task 1: Clarify the whiteboard toolbar hierarchy

**Files:**
- Modify: `src/features/coupling/whiteboard/whiteboard.css` (the `.coupling-board-controls` and `.coupling-board-tool` rules around lines 36-78 and mobile overrides around lines 1077-1118)
- Test: `tests/coupling-regression.mjs` (desktop and mobile whiteboard tests around lines 83-92 and 680-702)

**Step 1: Add failing hierarchy and size assertions**

Assert that only move, connect, line settings, undo, and more are in the toolbar; view and redo remain available in overflow; the tray fits a compact bounding box; and mobile controls preserve 48px touch targets.

**Step 2: Run the focused regression test**

Run: `npm run test:coupling`
Expected: the action hierarchy assertions fail against the current seven-item tray.

**Step 3: Adjust only FAB sizing**

Move secondary actions into the existing overflow panel, retain undo as a primary action, surface the current relationship/direction, and make mobile labels readable while keeping 48px buttons.

**Step 4: Re-run the focused regression test**

Run: `npm run test:coupling`
Expected: PASS, including the existing viewport containment and touch-target checks.

### Task 2: Make keyboard relay a single sequential workflow

**Files:**
- Modify: `src/features/coupling/editors/KeyboardEditor.tsx` (the starter roster below the graph around lines 193-194, center slot/library around lines 197 and 204)
- Modify: `src/features/coupling/keyboard/keyboard.css` (roster rules around lines 34-38, if no longer used)
- Modify: `tests/coupling-regression.mjs` (keyboard relay tests around lines 427-485 and saved-draft test around lines 892-898)

**Step 1: Add failing workflow assertions**

Assert no default center is shown, center and partner pickers live inside the active step, relationship selection does not advance, preference stays with relationship setup, previous/cancel/reset rules remain coherent, and successful connection retains center/settings for the next partner.

**Step 2: Run the focused regression test**

Run: `npm run test:coupling`
Expected: the separate-library and immediate-advance assertions fail against the current DOM.

**Step 3: Remove the duplicate control and retain the single path**

Embed the shared character picker in the active source/target step; remove the separate library mode switch. Add an explicit next action after relationship/preference selection, a consistent back/cancel/reset path, and a management disclosure for destructive actions. Hide the default center until a center has been selected or restored from a saved draft. Keep schema and autosave unchanged.

**Step 4: Verify the guided workflow and accessibility**

Ensure current-step instructions and picker remain together, keyboard shortcuts do not bypass text input or IME composition, and existing relationships can still be edited, saved, and undone.

**Step 5: Run the focused regression test**

Run: `npm run test:coupling`
Expected: PASS, including existing relation editing, autosave, shortcut, focus, and responsive checks.

### Task 3: Verify the combined changes

**Files:**
- Verify: `src/features/coupling/whiteboard/whiteboard.css`
- Verify: `src/features/coupling/editors/KeyboardEditor.tsx`
- Verify: `tests/coupling-regression.mjs`

**Step 1: Run full coupling regression suite**

Run: `npm run test:coupling`
Expected: all coupling browser regressions pass.

**Step 2: Run the production build**

Run: `npm run build`
Expected: TypeScript and Vite production build pass.

**Step 3: Inspect final diff and repository status**

Run: `git diff --check && git status --short`
Expected: no whitespace errors; only intended coupling UI/test changes are introduced in addition to pre-existing user changes. Do not stage or modify the unrelated pre-existing files.
