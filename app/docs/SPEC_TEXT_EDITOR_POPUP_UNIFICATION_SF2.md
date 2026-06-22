# SF2 — `LinkBtn` simplification

[FOUNDATION: SF4 depends on this — stage SF2+SF3+SF4 as one commit. Stage as unit: `src/components/TextEditor/components/FloatingToolBar/components/LinkBtn/LinkBtn.tsx`, `src/components/TextEditor/components/FloatingToolBar/components/LinkInput/LinkInput.tsx`, `src/components/TextEditor/components/FloatingToolBar/FloatingToolbar.tsx`. Do not run baseline checks after this SF alone — run only after SF3 and SF4 are also complete.]

Removes the Lexical subscription from `LinkBtn` and replaces it with a simple controlled-prop interface. All link-state reading moves to `FloatingToolbar` (SF4).

## Files Affected

**Modified:**
- `src/components/TextEditor/components/FloatingToolBar/components/LinkBtn/LinkBtn.tsx`

## Frontend

### Purpose

`LinkBtn` renders a toggle button for the link row. In the new design, its active state and click handler are fully controlled by `FloatingToolbar` — no Lexical subscription needed.

### Behaviour

Receives `isActive: boolean` and `onClick: () => void` as props. Renders `BaseBtn` with those values. No internal state, no effects, no Lexical context.

### `LinkBtn.tsx`

Full replacement. Imports to remove: `useLexicalComposerContext`, `$getSelection`, `$isRangeSelection`, `COMMAND_PRIORITY_LOW`, `SELECTION_CHANGE_COMMAND`, `mergeRegister` (all of `lexical`), `$isLinkNode`, `TOGGLE_LINK_COMMAND` (all of `@lexical/link`), `useCallback`, `useEffect`, `useState` (all of `react`).

```typescript
import { FCProps } from '@/types';
import { LinkIcon } from 'lucide-react';
import { BaseBtn } from '../BaseBtn/BaseBtn';
import './LinkBtn.css';

type Props = {
  isActive: boolean;
  onClick: () => void;
};

export const LinkBtn: FCProps<Props> = ({ isActive, onClick }) => (
  <BaseBtn label='Link' icon={LinkIcon} isActive={isActive} onClick={onClick} />
);
```

`BaseBtn` props verified: `{ isActive: boolean; onClick: () => void; label: string; icon: LucideIcon }` [verified: `src/components/TextEditor/components/FloatingToolBar/components/BaseBtn/BaseBtn.tsx:8–13`]. All four required props are supplied. No `...props` spread — `LinkBtn` is a closed API (`FCProps<Props>`), not an `HtmlProps` or `ComponentProps` extension.

`LinkBtn.css` — unchanged (comment only; no substantive rules to update).
