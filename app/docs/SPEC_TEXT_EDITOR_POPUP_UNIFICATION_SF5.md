# SF5 — `FloatingToolbar.css` two-row layout

Updates `FloatingToolbar.css` to support the new two-row structure introduced by SF4. Adds class rules for `.floating-toolbar-buttons` and `.floating-toolbar-link-row`.

## Files Affected

**Modified:**
- `src/components/TextEditor/components/FloatingToolBar/FloatingToolbar.css`

## Frontend

### Purpose

Provides layout for the two-row floating toolbar. `.floating-toolbar` is a column flex container; `.floating-toolbar-buttons` is the first row; `.floating-toolbar-link-row` is the second row.

### `FloatingToolbar.css` — full replacement

**Violation carried forward:** The current file contains `padding: 1px; /* one-off */` — a raw pixel value that violates the design token obligation [verified: `src/components/TextEditor/components/FloatingToolBar/FloatingToolbar.css:5`]. No `--border-width-1px` or equivalent token exists in `styles/variables/` [verified: `src/styles/variables/border-variables.css` — only radius tokens; `src/styles/variables/spacing-variables.css` — smallest token is `--spacing-xs: 0.25rem`]. Per the no-unilateral-additions rule, this value is carried forward with the `/* one-off */` comment intact until the user authorises a new token or approves a different treatment.

```css
.floating-toolbar {
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  padding: 1px; /* one-off */
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
