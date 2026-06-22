# SF3 — `LinkInput` restructure

[FOUNDATION: SF4 depends on this — stage SF2+SF3+SF4 as one commit. Stage as unit: `src/components/TextEditor/components/FloatingToolBar/components/LinkBtn/LinkBtn.tsx`, `src/components/TextEditor/components/FloatingToolBar/components/LinkInput/LinkInput.tsx`, `src/components/TextEditor/components/FloatingToolBar/FloatingToolbar.tsx`. Do not run baseline checks after this SF alone — run only after SF2 and SF4 are also complete.]

Transforms `LinkInput` from a self-contained modal panel into a controlled inline input component. Removes `GlassPanel`, `XIcon`, and internal `url` state. Adds programmatic focus-on-enable via `useEffect`.

## Files Affected

**Modified:**
- `src/components/TextEditor/components/FloatingToolBar/components/LinkInput/LinkInput.tsx`
- `src/components/TextEditor/components/FloatingToolBar/components/LinkInput/LinkInput.css` (violation cleanup — see CSS section)

## Frontend

### Purpose

`LinkInput` renders the URL input field and Apply button for the link row. It is always rendered (never conditionally mounted) and toggles between enabled and disabled via the `disabled` prop.

### Behaviour

- When `disabled` is `true`: the `Input` is non-interactive. The Apply `ClickableIcon` is also disabled.
- When `disabled` transitions from `true` to `false`: the input receives programmatic focus via a `useEffect` watching `disabled`.
- `onChange` is called with the raw string value on every keystroke.
- Pressing Enter calls `onApply`. No Escape handler — the toolbar closes via `EditorPopup.onClickOutside` (see SF4 KAD: handleBlur removed).
- The Apply `ClickableIcon` has `disabled={!isApplyEnabled}`. A disabled HTML button suppresses `onClick`, so `onApply` is not called when the button is disabled.

### `LinkInput.tsx`

Full replacement.

**Imports to remove:** `GlassPanel`, `XIcon` (from `lucide-react`), `TOGGLE_LINK_COMMAND` (from `@lexical/link`), `useLexicalComposerContext`, `useState`.

**Imports to add:** `useEffect`, `useRef` (from `react`).

**Imports to keep:** `FCProps` (from `@/types`), `CheckIcon` (from `lucide-react`), `Input` (from `'../../../../../Input/Input'`), `ClickableIcon` (from `'../../../../../ClickableIcon/ClickableIcon'`).

Path resolution for kept imports (importer: `src/components/TextEditor/components/FloatingToolBar/components/LinkInput/LinkInput.tsx`):
- `../../../../../Input/Input` → `src/components/Input/Input.tsx` ✓
- `../../../../../ClickableIcon/ClickableIcon` → `src/components/ClickableIcon/ClickableIcon.tsx` ✓

```typescript
import { FCProps } from '@/types';
import { CheckIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ClickableIcon } from '../../../../../ClickableIcon/ClickableIcon';
import { Input } from '../../../../../Input/Input';
import './LinkInput.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  isApplyEnabled: boolean;
  onApply: () => void;
};

export const LinkInput: FCProps<Props> = ({
  value,
  onChange,
  disabled,
  isApplyEnabled,
  onApply,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  return (
    <div className='link-input'>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder='https://...'
        onKeyDown={(e) => {
          if (e.key === 'Enter') onApply();
        }}
      />
      <ClickableIcon
        icon={<CheckIcon />}
        onClick={onApply}
        disabled={!isApplyEnabled}
        label='Apply link'
      />
    </div>
  );
};
```

Implementation notes:
- `useRef<HTMLInputElement | null>(null)` — explicit type annotation required for DOM refs initialised with `null` per CLAUDE.md.
- `ref={inputRef}` passed to `Input` — valid in React 19 where `ref` is a regular prop on function components. `Input` is `FCProps<HtmlProps<'input'>>` = `React.FC<Readonly<JSX.IntrinsicElements['input']>>`, and `JSX.IntrinsicElements['input']` includes `ref` in React 19 [project uses React `^19.2.4`, verified: `app/package.json:40`].
- `onChange={(e) => onChange(e.target.value)}` — adapts the `React.ChangeEvent<HTMLInputElement>` signature to the `(value: string) => void` prop signature. This is a signature adaptation (CLAUDE.md permits wrappers for signature mismatch).
- `ClickableIcon` `disabled` prop: `ClickableIcon` extends `React.ComponentProps<typeof ActionContainer>`, and `ActionContainer` is `HtmlProps<'button'>` + `{ label: string }`. `HtmlProps<'button'>` = `JSX.IntrinsicElements['button']` which includes `disabled: boolean` [verified: `src/components/ActionContainer/ActionContainer.tsx:7–8`; `src/components/ClickableIcon/ClickableIcon.tsx:6–10`].
- `onApply` is passed as `onClick` to `ClickableIcon`. Since `disabled={!isApplyEnabled}` suppresses the click event at the HTML button level, no additional guard is needed.

### `LinkInput.css` — violation cleanup

**Violation in current file:** `width: 180px` (raw pixel) and `border-bottom: 1px solid var(--color-primary)` (`1px` is a raw pixel value). Both violate the design token obligation. No `--border-width-1px` or equivalent token exists in `styles/variables/` [verified: `src/styles/variables/border-variables.css` and `spacing-variables.css`].

**Changes:**
- Remove `.link-input input { width: 180px; ... }` block entirely — the input fills remaining row width via `flex: 1` applied in SF6.
- Remove `border-bottom: 1px solid var(--color-primary)` — the inline toolbar context does not need the underline styling of the standalone modal. If a future design decision requires an underline, flag the `1px` token need to the user at that time.
- Remove `background: transparent`, `border: none`, `outline: none` from the `.link-input input` block — these were styled for the `GlassPanel` context which no longer applies.
- The `.link-input` container styles (`display: flex`, `align-items: center`, `gap`, `padding`, `border-radius`) are replaced in SF6.

The full CSS replacement is specified in SF6.
