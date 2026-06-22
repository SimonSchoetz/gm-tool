# SF6 — `LinkInput.css` update for inline layout

Updates `LinkInput.css` to reflect the restructured component. Removes standalone modal panel styles (GlassPanel context). Adds `flex: 1` to fill available row width.

## Files Affected

**Modified:**
- `src/components/TextEditor/components/FloatingToolBar/components/LinkInput/LinkInput.css`

## Frontend

### Purpose

`LinkInput` is now an inline flex child within `.floating-toolbar-link-row`. Its CSS no longer needs standalone panel styles (`border-radius`, background context) — those belong to the parent `EditorPopup`. The container must grow to fill remaining row width so the Input field expands to use available space.

### `LinkInput.css` — full replacement

Violations removed in this SF:
- `width: 180px` on `.link-input input` — raw pixel, banned [verified: `src/components/TextEditor/components/FloatingToolBar/components/LinkInput/LinkInput.css:16`].
- `border-bottom: 1px solid var(--color-primary)` — `1px` is a raw pixel value, banned [verified: `src/components/TextEditor/components/FloatingToolBar/components/LinkInput/LinkInput.css:12`].
- `background: transparent; border: none; outline: none` on `.link-input input` — these were styled for the `GlassPanel` modal context which no longer applies.

`border-radius: var(--radius-md)` is removed — `.link-input` is now an inline row element, not a standalone panel; rounding the container has no visual purpose.

```css
.link-input {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
  flex: 1;
}

.link-input input {
  flex: 1;
}
```

Notes:
- `flex: 1` on `.link-input` — makes the container grow to fill the remaining width in `.floating-toolbar-link-row` after the `<span>` wrapping `LinkBtn` takes its natural size.
- `flex: 1` on `.link-input input` — makes the `Input` component's underlying `<input>` element grow to fill `.link-input` after the `ClickableIcon` (Apply button) takes its natural size. The `Input` component renders a bare `<input>` and spreads all props including `className` — this rule targets that element directly.
- `padding: var(--spacing-xs)` is retained from the original `.link-input` rule — it provides visual breathing room between the link row's edges and the input/button.
