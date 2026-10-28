# Coupling FAB and Keyboard UX Design

## Goals

- Reduce the whiteboard's floating tool-menu clutter without harming touch usability or discoverability.
- Make the keyboard editor's center-character selection unambiguous and guide users through one clear relationship-entry flow.

## Design

### Whiteboard floating tool menu

Keep move, connect, line settings, undo, and more in the primary floating toolbar. Move view controls, redo, full layout, and reset into the more panel. Show the active relationship and direction in the line-settings control, keep the add-character action separate, and preserve 48px toolbar touch targets and accessible names.

### Keyboard editor

Use one right-side step panel for center selection → relationship and preference → partner selection → confirmation. The center picker appears in the first step; do not display the draft's default center as selected before a user chooses one. Relationship choice does not advance automatically. Keep the selected center and relationship settings after connecting a partner. Move reset and clear actions into a management disclosure, retain the graph as a preview, and preserve existing draft data and autosave.

## Constraints and verification

- Do not change draft storage format or data migration behavior.
- Preserve responsive behavior, accessible labels/focus, and all existing relationship actions.
- Verify toolbar overflow actions, relationship edits, cancellation/back/reset rules, consecutive partner entry, persistence, undo, mobile targets, and the production build.
