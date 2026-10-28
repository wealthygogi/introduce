# Coupling FAB and Keyboard UX Design

## Goals

- Make the floating character-add action on the whiteboard feel less oversized without harming touch usability or discoverability.
- Make the keyboard editor's center-character selection unambiguous and guide users through one clear relationship-entry flow.

## Design

### Whiteboard FAB

Keep the existing labeled extended FAB. Retain its label, reduce the mobile horizontal padding, icon size, and icon/label gap, and keep the touch target at least 48px high. Keep the desktop button's minimum touch target intact. This preserves discoverability while reducing visual bulk.

### Keyboard editor

Use the right-side input rail as the only place to change the center character. Remove the separate starter-character roster beneath the graph, while keeping the graph's center node as a read-only visualization of the current center. Present the workflow as center selection, relationship selection, partner selection, and confirmation. Keep existing relationship data, automatic saving, editing, and keyboard shortcuts intact.

## Constraints and verification

- Do not change draft storage format or data migration behavior.
- Preserve responsive behavior, accessible labels/focus, and all existing relationship actions.
- Update coupling regression assertions for the FAB sizing and keyboard selection flow, then run the coupling tests and project checks relevant to the changed files.
