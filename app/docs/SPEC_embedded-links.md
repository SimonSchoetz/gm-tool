# Spec: Embedded Links

## Progress Tracker

- SF1: Core link infrastructure — register LinkNode, LinkPlugin, EmbeddedLinkPlugin in TextEditor; add .editor-link CSS class; implement paste and click-popup behaviour in EmbeddedLinkPlugin
- SF2: FloatingToolbar link controls — LinkBtn and LinkInput sub-components; isLinkInputMode state management with blur-guard; wire into FloatingToolbar

## Key Architectural Decisions

### `<LinkPlugin />` receives no `validateUrl`

`<LinkPlugin />` (from `@lexical/react/LexicalLinkPlugin`) is used for two things only: registering `LinkNode` in the editor's node registry, and implementing `TOGGLE_LINK_COMMAND`. Passing `validateUrl` would make it also register a `PASTE_COMMAND` handler. `EmbeddedLinkPlugin` owns all paste handling — two `PASTE_COMMAND` handlers on the same editor require careful priority management. Keeping paste logic in one place avoids the conflict entirely.

### Click model: popover, not direct navigation

Direct click in an editable editor prevents cursor positioning — clicking linked text would always navigate instead of placing the cursor. `EmbeddedLinkPlugin` intercepts `CLICK_COMMAND` on a `LinkNode`, stores `{ url, x, y }` in local state, and renders a portal popup containing the URL (truncated) and an `ExternalLinkIcon` button that calls `openUrl` from `@tauri-apps/plugin-opener`. Clicking outside the popup dismisses it.

### `EmbeddedLinkPlugin` always rendered (both editable and read-only)

`LinkPlugin` must also be always rendered — `LinkNode` must be registered to deserialize stored editor states that contain links. `EmbeddedLinkPlugin`'s `PASTE_COMMAND` handler will never fire in read-only mode (Lexical does not dispatch paste commands to read-only editors), so always rendering it is safe and keeps the click-to-open behaviour available in both modes.

### `isLinkInputModeRef` companion ref for stale-closure-safe blur handling

`FloatingToolbar`'s `handleBlur` is captured inside a `useEffect` with `[editor]` as its only dependency. If it read `isLinkInputMode` state directly, it would capture the initial `false` forever. A `useRef<boolean>` companion (`isLinkInputModeRef`) is kept in sync with the state value by the same setter pair (`enterLinkInputMode` / `exitLinkInputMode`). `handleBlur` reads from the ref — not the state — to always see the current value.

### `LinkBtn` is not config-driven

`textFormatBtns`, `headingBtns`, and `listBtns` in `toolbarConfig.ts` are uniform arrays of `{ label, icon, type }`. `LinkBtn` needs to signal a mode switch in `FloatingToolbar` (`onRequestLinkInput` prop) and has its own active-state detection logic. It cannot be expressed as a config entry and is rendered directly in `FloatingToolbar` after the list-button group.

### `LinkNode` is a framework-provided class

`LinkNode` from `@lexical/link` is a class extending `ElementNode`. Using it as-is satisfies the CLAUDE.md class exception ("Classes are permitted only where a third-party framework API requires inheritance — e.g., Lexical node types"). No custom `LinkNode` subclass is introduced.

---

## SF1: Core link infrastructure

Register `LinkNode`, mount `<LinkPlugin />` and `<EmbeddedLinkPlugin />` in `TextEditor`, apply `.editor-link` styling, and implement all paste and click-popup logic in `EmbeddedLinkPlugin`.

### Files affected

```
Modified:
  src/components/TextEditor/TextEditor.tsx
  src/components/TextEditor/TextEditor.css
  src/components/TextEditor/plugins/index.ts

New:
  src/components/TextEditor/plugins/EmbeddedLinkPlugin.tsx
  src/components/TextEditor/plugins/EmbeddedLinkPlugin.css
```

### Frontend

**`TextEditor.tsx`**

Add these imports alongside the existing ones:

```ts
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LinkNode } from '@lexical/link';
import { EmbeddedLinkPlugin } from './plugins';
```

Add `LinkNode` to the `nodes` array:

```ts
nodes: [HeadingNode, ListNode, ListItemNode, MentionNode, LinkNode],
```

Add `link: 'editor-link'` to the `theme` object (alongside the existing `mention: 'editor-mention'`):

```ts
const theme: EditorThemeClasses = {
  // ...existing keys...
  mention: 'editor-mention',
  link: 'editor-link',
};
```

Inside the `LexicalComposer` JSX, add both plugins unconditionally (not conditioned on `!readOnly`) — insert them directly after `<TabIndentationPlugin />`:

```tsx
<LinkPlugin />
<EmbeddedLinkPlugin />
```

**`TextEditor.css`**

Add after the existing `editor-mention` section (or at the end of the file):

```css
/*
    Link styles
*/

.editor-link {
  text-decoration: underline;
  text-decoration-color: var(--color-primary);
  cursor: pointer;
}

.editor-link:hover {
  text-decoration-color: var(--color-fg);
}
```

**`plugins/EmbeddedLinkPlugin.tsx`** — new file

Purpose: handles URL-paste behaviour (with and without selection) and link-click popup.

Imports:

```ts
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
  $createTextNode,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isRangeSelection,
  mergeRegister,
} from 'lexical';
import { $createLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { openUrl } from '@tauri-apps/plugin-opener';
import { ExternalLinkIcon } from 'lucide-react';
import GlassPanel from '../../GlassPanel/GlassPanel';
import ActionContainer from '../../ActionContainer/ActionContainer';
import './EmbeddedLinkPlugin.css';
```

Local URL validation (inline, not extracted — matches the flat-file plugin pattern):

```ts
const isHttpUrl = (text: string): boolean => {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};
```

State:

```ts
type LinkPopup = { url: string; x: number; y: number };
const [linkPopup, setLinkPopup] = useState<LinkPopup | null>(null);
const popupRef = useRef<HTMLDivElement | null>(null);
```

Register commands in `useEffect` (cleanup via `mergeRegister`):

`PASTE_COMMAND` handler (priority `COMMAND_PRIORITY_LOW`):
- Cast the payload: `const event = payload as ClipboardEvent`
- Extract text: `const text = event.clipboardData?.getData('text/plain') ?? ''`
- If `!isHttpUrl(text)` → return `false` (let default paste proceed)
- Read selection state: `editor.getEditorState().read(() => { ... })` to capture whether a non-collapsed range selection exists into a local boolean `hadSelection`
- If `hadSelection` → `editor.dispatchCommand(TOGGLE_LINK_COMMAND, text)` then return `true`
- If `!hadSelection` → `editor.update(() => { const sel = $getSelection(); if ($isRangeSelection(sel)) { const link = $createLinkNode(text); link.append($createTextNode(text)); sel.insertNodes([link]); } })` then return `true`

`CLICK_COMMAND` handler (priority `COMMAND_PRIORITY_LOW`):
- Let `url: string | null = null`
- `editor.getEditorState().read(() => { const node = $getNearestNodeFromDOMNode(event.target as Node); if (!node) return; const linkNode = $isLinkNode(node) ? node : ($isLinkNode(node.getParent()) ? node.getParent() : null); if (linkNode) url = linkNode.getURL(); })`
- If `url` is non-null → `setLinkPopup({ url, x: event.clientX + window.scrollX, y: event.clientY + window.scrollY })` and return `true`
- Otherwise → return `false`

Dismiss popup on outside click (separate `useEffect`, dependency `[linkPopup]`):

```ts
useEffect(() => {
  if (!linkPopup) return;
  const handleOutsideClick = (e: MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
      setLinkPopup(null);
    }
  };
  document.addEventListener('mousedown', handleOutsideClick);
  return () => document.removeEventListener('mousedown', handleOutsideClick);
}, [linkPopup]);
```

Return value:

```tsx
return linkPopup
  ? createPortal(
      <div
        ref={popupRef}
        className='link-popup-wrapper'
        style={{ top: linkPopup.y, left: linkPopup.x }}
      >
        <GlassPanel className='link-popup'>
          <span className='link-popup-url'>{linkPopup.url}</span>
          <ActionContainer
            label='Open in browser'
            onClick={() => {
              void openUrl(linkPopup.url);
              setLinkPopup(null);
            }}
          >
            <ExternalLinkIcon />
          </ActionContainer>
        </GlassPanel>
      </div>,
      document.body,
    )
  : null;
```

**`plugins/EmbeddedLinkPlugin.css`** — new file

```css
.link-popup-wrapper {
  position: absolute;
  z-index: 1001;
}

.link-popup {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
}

.link-popup-url {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  max-width: 240px; /* flag to user: no dimension token exists for popup max-width */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

Note: `max-width: 240px` is a raw pixel value — no dimension token covers this use case. Flag to the user before shipping; use the inline value in the meantime per the design token fallback rule.

**`plugins/index.ts`** — add export

```ts
export { EmbeddedLinkPlugin } from './EmbeddedLinkPlugin';
```

Barrel uses explicit named exports. Append alongside the existing two exports; do not use `export *`.

---

## SF2: FloatingToolbar link controls

Add `LinkBtn` and `LinkInput` sub-components. Wire `isLinkInputMode` state into `FloatingToolbar` with a ref companion for blur-safe dismissal. Fix the pre-existing zero-props violation in `FloatingToolbar`.

### Files affected

```
New:
  src/components/TextEditor/components/FloatingToolBar/components/LinkBtn/LinkBtn.tsx
  src/components/TextEditor/components/FloatingToolBar/components/LinkBtn/LinkBtn.css
  src/components/TextEditor/components/FloatingToolBar/components/LinkInput/LinkInput.tsx
  src/components/TextEditor/components/FloatingToolBar/components/LinkInput/LinkInput.css

Modified:
  src/components/TextEditor/components/FloatingToolBar/components/index.ts
  src/components/TextEditor/components/FloatingToolBar/FloatingToolbar.tsx
    — pre-existing violation: component typed as ({ ...props }) with no explicit prop type;
      fix: remove the spread params and the {...props} forward on the portal div (no caller
      passes props; FloatingToolbar is a zero-props component)
```

### Frontend

**`LinkBtn/LinkBtn.tsx`** — new file

Follows the `TextFormatBtn` / `HeadingBtn` pattern: subscribe to selection changes to derive `isActive`; use `BaseBtn` for rendering.

```ts
import { FCProps } from '@/types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
  mergeRegister,
} from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { LinkIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { BaseBtn } from '../BaseBtn/BaseBtn';
import './LinkBtn.css';
```

Props:

```ts
type Props = {
  onRequestLinkInput: () => void;
};
```

Active-state detection (inside `useEffect`, read context):

```ts
const handleStateUpdate = useCallback(() => {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
    const nodes = selection.getNodes();
    const hasLink = nodes.some((node) => {
      const parent = node.getParent();
      return $isLinkNode(node) || $isLinkNode(parent);
    });
    setIsActive(hasLink);
  }
}, []);
```

Register listeners with `mergeRegister` (same pattern as `TextFormatBtn`): `registerUpdateListener` + `SELECTION_CHANGE_COMMAND`.

Click handler:

```ts
const handleClick = () => {
  if (isActive) {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  } else {
    onRequestLinkInput();
  }
};
```

Return: `<BaseBtn label='Link' icon={LinkIcon} isActive={isActive} onClick={handleClick} />`

**`LinkBtn/LinkBtn.css`** — new file; empty placeholder (BaseBtn and global styles cover the appearance):

```css
/* LinkBtn uses BaseBtn styles */
```

**`LinkInput/LinkInput.tsx`** — new file

Purpose: replaces the toolbar's button row when `isLinkInputMode` is active. Dispatches `TOGGLE_LINK_COMMAND` with the entered URL on Apply; calls `onClose` in both Apply and Cancel.

```ts
import { FCProps } from '@/types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { CheckIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import ActionContainer from '../../../../../ActionContainer/ActionContainer';
import './LinkInput.css';
```

Props:

```ts
type Props = {
  onClose: () => void;
};
```

State: `const [url, setUrl] = useState('');`

Behaviour:
- `autoFocus` on the input element
- `onKeyDown`: `Enter` → Apply, `Escape` → `onClose()`
- Apply handler: if `url.trim()` is non-empty, `editor.dispatchCommand(TOGGLE_LINK_COMMAND, url.trim())`; then `onClose()`
- `<input>` element: omit `type` attribute (browser default `text` applies); bind `value={url}` and `onChange`

Layout:

```tsx
<div className='link-input'>
  <input
    value={url}
    onChange={(e) => setUrl(e.target.value)}
    placeholder='https://...'
    onKeyDown={(e) => {
      if (e.key === 'Enter') handleApply();
      if (e.key === 'Escape') onClose();
    }}
    autoFocus
  />
  <ActionContainer label='Apply link' onClick={handleApply}>
    <CheckIcon />
  </ActionContainer>
  <ActionContainer label='Cancel' onClick={onClose}>
    <XIcon />
  </ActionContainer>
</div>
```

**`LinkInput/LinkInput.css`** — new file:

```css
.link-input {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
}

.link-input input {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-primary);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  outline: none;
  width: 180px; /* flag to user: no dimension token for input width */
}
```

Note: `1px solid` and `width: 180px` are raw values — flag to user; use inline in the meantime.

**`FloatingToolBar/components/index.ts`** — fix pre-existing violation and add exports

Pre-existing violation: the barrel uses `export *` on all three entries, which is banned in grouping barrels (CLAUDE.md — Barrel Files). Fix by replacing the entire file content with explicit named exports, then add the two new exports:

```ts
export { TextFormatBtn } from './TextFormatBtn/TextFormatBtn';
export { HeadingBtn } from './HeadingBtn/HeadingBtn';
export { ListBtn } from './ListBtn/ListBtn';
export { LinkBtn } from './LinkBtn/LinkBtn';
export { LinkInput } from './LinkInput/LinkInput';
```

**`FloatingToolbar.tsx`** — modifications

Pre-existing violation fix: change `export const FloatingToolbar = ({ ...props }) => {` to `export const FloatingToolbar = () => {`. Remove the `{...props}` spread from the portal `<div>`.

New imports to add:

```ts
import { useRef } from 'react';
import { LinkBtn, LinkInput } from './components';
```

(`useRef` may already be imported — add only if missing.)

New state and ref, inserted directly after the `toolbarRef` declaration:

```ts
const [isLinkInputMode, setIsLinkInputMode] = useState(false);
const isLinkInputModeRef = useRef(false);

const enterLinkInputMode = () => {
  isLinkInputModeRef.current = true;
  setIsLinkInputMode(true);
};

const exitLinkInputMode = () => {
  isLinkInputModeRef.current = false;
  setIsLinkInputMode(false);
};
```

Modify `updateToolbar` — add an early return at the top of the callback body:

```ts
if (isLinkInputModeRef.current) return null;
```

Modify the `handleBlur` closure inside the focus/blur `useEffect` — add a guard at the top:

```ts
const handleBlur = () => {
  if (isLinkInputModeRef.current) return;
  setIsFocused(false);
  setIsVisible(false);
};
```

Modify the portal `<div>` — make `onMouseDown` conditional:

```tsx
onMouseDown={isLinkInputMode ? undefined : (e) => { e.preventDefault(); }}
```

Portal JSX — replace the current button group render with a conditional:

```tsx
{isLinkInputMode ? (
  <LinkInput onClose={exitLinkInputMode} />
) : (
  <>
    {headingBtns.map((btn) => (
      <HeadingBtn key={btn.headingType} label={btn.label} headingType={btn.headingType} icon={btn.icon} />
    ))}
    <Divider />
    {textFormatBtns.map((btn) => (
      <TextFormatBtn key={btn.formatType} label={btn.label} formatType={btn.formatType} icon={btn.icon} />
    ))}
    <Divider />
    {listBtns.map((btn) => (
      <ListBtn key={btn.listType} label={btn.label} listType={btn.listType} icon={btn.icon} />
    ))}
    <Divider />
    <LinkBtn onRequestLinkInput={enterLinkInputMode} />
  </>
)}
```

---

## CLAUDE.md Impact

None. This spec introduces no new structural patterns, layers, or directory conventions beyond what is already documented. No CLAUDE.md file references paths added or removed by this spec.
