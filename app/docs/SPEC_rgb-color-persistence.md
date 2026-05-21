# SPEC: RGB Color Persistence for Table Config

## Progress Tracker

- SF1: Seed and migration — convert hex color literals to `r, g, b` format; clear and re-seed
- SF2: ColorInput component — shared component with hex↔rgb helpers and required tests
- SF3: SettingsScreen — replace inline color input markup with `<ColorInput>`
- SF4: Consumer updates — update ScreenNavBtn, MentionBadge, MentionTypeaheadPlugin to consume `r, g, b` format via `rgb()` CSS wrapper

## Key Architectural Decisions

**Storage format: bare `r, g, b` string**
`tableConfig.color` is stored as a bare `r, g, b` string (e.g., `"74, 158, 255"`), not a full CSS `rgb()` function string. This matches the existing pattern used by static design tokens (`--color-primary-rgb: 57, 156, 187`) and enables CSS-level opacity composition: `rgba(var(--rt-...-color), 0.5)` expands to `rgba(74, 158, 255, 0.5)`. A full `rgb(r, g, b)` string would block this CSS pattern.

**CSS usage pattern**
Every site that renders the color as a CSS value wraps the variable in `rgb()`: `color: rgb(var(--rt-...-color))`. Opacity variants use `rgba(var(--rt-...-color), alpha)`. This is the same pattern used throughout `color-variables.css`.

**Migration strategy: DELETE + re-seed**
There is no production data. The migration runs `DELETE FROM table_config` immediately before `seedTableConfig()` in `initDatabase()`. The seed inserts fresh rows with `r, g, b` values. This is a one-time migration — remove the DELETE statement after first run, following the existing "TEMPORARY MIGRATION" pattern already in `database.ts`.

**ColorInput API: closed props with value in storage format**
`ColorInput` receives `value` as a `r, g, b` string (the DB format) and calls `onChange` with a `r, g, b` string. Conversion between the browser's hex output and `r, g, b` is internal — `rgbToHex` produces the hex string bound to `<input type="color">`, `hexToRgb` converts the picker's output back. No caller ever handles hex.

**Conversion helpers stay local to ColorInput**
`hexToRgb` and `rgbToHex` live in `ColorInput/helper/`. They have one consumer today and are not promoted to `src/util/`. Per placement rules, promotion requires both multiple consumers and a generic (domain-free) name.

**ScreenNavBtn fallback: `--color-fg-rgb` not `--color-fg`**
The fallback for a missing `configColor` changes from `'var(--color-fg)'` to `'var(--color-fg-rgb)'`. The CSS changes to `color: rgb(var(--domain-color))` — when `--domain-color` holds `var(--color-fg-rgb)`, CSS resolves to `rgb(248, 251, 251)`, which is valid.

---

## SF1: Seed and Migration

Update the eight seed color values from hex to `r, g, b`; add the one-time migration to clear existing rows before re-seeding.

### Files Affected

```
Modified: app/db/table-config/seed.ts
Modified: app/db/database.ts
```

### DB Changes

**`app/db/table-config/seed.ts`** — replace every `color` value:

| Entity | Old hex | New `r, g, b` |
|---|---|---|
| adventures | `'#4a9eff'` | `'74, 158, 255'` |
| npcs | `'#ff6b6b'` | `'255, 107, 107'` |
| foes | `'#e67e22'` | `'230, 126, 34'` |
| items | `'#9b59b6'` | `'155, 89, 182'` |
| locations | `'#2ecc71'` | `'46, 204, 113'` |
| factions | `'#f39c12'` | `'243, 156, 18'` |
| pcs | `'#1abc9c'` | `'26, 188, 156'` |
| sessions | `'#51cf66'` | `'81, 207, 102'` |

**`app/db/database.ts`** — add the following two lines immediately before `await seedTableConfig(database)`, inside the existing comment block:

```ts
// TEMPORARY MIGRATION — delete after first run
await database.execute('DELETE FROM table_config');
// END TEMPORARY MIGRATION
await seedTableConfig(database);
```

No other changes to `database.ts`.

---

## SF2: ColorInput Component

New shared component that owns the hex↔rgb conversion boundary. The browser color picker speaks hex; the rest of the app speaks `r, g, b`. This component is the only site where that translation happens.

### Files Affected

```
New: app/src/components/ColorInput/ColorInput.tsx
New: app/src/components/ColorInput/ColorInput.css
New: app/src/components/ColorInput/helper/index.ts
New: app/src/components/ColorInput/helper/hexToRgb.ts
New: app/src/components/ColorInput/helper/rgbToHex.ts
New: app/src/components/ColorInput/helper/__tests__/hexToRgb.test.ts
New: app/src/components/ColorInput/helper/__tests__/rgbToHex.test.ts
New: app/src/components/ColorInput/index.ts
Modified: app/src/components/index.ts — add ColorInput named export
```

### Frontend

**Purpose**: Encapsulates the color picker UI and hex↔rgb conversion. Receives and emits `r, g, b` strings so no caller handles hex.

**Behavior**:
- `value` prop is a `r, g, b` string. `onChange` is called with a `r, g, b` string after the user picks a color.
- On mount and on `value` change: `rgbToHex(value)` produces the `#rrggbb` string bound to the hidden `<input type="color">`.
- On input change: `hexToRgb(e.target.value)` converts the picker output and calls `onChange`.

**UI / Visual**:
- Root element: `<label className="color-input-wrapper">` — makes the entire area clickable, opening the picker.
- Hidden `<input type="color">` with `className="color-input-hidden"`, `color-space="display-p3"`. Positioned absolute, zero size, zero opacity.
- Visible `<span className="color-input-dot">` with `style={{ '--rt-color-input-color': value } as React.CSSProperties}`. Background set via CSS: `background-color: rgb(var(--rt-color-input-color))`. Hover scales up via CSS transition.

**Props pattern**: `FCProps<Props>` with `type Props = { value: string; onChange: (value: string) => void }`.

**`ColorInput.css`**:

```css
.color-input-wrapper {
  position: relative;
  cursor: pointer;
  display: flex;
}

.color-input-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.color-input-dot {
  /* one-off size — no matching dimension token */
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  cursor: pointer;
  background-color: rgb(var(--rt-color-input-color));
  transition: transform var(--transition-fast);
}

.color-input-dot:hover {
  transform: scale(1.3);
}
```

**`helper/hexToRgb.ts`** — converts a 6-digit lowercase hex string (e.g., `'#4a9eff'`) to `'r, g, b'` (e.g., `'74, 158, 255'`). Parse each pair with `parseInt(hex.slice(n, n+2), 16)`.

**`helper/rgbToHex.ts`** — converts `'r, g, b'` to a 6-digit lowercase hex string (e.g., `'#4a9eff'`). Split by `', '`, parse each with `parseInt`, convert with `.toString(16).padStart(2, '0')`, prefix `'#'`.

**`helper/index.ts`** — explicit named exports:

```ts
export { hexToRgb } from './hexToRgb';
export { rgbToHex } from './rgbToHex';
```

**`helper/__tests__/hexToRgb.test.ts`** — required assertions:
- `hexToRgb('#4a9eff')` → `'74, 158, 255'`
- `hexToRgb('#000000')` → `'0, 0, 0'`
- `hexToRgb('#ffffff')` → `'255, 255, 255'`
- `hexToRgb('#ff6b6b')` → `'255, 107, 107'`

**`helper/__tests__/rgbToHex.test.ts`** — required assertions:
- `rgbToHex('74, 158, 255')` → `'#4a9eff'`
- `rgbToHex('0, 0, 0')` → `'#000000'`
- `rgbToHex('255, 255, 255')` → `'#ffffff'`
- `rgbToHex('255, 107, 107')` → `'#ff6b6b'`

**`ColorInput/index.ts`**:

```ts
export { ColorInput } from './ColorInput';
```

**`app/src/components/index.ts`** — add after the existing `DateInput` export line:

```ts
export { ColorInput } from './ColorInput';
```

---

## SF3: SettingsScreen Update

Replace the inline color picker markup in `TableConfigRow` with `<ColorInput>`. Remove the CSS classes that moved into `ColorInput.css`.

### Files Affected

```
Modified: app/src/screens/settings/SettingsScreen.tsx
Modified: app/src/screens/settings/SettingsScreen.css
```

### Frontend

**`SettingsScreen.tsx`**:

- Add `ColorInput` to the import from `@/components`.
- In `TableConfigRow`: remove the `handleColorChange` handler entirely.
- Replace the entire `<label className='settings-color-dot-wrapper'>...</label>` block (lines 44–56) with:

```tsx
<ColorInput
  value={config.color}
  onChange={(value) => {
    void updateTableConfig({ color: value });
  }}
/>
```

**`SettingsScreen.css`** — remove the three classes that moved to `ColorInput.css`:
- `.settings-color-dot-wrapper`
- `.settings-color-input-hidden`
- `.settings-color-dot` (including its `:hover` rule)

No other CSS changes.

---

## SF4: Consumer Updates

Update every site that uses `tableConfig.color` as a direct CSS value to wrap it in `rgb()`. Fix the existing CLAUDE.md violation in `MentionTypeaheadPlugin.tsx` (direct inline style with DB-sourced value). Replace the raw `14px` literal in `MentionTypeaheadPlugin.css` with `--font-size-base`.

### Files Affected

```
Modified: app/src/components/SideBarNav/components/ScreenNavBtn/ScreenNavBtn.tsx
Modified: app/src/components/SideBarNav/components/ScreenNavBtn/ScreenNavBtn.css
Modified: app/src/components/TextEditor/components/MentionBadge/MentionBadge.css
Modified: app/src/components/TextEditor/plugins/MentionTypeaheadPlugin.tsx
Modified: app/src/components/TextEditor/plugins/MentionTypeaheadPlugin.css
```

### Frontend

**`ScreenNavBtn.tsx`** — change the fallback value only:

```tsx
'--domain-color': configColor ?? 'var(--color-fg-rgb)',
```

**`ScreenNavBtn.css`** — update the hover rule:

```css
.screen-nav-btn-content:hover {
  color: rgb(var(--domain-color));
}
```

**`MentionBadge.css`** — update the color declaration:

```css
.mention-badge {
  cursor: pointer;
  font-weight: 500;
  color: rgb(var(--rt-mention-pop-up-color));
}
```

(`MentionBadge.tsx` requires no change — `'--rt-mention-pop-up-color': color` already uses the CSS custom property pattern correctly. The CSS change alone is sufficient.)

**`MentionTypeaheadPlugin.tsx`** — fix the existing direct inline style violation on the `<li>` element. Replace:

```tsx
style={{ color: option.result.color }}
```

with:

```tsx
style={{ '--rt-mention-typeahead-item-color': option.result.color } as React.CSSProperties}
```

**`MentionTypeaheadPlugin.css`** — two changes:
1. Add `color: rgb(var(--rt-mention-typeahead-item-color))` to `.mention-typeahead-item`.
2. Replace `font-size: 14px` with `font-size: var(--font-size-base)` on `.mention-typeahead-item`.

The `14px` raw pixel value is a pre-existing violation; it is fixed here because this file is touched.

---

## CLAUDE.md Impact

None. No new structural patterns, layers, or module conventions are introduced. `ColorInput` follows the existing `Input`/`DateInput` component shape. The `r, g, b` storage pattern is consistent with the existing `--color-primary-rgb` token convention already documented in `color-variables.css`.
