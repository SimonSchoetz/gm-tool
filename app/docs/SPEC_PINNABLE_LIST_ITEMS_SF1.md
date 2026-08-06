# SF1 — Shared popup extraction

Promote the anchored popup, its surface chrome, and the menu option row out of `TextEditor/` into `src/components/`, so a list row can use the same popup vocabulary the editor already uses. No observable behavior changes: every existing popup renders and behaves exactly as before.

`TextEditorPopupStyles.css` is dissolved. Each of its rule groups moves into the component that renders the elements it styles, renamed to that component's own block name — the `TEP-` prefix does not survive anywhere.

## Files affected

**Moved:**

- `mv app/src/components/TextEditor/components/EditorPopup/EditorPopup.tsx app/src/components/AnchoredPopup/AnchoredPopup.tsx` — then rename the exported component to `AnchoredPopup`, change the rendered class from `editor-popup` to `anchored-popup`, and update the stylesheet import to `./AnchoredPopup.css`. Component logic is unchanged: the capture-phase scroll listener, the click-outside effect, and the `ResizeObserver` clamp all stay exactly as they are, including their existing comments.
- `mv app/src/components/TextEditor/components/EditorPopup/EditorPopup.css app/src/components/AnchoredPopup/AnchoredPopup.css` — then rename the `.editor-popup` selector to `.anchored-popup`.
- `mv app/src/components/TextEditor/components/EditorPopup/helper/ app/src/components/AnchoredPopup/helper/` — `calculateHorizontalClampOffset.ts`, its `index.ts`, and `__tests__/calculateHorizontalClampOffset.test.ts` move unchanged. No content edits; the helper imports nothing from its parent.
- `mv app/src/components/TextEditor/components/EditorPopup/index.ts app/src/components/AnchoredPopup/index.ts` — then change the export to `export { AnchoredPopup } from './AnchoredPopup';`.
- `mv app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/components/TableHandleMenu/components/TableHandleMenuItem/TableHandleMenuItem.tsx app/src/components/MenuOptionRow/MenuOptionRow.tsx` — then rename the component to `MenuOptionRow`, add the `isSelected` prop described below, replace the seven-level relative imports (`.././../../../../../../ActionContainer/ActionContainer` and the `GlassPanel` equivalent) with `../ActionContainer/ActionContainer` and `../GlassPanel/GlassPanel`, rename the classes, and add the `./MenuOptionRow.css` import.

**New:**

- `app/src/components/AnchoredPopup/` — directory created by the moves above; no additional files.
- `app/src/components/PopupSurface/PopupSurface.tsx`
- `app/src/components/PopupSurface/PopupSurface.css`
- `app/src/components/MenuOptionRow/MenuOptionRow.css`

**Modified:**

- `app/src/components/index.ts` — add explicit named exports for the three promoted components.
- `app/src/components/TextEditor/components/FloatingToolbar/FloatingToolbar.tsx` — import path and component name.
- `app/src/components/TextEditor/plugins/EmbeddedLinkPlugin/EmbeddedLinkPlugin.tsx` — import path and component name.
- `app/src/components/TextEditor/plugins/MentionTypeaheadPlugin/MentionTypeaheadPlugin.tsx` — import path and component name.
- `app/src/components/TextEditor/plugins/SlashCommandPlugin/SlashCommandPlugin.tsx` — import path, component name, and the `TEP-container` / `TEP-scroll-area` class usage replaced by `PopupSurface`.
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/TableEdgeHandlePlugin.tsx` — import path, component name, and the `TEP-container` / `TEP-scroll-area` class usage replaced by `PopupSurface`.
- `app/src/components/TextEditor/plugins/SlashCommandPlugin/components/SlashCommandOptionList/SlashCommandOptionList.tsx` — rows now render `MenuOptionRow`; the `<li>` becomes a pure list wrapper.
- `app/src/components/TextEditor/plugins/SlashCommandPlugin/components/SlashCommandOptionList/SlashCommandOptionList.css` — drop the `@import '../../../TextEditorPopupStyles.css';` on line 1; keeps only its section-heading and item-label rules.
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/components/TableHandleMenu/TableHandleMenu.tsx` — import `MenuOptionRow` via the relative path below; rename the component at all four call sites (lines 117, 128, 142, 156).
- `app/src/components/TextEditor/plugins/SlashCommandPlugin/SlashCommandPlugin.css` — drop the `@import '../TextEditorPopupStyles.css';` on line 1; keep its `slash-command-scroll-area` rule.
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/TableEdgeHandlePlugin.css` — drop the `@import '../TextEditorPopupStyles.css';` on line 1.
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/components/TableHandleMenu/TableHandleMenu.css` — drop the `@import '../../../TextEditorPopupStyles.css';` on line 1.

**Deleted:**

- `app/src/components/TextEditor/plugins/TextEditorPopupStyles.css` — every rule has moved. It is reached by CSS `@import`, not by any TypeScript import, from exactly four stylesheets: `SlashCommandPlugin.css`, `TableEdgeHandlePlugin.css`, `TableHandleMenu.css`, and `SlashCommandOptionList.css` [spec-writer_17: `grep -rn TextEditorPopupStyles app/src` — four `@import` lines, no `.ts`/`.tsx` match]. All four are listed under Modified; the file is deleted only after the last of them drops its `@import`.
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/components/TableHandleMenu/components/` — the entire grouping folder, including its `index.ts`. `TableHandleMenuItem` was its only export, so the folder has no remaining purpose.

**No change needed (verified):**

- `app/src/components/TextEditor/components/index.ts` — exports only `FloatingToolbar` and `MentionBadge`; it never exported `EditorPopup`, so removing that directory does not touch it. Its two exports are explicit named exports, which is correct for a grouping barrel.

## Frontend

### `AnchoredPopup`

**Purpose** — the positioned portal. It is the only component in the codebase that knows how to place a floating element against an anchor rect and keep it inside the viewport, and it now serves both editor popups and list-row menus.

**Behavior** — unchanged from `EditorPopup`. It portals into `document.body`, re-renders on capture-phase document scroll, calls `onClickOutside` on outside mousedown when that prop is supplied, and clamps horizontally via a `ResizeObserver` that calls `setHorizontalOffset` with a primitive number. Returns nothing when `getAnchorRect()` yields `null`. The props type (`getAnchorRect`, `children`, `onClickOutside`) is unchanged.

Do not restructure the `ResizeObserver` into a synchronous `useLayoutEffect` measurement. The deferred form is deliberate: `react-hooks/set-state-in-effect` and `react-hooks/refs` both fire on the synchronous form, and `app/src/CLAUDE.md` requires the subscription-callback shape instead of suppressing either rule.

**UI / Visual** — renders one `div.anchored-popup` positioned at the anchor's top edge, horizontally centered on the anchor plus the clamp offset. `AnchoredPopup.css` carries only the positioning rules the old `.editor-popup` selector held; no chrome, no background.

### `PopupSurface`

**Purpose** — the visual shell that popup content sits inside: background, max width, radius, shadow, and inner padding. It exists so those rules live with the element that renders them instead of being applied by five separate consumers through a shared stylesheet.

This is a distinct component from the existing `PopUpContainer`, which is a full-screen modal with `role='dialog'` and `aria-modal`. Do not reuse, extend, or import `PopUpContainer` here.

**Behavior** — presentational only. No state, no effects, no event handlers.

**UI / Visual** — props are `React.ComponentProps<typeof GlassPanel>`, since the root node renders a `GlassPanel` and must stay in sync with its prop shape (props pattern case 2, `app/src/CLAUDE.md`). It renders a `GlassPanel` carrying `popup-surface` merged with any incoming `className`, wrapping a `div.popup-surface-scroll-area`.

`PopupSurface.css` receives the two rule groups formerly named `.TEP-container` and `.TEP-scroll-area`, renamed to `.popup-surface` and `.popup-surface-scroll-area`. Every declaration inside them is carried over unchanged, including the `max-width` value and its existing `/* one-off */` annotation — that annotation is the user's standing decision that the value needs no token and must not be removed or converted.

### `MenuOptionRow`

**Purpose** — one selectable option inside a popup: an icon in a glass container, a text label, and hover / active / selected states. Three consumers after this spec: the table handle menu, the slash command option list, and SF3's row actions menu.

**Behavior** — presentational. All interaction is delegated through the props it spreads onto `ActionContainer`.

**UI / Visual** — the props type is `{ Icon: LucideIcon; isActive?: boolean; isSelected?: boolean } & React.ComponentProps<typeof ActionContainer>`. `isActive` is carried over unchanged from `TableHandleMenuItem` and means "this option's state is currently applied"; `isSelected` is new and means "this option is the keyboard-highlighted one", which is the state the slash command list needs and the table handle menu does not use.

The rendered structure is unchanged from `TableHandleMenuItem`: an `ActionContainer` with `type='button'`, containing a `GlassPanel` icon container whose `intensity` is `'bright'` when `isActive` and `'dim'` otherwise, followed by a `<span>` holding the label. The only structural change is the class computation, which gains the selected modifier:

```tsx
cn('menu-option-row', isActive && 'menu-option-row--active', isSelected && 'menu-option-row--selected', className)
```

`MenuOptionRow.css` receives the four rule groups formerly named `.TEP--li`, `.TEP--li:hover` / `.TEP--li--selected`, `.TEP--li--active`, and `.TEP--li-icon-container` (including its `svg` sizing rule and its hover and selected variants), renamed to `.menu-option-row`, `.menu-option-row--active`, `.menu-option-row--selected`, and `.menu-option-row-icon`. Declarations are carried over unchanged. The `--` modifier form and the flat `-icon` child name are both required: `app/src/CLAUDE.md` — Styles bans the BEM `__` element suffix, and the old names must not survive because class names derived from a prior owner's name are a violation.

### `SlashCommandOptionList` restructure

**Purpose** — unchanged: it renders the Lexical typeahead's options with section headings.

**Behavior** — the Lexical machinery stays here and is not generalized: `selectedIndex`, `setHighlightedIndex`, `selectOptionAndCleanUp`, the `option.setRefElement` callback, and the `scrollIntoView` effect all remain in this file untouched.

What changes is only which element carries what. The `<li>` keeps the ref callback and the section-heading sibling, and loses the `TEP--li` classes and the interaction handlers. A `MenuOptionRow` is rendered inside it, receiving `label={option.label}`, `Icon={option.Icon}`, `isActive={activeOptionKeys.has(option.key)}`, `isSelected={i === selectedIndex}`, and the `onClick` and `onMouseEnter` handlers the `<li>` previously carried. A `<button>` inside an `<li>` is valid; the ref stays on the `<li>` because `scrollIntoView` targets the list item.

**UI / Visual** — visually identical to today. `SlashCommandOptionList.css` keeps `slash-command-option-list-section-heading` and `slash-command-option-list-item-label`. Verify after the change whether the label span still needs its own class now that `MenuOptionRow` owns the label element — if the rule has no remaining selector match, delete it rather than leaving it orphaned.

### Barrel updates

`app/src/components/index.ts` is a grouping barrel and uses explicit named exports throughout. Add:

```ts
export { AnchoredPopup } from './AnchoredPopup';
export { PopupSurface } from './PopupSurface/PopupSurface';
export { MenuOptionRow } from './MenuOptionRow/MenuOptionRow';
```

`AnchoredPopup` exports through its own `index.ts` because it owns a `helper/` subdirectory; `PopupSurface` and `MenuOptionRow` are flat single-file modules and are exported directly from their file, matching the existing style of neighbouring entries such as `ClickableIcon` and `HorizontalDivider`.

Every consumer in this sub-feature sits inside `src/components/` and must therefore import via a direct relative path, never through `@/components` — that barrel exports these components, so importing through it from within the same folder closes a cycle. The depth differs per file, so each path is given explicitly rather than inferred:

| Importer | Import path |
| --- | --- |
| `TextEditor/components/FloatingToolbar/FloatingToolbar.tsx` | `../../../AnchoredPopup` |
| `TextEditor/plugins/EmbeddedLinkPlugin/EmbeddedLinkPlugin.tsx` | `../../../AnchoredPopup` |
| `TextEditor/plugins/MentionTypeaheadPlugin/MentionTypeaheadPlugin.tsx` | `../../../AnchoredPopup` |
| `TextEditor/plugins/SlashCommandPlugin/SlashCommandPlugin.tsx` | `../../../AnchoredPopup`, `../../../PopupSurface/PopupSurface` |
| `TextEditor/plugins/TableEdgeHandlePlugin/TableEdgeHandlePlugin.tsx` | `../../../AnchoredPopup`, `../../../PopupSurface/PopupSurface` |
| `TextEditor/plugins/SlashCommandPlugin/components/SlashCommandOptionList/SlashCommandOptionList.tsx` | `../../../../../MenuOptionRow/MenuOptionRow` |
| `TextEditor/plugins/TableEdgeHandlePlugin/components/TableHandleMenu/TableHandleMenu.tsx` | `../../../../MenuOptionRow/MenuOptionRow` |

Paths are relative to `app/src/components/`. `AnchoredPopup` resolves through its module barrel because it owns a `helper/` subdirectory; `PopupSurface` and `MenuOptionRow` are flat single-file modules with no barrel, so the explicit file path is the correct and only valid form.

No backward-compatibility re-export may be added at any old path. `app/CLAUDE.md` bans a re-export introduced solely to preserve existing import paths.

## Tests

`calculateHorizontalClampOffset.test.ts` moves with its helper and its assertions are unchanged — the helper's logic and constants are untouched.

No new tests. All three promoted components return JSX, and `app/src/CLAUDE.md` — Testing Policy forbids unit tests for React components.

## Verification

After this sub-feature, `grep -r "TEP-" app/src` must return nothing, and `grep -r "EditorPopup\|TableHandleMenuItem" app/src` must return nothing. Both grep results are the completion condition for the extraction.
