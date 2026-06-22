# SF5 — `FloatingToolbar.css` two-row layout

Updates `FloatingToolbar.css` to support the new two-row structure introduced by SF4. Adds class rules for `.floating-toolbar-buttons` and `.floating-toolbar-link-row`.

## Files Affected

**Modified:**
- `src/components/TextEditor/components/FloatingToolBar/FloatingToolbar.css`

## Frontend

### Purpose

Provides layout for the two-row floating toolbar. `.floating-toolbar` is a column flex container; `.floating-toolbar-buttons` is the first row; `.floating-toolbar-link-row` is the second row.

### `FloatingToolbar.css` — full replacement

The previous `padding: 1px; /* one-off */` violation is resolved: `--border-thin: 1px` now exists in `styles/variables/border-variables.css` [verified: `src/styles/variables/border-variables.css:9`].

```css
.floating-toolbar {
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  padding: var(--border-thin);
  border-radius: var(--radius-md);
  width: max-content;
}

.floating-toolbar-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.floating-toolbar-link-row {
  display: flex;
  align-items: center;
}
```

Notes:
- `gap` is removed from `.floating-toolbar` (it spaced buttons horizontally; now the column container's children are the two rows, not the buttons directly). Row-internal gaps are handled by `.floating-toolbar-buttons` and by `.link-input` (in SF6).
- No `gap` on `.floating-toolbar-link-row` — spacing within the link row comes from `.link-input`'s own `padding: var(--spacing-xs)` and `gap: var(--spacing-xs)` (see SF6). The `<span>` wrapping `LinkBtn` and the `LinkInput` component are siblings in the row; no explicit row-level gap is needed because `.link-input` carries its own padding.
- `width: max-content` is retained. In a column flex container, each child row stretches to fill the container's cross-axis (width) by default (`align-self: stretch` is the flex default). The toolbar's width is set by the widest row — the buttons row — and the link row fills that width.
