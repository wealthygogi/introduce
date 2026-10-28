# Coupling Editors: Four-Concept UX Refinement

## Goal

Refine all four coupling editors—free canvas, keyboard relay, pair cards, and relationship matrix—using the Material Design 3 and UX recommendations already reviewed. Preserve the current editor concepts, saved draft schema, unrelated user changes, and existing workflows unless a change is explicitly described below.

## Shared design principles

- Keep persistent information (such as save state and input context) inline; use one brief Snackbar for transient outcomes, with Undo when the action is reversible.
- Make selected relation, direction, and preference visible near the point of entry. Do not rely on color alone to communicate meaning or state.
- Keep controls comfortably operable on touch devices and adapt information-dense workflows rather than merely shrinking them.
- Retain keyboard and screen-reader operation, including visible focus, meaningful labels, and announcements for consequential actions.
- Do not change persisted draft formats unless implementation proves it unavoidable; prefer UI-only state and existing undo/history mechanisms.

## Editor designs

### Free canvas

- Keep the floating toolbar and its compact primary actions.
- After reversible edits such as deleting a node/edge or completing a connection, show concise feedback with an Undo action where practical.
- Improve selected-item context so relation, direction, and preference can be inspected and edited without hunting through the canvas.
- Keep confirmations for destructive board-wide reset/layout operations.

### Keyboard relay

- Keep the explicit center → relationship → target → confirmation workflow.
- In the confirmation step, show the chosen relation and preference with a direct way to edit them; avoid requiring multiple Back steps.
- Make 1–9 shortcuts select from the current filtered result set, and keep shortcut/help text aligned with actual behavior.
- Preserve center and relationship settings across successful connections.

### Pair cards

- Keep the combined pair editor and card collection concept, including responsive single-column cards on compact screens.
- Add collection-level sorting/filtering outside individual cards so each card is not burdened with collection controls.
- Group per-card actions so content remains scannable, while keeping common edit/reorder operations discoverable.
- Make deletion recovery immediate and clear; keep reset confirmation for full destructive actions.
- Review the post-save flow so repeated entry and editing existing cards remain efficient.

### Relationship matrix

- Keep the matrix as the fast bulk-entry mode, including directed/undirected modes, sticky axes, and keyboard navigation.
- Keep the active relation, preference, and direction context visible near the grid.
- Provide prompt Undo feedback after applying or removing cell values.
- For compact screens and large rosters, provide an adaptive pair-entry/list workflow rather than forcing the full matrix into a narrow viewport.
- Explain that directed and undirected data are stored in separate modes when switching between them.

## Feedback and accessibility

- A Snackbar is transient, non-blocking, and limited to one at a time. Durable save warnings and save status stay inline.
- Undo actions must restore the complete prior state for that editor, including affected relationships and ordering where relevant.
- Interactive targets should be reviewed against a 48px touch target goal. Dense matrix cells may use a purpose-built compact workflow on small screens.
- Relation identity continues to use text/symbol as well as color; contrast must be checked for text and focus indicators.
- Dialog and panel focus return, Escape behavior, live announcements, and keyboard shortcuts must remain coherent after changes.

## Data and compatibility

- No intentional changes to local draft schemas, migration behavior, or autosave ownership.
- New filters, responsive modes, and selection context are presentation state unless persistence is essential to user expectations.
- Existing data should render identically when the user switches concepts or reloads the page.

## Verification

- Add regression coverage for each new behavior before implementation.
- Exercise all four editor routes at desktop and compact widths, including keyboard-only operation and screen-reader-visible status text.
- Verify Undo for representative edits/deletions, matrix mode switching, keyboard shortcut/result alignment, and persistence compatibility.
- Run coupling regression tests, production build, `git diff --check`, and available type/LSP diagnostics.

## Approval

This design is the implementation scope approved by the user in the conversation on 2026-10-29 (“그대로”).
