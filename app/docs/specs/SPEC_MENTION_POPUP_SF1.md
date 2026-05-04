# SF1: ClickableIcon Component + StepSectionHeader Migration

Create the shared icon button component, then migrate the two `ActionContainer` usages in `StepSectionHeader` to use it. This must be implemented before SF4 (MentionPopup uses ClickableIcon for its menu bar buttons).

## Files Affected

**New:**

- `app/src/components/ClickableIcon/ClickableIcon.tsx`
- `app/src/components/ClickableIcon/ClickableIcon.css`
- `app/src/components/ClickableIcon/index.ts`

**Modified:**

- `app/src/components/index.ts` — add ClickableIcon named export
- `app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/StepSectionHeader.tsx` — replace two ActionContainer usages with ClickableIcon; remove now-unused imports
- `app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/StepSectionHeader.css` — remove four rule blocks whose styles move to ClickableIcon.css

## Frontend

### ClickableIcon.tsx

**Purpose:** Reusable icon button that wraps `ActionContainer` and adds active and danger visual variants. Replaces inline `ActionContainer` + manual `cn` class composition at every call site.

**Props:** Case 2 (root renders a specific existing component). Do not use `FCProps`.

```ts
type Props = {
  icon: ReactNode;
  isActive?: boolean;
  variant?: 'danger';
} & React.ComponentProps<typeof ActionContainer>;
```

Destructure `icon`, `isActive`, `variant`, and `className` explicitly; spread the remainder to `ActionContainer`:

```tsx
export const ClickableIcon = ({
  icon,
  isActive,
  variant,
  className,
  ...rest
}: Props) => (
  <ActionContainer
    className={cn(
      'clickable-icon',
      isActive && 'clickable-icon--active',
      variant === 'danger' && 'clickable-icon--danger',
      className,
    )}
    {...rest}
  >
    {icon}
  </ActionContainer>
);
```

Import `cn` from `@/util`. Import `ActionContainer` from `../ActionContainer/ActionContainer` (relative from `ClickableIcon/`). Import `ReactNode` from `react`.

---

### ClickableIcon.css

`ActionContainer` already sets `cursor: pointer`, `background-color: transparent`, and `border: none` on `.action-container`. `ClickableIcon.css` adds color and transition only — do not duplicate what `ActionContainer.css` already provides.

```css
.clickable-icon {
  color: var(--color-primary);
  transition: color var(--transition-fast);
}

.clickable-icon:hover {
  color: var(--color-fg);
}

.clickable-icon--active {
  color: var(--color-fg);
}

.clickable-icon--active:hover {
  color: var(--color-fg-hover);
}

.clickable-icon--danger:hover {
  color: var(--color-danger);
}
```

---

### ClickableIcon/index.ts

Module directory barrel. Explicit named export — no `export *`.

```ts
export { ClickableIcon } from './ClickableIcon';
```

---

### components/index.ts

Add one line. Insert after the existing exports (exact position does not matter):

```ts
export { ClickableIcon } from './ClickableIcon';
```

---

### StepSectionHeader.tsx

Replace the two `ActionContainer` usages with `ClickableIcon`. Remove `ActionContainer` from the `@/components` import (it is no longer used). Remove `cn` from the `@/util` import (it was used only for the tooltip button's active class — that logic moves to ClickableIcon's `isActive` prop).

**Tooltip button** (was `ActionContainer` with manual `cn` for active state):

```tsx
{step.default_step_key !== null && (
  <ClickableIcon
    icon={<CircleQuestionMarkIcon />}
    isActive={tooltipVisible}
    onClick={onToggleTooltip}
    title='Show Tooltips'
    label='Show Tooltips'
  />
)}
```

**Delete button** (was `ActionContainer` with `step-delete-btn` class):

```tsx
<ClickableIcon
  icon={<Trash2Icon />}
  variant='danger'
  title='Delete step'
  label='Delete step'
  onClick={() => {
    openDeleteDialog({
      name: `Step: ${stepName}`,
      onDeletionConfirm: () => {
        void deleteStep(step.id);
      },
      oneClickConfirm: true,
    });
  }}
/>
```

The updated import line from `@/components`:

```ts
import { Checkbox, ClickableIcon } from '@/components';
```

The `cn` import from `@/util` is removed entirely — verify no other usage remains in the file before deleting the import.

---

### StepSectionHeader.css

Remove the following four rule blocks in their entirety. The `.step-section-header` layout rule is kept unchanged.

Remove:

```css
.step-tooltip-btn,
.step-delete-btn { ... }

.step-tooltip-btn:hover,
.step-delete-btn:hover { ... }

.step-tooltip-btn__active { ... }

.step-tooltip-btn__active:hover { ... }
```

The file after cleanup contains only:

```css
.step-section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}
```
