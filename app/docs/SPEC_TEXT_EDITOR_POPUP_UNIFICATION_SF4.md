# SF4 — `FloatingToolbar` restructure

[FOUNDATION: depends on SF2+SF3; all three must be staged as one commit. Stage as unit: `src/components/TextEditor/components/FloatingToolBar/components/LinkBtn/LinkBtn.tsx`, `src/components/TextEditor/components/FloatingToolBar/components/LinkInput/LinkInput.tsx`, `src/components/TextEditor/components/FloatingToolBar/FloatingToolbar.tsx`. Do not run baseline checks after this SF alone — run only after SF2 and SF3 are also complete. Additionally requires SF1 to be committed first (`./helper` barrel must exist before this file compiles).]

Replaces the modal link-input mode with a two-row fixed layout. Lifts link URL state from `LinkInput`. Adds Lexical selection read on toolbar open. Replaces `handleBlur` close logic with `EditorPopup.onClickOutside`.

## Files Affected

**Modified:**
- `src/components/TextEditor/components/FloatingToolBar/FloatingToolbar.tsx`

**No change needed (verified):**
- `src/components/TextEditor/components/FloatingToolBar/components/index.ts` — barrel names `LinkBtn` and `LinkInput` unchanged; only implementations differ. Barrel uses explicit named exports — compliant [verified: `src/components/TextEditor/components/FloatingToolBar/components/index.ts`].

## Frontend

### Purpose

`FloatingToolbar` is the root of the floating editor toolbar. It manages open/close state, Lexical event subscriptions, and link-row coordination state. In the new design, it always renders both button and link rows, controlling `LinkBtn` and `LinkInput` via props.

### Behaviour

**Toolbar open/close:**
- Opens when the Lexical editor has a non-collapsed text selection (detected via `mouseup` or `SELECTION_CHANGE_COMMAND` when not mid-mousedown).
- Closes via `EditorPopup.onClickOutside`, which fires on `mousedown` on any element outside the popup div. This covers both clicking the editor area (mousedown close — KAD: handleBlur removed) and clicking elsewhere on the page.
- On mousedown inside the editor root, `isMouseDownRef.current = true` prevents `SELECTION_CHANGE_COMMAND` from triggering a close during drag-to-select. On mouseup, `isMouseDownRef.current = false` and `updateToolbarVisibility()` re-evaluates, re-opening if selection is non-collapsed.

**Link-row initialisation on open:**
When `updateToolbarVisibility` determines the toolbar should open (non-collapsed selection), it calls `editor.getEditorState().read(getSelectionLinkUrl)` before calling `setIsOpen(true)`. The result determines:
- Non-null URL → `linkInputEnabled = true`, `linkUrl = url`, `linkInitialUrl = url`
- Null → `linkInputEnabled = false`, `linkUrl = ''`, `linkInitialUrl = ''`
`linkInputEnabledRef.current` is updated alongside `setLinkInputEnabled` at every call site.

**`handleLinkBtnClick`:**
- When `linkInputEnabled` is `true` (toggle off): set `linkInputEnabled = false`, `linkUrl = ''`, `linkInitialUrl = ''`. If `linkInitialUrl !== ''` (a link was last committed), dispatch `TOGGLE_LINK_COMMAND(null)` to remove the link from the Lexical selection.
- When `linkInputEnabled` is `false` (toggle on): set `linkInputEnabled = true`. `linkUrl` and `linkInitialUrl` stay `''` — no link exists in the selection at this point (confirmed by `linkInputEnabled` being false on entry).

**`handleLinkApply`:**
- `linkUrl.trim()` is non-empty → dispatch `TOGGLE_LINK_COMMAND(linkUrl.trim())`. Then set `linkInitialUrl = linkUrl` (reset dirty, Apply button disables).
- `linkUrl.trim()` is `''` → dispatch `TOGGLE_LINK_COMMAND(null)` (remove link). Then set `linkInputEnabled = false`, `linkUrl = ''`, `linkInitialUrl = ''`.

**SELECTION_CHANGE_COMMAND guard:** `linkInputEnabledRef.current` prevents `updateToolbarVisibility` from running while the link input is active (the user's focus is on the input; selection changes in the editor should not close the toolbar).

### `FloatingToolbar.tsx`

Full replacement of the component body. The component signature (`export const FloatingToolbar = ()`) is unchanged — no props, zero-props component. `FloatingToolbar.css` import is kept.

**Imports to add:**
- `{ TOGGLE_LINK_COMMAND } from '@lexical/link'`
- `{ getSelectionLinkUrl } from './helper'`

**Imports to remove:**
- No imports are removed from the existing set. `SELECTION_CHANGE_COMMAND`, `COMMAND_PRIORITY_LOW` from `lexical` are kept. `useRef`, `useState`, `useEffect` from `react` are kept. `EditorPopup`, all component imports — kept.

**State — remove:**
- `isLinkInputMode: boolean`
- `isLinkInputModeRef: React.MutableRefObject<boolean>`
- `enterLinkInputMode`, `exitLinkInputMode` functions

**State — add:**
- `const [linkInputEnabled, setLinkInputEnabled] = useState(false);`
- `const linkInputEnabledRef = useRef(false);`
- `const [linkUrl, setLinkUrl] = useState('');`
- `const [linkInitialUrl, setLinkInitialUrl] = useState('');`

Note: `useRef(false)` — type annotation omitted because `boolean` is inferrable from the initializer `false`, per CLAUDE.md.

**Early-return guard — retained:** The `if (!isOpen) return null;` guard immediately before the `return (<EditorPopup>...)` block is unchanged. The EditorPopup and its children are not rendered when no selection is active. This is unrelated to the link-row restructure.

**`updateToolbarVisibility` — modifications:**
Replace `if (isLinkInputModeRef.current) return;` with `if (linkInputEnabledRef.current) return;`.

In the branch that calls `setIsOpen(true)`, insert the link state initialisation immediately before `setIsOpen(true)`:

```typescript
const existingUrl = editor.getEditorState().read(getSelectionLinkUrl);
const hasLink = existingUrl !== null;
linkInputEnabledRef.current = hasLink;
setLinkInputEnabled(hasLink);
setLinkUrl(existingUrl ?? '');
setLinkInitialUrl(existingUrl ?? '');
```

**`handleBlur` — remove completely:** Remove the `const handleBlur` definition, `rootElement.addEventListener('blur', handleBlur)`, and `rootElement.removeEventListener('blur', handleBlur)` from the effect cleanup.

**New handlers (defined at component scope, outside `useEffect`):**

```typescript
const handleLinkBtnClick = () => {
  if (linkInputEnabled) {
    linkInputEnabledRef.current = false;
    setLinkInputEnabled(false);
    setLinkUrl('');
    setLinkInitialUrl('');
    if (linkInitialUrl !== '') {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  } else {
    linkInputEnabledRef.current = true;
    setLinkInputEnabled(true);
  }
};

const handleLinkApply = () => {
  const trimmed = linkUrl.trim();
  if (trimmed !== '') {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, trimmed);
    setLinkInitialUrl(linkUrl);
  } else {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    linkInputEnabledRef.current = false;
    setLinkInputEnabled(false);
    setLinkUrl('');
    setLinkInitialUrl('');
  }
};
```

`handleLinkBtnClick` and `handleLinkApply` close over `editor` (from `useLexicalComposerContext()`), all state values, and `linkInputEnabledRef`. They are defined at the component body level (not inside `useEffect`) and referenced in JSX. This is the same pattern as the existing effect callbacks being called from JSX event handlers.

**JSX — full replacement:**

```tsx
return (
  <EditorPopup
    getAnchorRect={() => selectionRangeRef.current?.getBoundingClientRect() ?? null}
    onClickOutside={() => setIsOpen(false)}
  >
    <div className='floating-toolbar'>
      <div
        className='floating-toolbar-buttons'
        onMouseDown={(e) => { e.preventDefault(); }}
      >
        {headingBtns.map((btn) => (
          <HeadingBtn
            key={btn.headingType}
            label={btn.label}
            headingType={btn.headingType}
            icon={btn.icon}
          />
        ))}
        <Divider />
        {textFormatBtns.map((btn) => (
          <TextFormatBtn
            key={btn.formatType}
            label={btn.label}
            formatType={btn.formatType}
            icon={btn.icon}
          />
        ))}
        <Divider />
        {listBtns.map((btn) => (
          <ListBtn
            key={btn.listType}
            label={btn.label}
            listType={btn.listType}
            icon={btn.icon}
          />
        ))}
      </div>
      <div className='floating-toolbar-link-row'>
        <span onMouseDown={(e) => { e.preventDefault(); }}>
          <LinkBtn isActive={linkInputEnabled} onClick={handleLinkBtnClick} />
        </span>
        <LinkInput
          value={linkUrl}
          onChange={setLinkUrl}
          disabled={!linkInputEnabled}
          isApplyEnabled={linkUrl !== linkInitialUrl}
          onApply={handleLinkApply}
        />
      </div>
    </div>
  </EditorPopup>
);
```

Notes on JSX:
- `onClickOutside={() => setIsOpen(false)}` — arrow wrapper needed: `setIsOpen` signature is `Dispatch<SetStateAction<boolean>>`, and `onClickOutside` is `() => void`. Passing `setIsOpen` directly would cause the callback to receive no argument, which would pass `undefined` to `setState` — not the intended `false` value. The wrapper `() => setIsOpen(false)` is a valid transformation (CLAUDE.md: adapts a signature mismatch).
- `onMouseDown={(e) => { e.preventDefault(); }}` on the buttons row div — `e.preventDefault()` prevents the editor from losing DOM focus when formatting buttons are clicked, preserving the Lexical selection for formatting commands. NOT applied to the link row div.
- `<span onMouseDown={(e) => { e.preventDefault(); }}>` around `<LinkBtn />` — preserves editor focus for the toggle-off dispatch path. See KAD: LinkBtn mousedown guard. The span adds no visual structure; it is a pure event-boundary element.
- `onChange={setLinkUrl}` — `setLinkUrl` is `React.Dispatch<React.SetStateAction<string>>`. The prop `onChange: (value: string) => void`. Under TypeScript contravariant function type checking (`strict: true`), a function accepting `string | ((prev: string) => string)` is assignable to `(value: string) => void` because `string` is a subtype of `string | fn`. Passing directly is valid and avoids an unnecessary wrapper.
- `isApplyEnabled={linkUrl !== linkInitialUrl}` — inline expression; no extraction needed (no branching, pure value).

**`EditorPopup` `onClickOutside` prop:** Already exists on `EditorPopup` [verified: `src/components/TextEditor/components/EditorPopup/EditorPopup.tsx:13`]. The prop is optional (`onClickOutside?: () => void`) and is now supplied.
