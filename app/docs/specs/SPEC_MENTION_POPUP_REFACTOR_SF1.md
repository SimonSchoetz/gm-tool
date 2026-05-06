# SF1: Global CSS Foundations

Add the `.avatar-dimensions` global utility class to `global.css` and remove the fixed width from `.mention-popup`.

---

## Files Affected

- Modified: `app/src/styles/global.css`
- Modified: `app/src/components/MentionPopup/MentionPopup.css`

---

## Frontend

**Purpose:** Establish the shared CSS utilities that SF4 (EntityPopupBody) and SF5 (NpcPopupContent) depend on before those components are written. Remove the hardcoded `width: 280px` from `.mention-popup` so popup width is determined by content.

**Behavior:** No interactive behavior. CSS-only change. Existing popups will resize to fit their content width once the fixed width is removed.

**UI / Visual:**

**`global.css` addition:**

```css
/* 200px is a deliberate one-off for popup avatar sizing — no design token exists for this value */
.avatar-dimensions {
  width: 200px;
  aspect-ratio: 1 / 1;
}
```

Append after the last rule in the file (after `.global-btn-styles:active`).

**`MentionPopup.css` change:**

Remove `width: 280px` from `.mention-popup`. The rule becomes:

```css
.mention-popup {
  position: fixed;
  left: var(--rt-x);
}
```

All other rules in `MentionPopup.css` remain unchanged.
