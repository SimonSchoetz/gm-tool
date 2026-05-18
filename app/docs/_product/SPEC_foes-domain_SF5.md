# SF5: Screens

Create the list screen (`FoesScreen`) and detail screen (`FoeScreen` + sub-components).
Depends on SF4 (`useFoes`, `useFoe` from `@/data-access-layer`). Consumed by SF6
(barrel registration + route files).

## Files Affected

```
New:
  app/src/screens/foes/FoesScreen.tsx
  app/src/screens/foes/FoesScreen.css
  app/src/screens/foe/FoeScreen.tsx
  app/src/screens/foe/FoeScreen.css
  app/src/screens/foe/components/FoeHeader/FoeHeader.tsx
  app/src/screens/foe/components/FoeHeader/FoeHeader.css
  app/src/screens/foe/components/FoeSidebar/FoeSidebar.tsx
  app/src/screens/foe/components/FoeSidebar/FoeSidebar.css
  app/src/screens/foe/components/index.ts
```

## Frontend Layer

### List Screen

#### `app/src/screens/foes/FoesScreen.tsx`

**Purpose**: Displays all foes for an adventure in a sortable, searchable table. Creates
new foes and navigates to the detail screen on row click.

**Behavior**: Reads `adventureId` via `useParams({ from: '/adventure/$adventureId/foes' })`.
Fetches via `useFoes(adventureId)` and `useTableConfigs()`. Finds config by
`c.table_name === 'foes'`. On create: `await createFoe()` → navigate to
`` `/adventure/${adventureId}/foe/${newFoeId}` ``. Loading or missing config: return
`<div className='content-center'>Loading...</div>`.

**UI**: `SortableList<Foe>` with `tableConfigId={foesTableConfig.id}`, `items={foes}`,
`onRowClick` navigates to `` `/adventure/${adventureId}/foe/${foe.id}` ``,
`onCreateNew` calls `handleFoeCreation`,
`searchPlaceholder='e.g. "name, type, some text in description"'`.

```tsx
import { useParams, useRouter } from '@tanstack/react-router';
import { useFoes, useTableConfigs } from '@/data-access-layer';
import { SortableList } from '@/components';
import type { Foe } from '@db/foe';
import './FoesScreen.css';

export const FoesScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/foes',
  });

  const { foes, loading: foesLoading, createFoe } = useFoes(adventureId);
  const { tableConfigs, loading: configsLoading } = useTableConfigs();

  const foesTableConfig = tableConfigs.find((c) => c.table_name === 'foes');

  const handleFoeCreation = async () => {
    const newFoeId = await createFoe();
    void router.navigate({ to: `/adventure/${adventureId}/foe/${newFoeId}` });
  };

  if (foesLoading || configsLoading || !foesTableConfig) {
    return <div className='content-center'>Loading...</div>;
  }

  return (
    <SortableList<Foe>
      tableConfigId={foesTableConfig.id}
      items={foes}
      onRowClick={(foe) => {
        void router.navigate({ to: `/adventure/${adventureId}/foe/${foe.id}` });
      }}
      onCreateNew={() => {
        void handleFoeCreation();
      }}
      searchPlaceholder='e.g. "name, type, some text in description"'
    />
  );
};
```

#### `app/src/screens/foes/FoesScreen.css`

Empty file — no domain-specific list layout needed.

---

### Detail Screen

#### `app/src/screens/foe/FoeScreen.tsx`

**Purpose**: Main detail view for a single foe. Sidebar on the left, scrollable content
area with header and description editor on the right.

**Behavior**: Reads `foeId` and `adventureId` via
`useParams({ from: '/adventure/$adventureId/foe/$foeId' })`. Calls `useFoe(foeId, adventureId)`.
Guards: `if (loading || !foe) return <div>Loading...</div>`. Description `TextEditor` calls
`updateFoe({ description })` on change. `textEditorId`: `` `FOE_${foe.id}_description` ``.

**UI**: Root `GlassPanel className='foe-screen'` — CSS grid `grid-template-columns: auto 1fr`,
`padding: var(--spacing-md)`, `gap: var(--spacing-lg)`. Left: `<FoeSidebar />`.
Right: `<CustomScrollArea>` wrapping `<div className='foe-text-edit-area'>` (grid
`grid-template-rows: auto 1fr`, `height: 100%`, `gap: var(--spacing-md)`) containing
`<FoeHeader />` then `<TextEditor ... />`.

```tsx
import { CustomScrollArea, GlassPanel, TextEditor } from '@/components';
import { cn } from '@/util';
import { useFoe } from '@/data-access-layer';
import './FoeScreen.css';
import { useParams } from '@tanstack/react-router';
import { FoeHeader, FoeSidebar } from './components';

export const FoeScreen = () => {
  const { adventureId, foeId } = useParams({
    from: '/adventure/$adventureId/foe/$foeId',
  });

  const { foe, updateFoe, loading } = useFoe(foeId, adventureId);

  if (loading || !foe) {
    return <div>Loading...</div>;
  }

  return (
    <GlassPanel className={cn('foe-screen')}>
      <FoeSidebar />

      <CustomScrollArea>
        <div className={cn('foe-text-edit-area')}>
          <FoeHeader />

          <TextEditor
            value={foe.description ?? ''}
            textEditorId={`FOE_${foe.id}_description`}
            onChange={(description) => {
              updateFoe({ description });
            }}
          />
        </div>
      </CustomScrollArea>
    </GlassPanel>
  );
};
```

#### `app/src/screens/foe/FoeScreen.css`

```css
.foe-screen {
  padding: var(--spacing-md);
  display: grid;
  gap: var(--spacing-lg);
  grid-template-columns: auto 1fr;
}

.foe-text-edit-area {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  gap: var(--spacing-md);
}
```

---

#### `app/src/screens/foe/components/FoeHeader/FoeHeader.tsx`

**Purpose**: Name input and summary rich-text editor rendered inside a styled glass panel.

**Behavior**: Reads params via `useParams({ from: '/adventure/$adventureId/foe/$foeId' })`.
Calls `useFoe(foeId, adventureId)`. Controlled name input: `useState(foe?.name ?? '')`.
`onChange` calls `setFoeName` and `updateFoe({ name: e.target.value })`.
Summary `textEditorId`: `` `FOE_${foe.id}_summary` ``. Returns `undefined` guard if no foe.

**UI**: `GlassPanel className='foe-summary' intensity='bright'` — grid rows `auto 1fr`,
`padding: var(--spacing-md)`, `gap: var(--spacing-sm)`, `height: var(--summary-content-height)`,
`max-width: 600px`. `Input placeholder='Name'` with `className='foe-name-input'`
(`font-size: var(--font-size-3xl)`, `font-weight: var(--font-weight-medium)`).
`CustomScrollArea` wrapping summary `TextEditor`.

```tsx
import { GlassPanel, Input, CustomScrollArea, TextEditor } from '@/components';
import { useFoe } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
import './FoeHeader.css';

export const FoeHeader = () => {
  const { adventureId, foeId } = useParams({
    from: '/adventure/$adventureId/foe/$foeId',
  });

  const { foe, updateFoe } = useFoe(foeId, adventureId);

  const [foeName, setFoeName] = useState(foe?.name ?? '');

  if (!foe) return;

  return (
    <GlassPanel className='foe-summary' intensity='bright'>
      <Input
        placeholder='Name'
        value={foeName}
        onChange={(e) => {
          setFoeName(e.target.value);
          updateFoe({ name: e.target.value });
        }}
        className='foe-name-input'
        required
      />

      <CustomScrollArea>
        <TextEditor
          placeholder='Summary'
          value={foe.summary ?? ''}
          textEditorId={`FOE_${foe.id}_summary`}
          onChange={(summary) => {
            updateFoe({ summary });
          }}
        />
      </CustomScrollArea>
    </GlassPanel>
  );
};
```

#### `app/src/screens/foe/components/FoeHeader/FoeHeader.css`

```css
.foe-summary {
  display: grid;
  gap: var(--spacing-sm);
  grid-template-rows: auto 1fr;
  padding: var(--spacing-md);
  height: var(--summary-content-height);
  max-width: 600px;
}

.foe-name-input {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-medium);
}
```

---

#### `app/src/screens/foe/components/FoeSidebar/FoeSidebar.tsx`

**Purpose**: Image upload and foe deletion controls rendered in a sidebar aside element.

**Behavior**: Reads params via `useParams({ from: '/adventure/$adventureId/foe/$foeId' })`.
Calls `useFoe(foeId, adventureId)`, `useDeleteDialog()`, `useRouter()`. Returns `undefined`
guard if no foe. On delete: `await deleteFoe()` then
`router.navigate({ to: \`/adventure/${adventureId}/foes\` })`.
`uploadFn` passes `{ imgFilePath: filePath, image_id: foe.image_id }` to `updateFoe`.
`deleteFn`: `if (foe.image_id) void removeFoeImage()`.
Imports `PREVIEW_WIDTH` and `PREVIEW_HEIGHT` from `'@/screens/screens.constants'`.

**UI**: `<aside className='foe-sidebar'>` (flex column, `gap: var(--spacing-md)`).
`UploadImgBtn` with `dimensions={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}`,
`image_id={foe.image_id ?? null}`, `title={foe.name ?? ''}`, `uploadFn`, `deleteFn`.
Danger `Button label='Delete Foe'` that opens `openDeleteDialog` with `name: foe.name ?? ''`,
`onDeletionConfirm`, `oneClickConfirm: false`.

```tsx
import { UploadImgBtn, Button } from '@/components';
import { useFoe } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers';
import { PREVIEW_HEIGHT, PREVIEW_WIDTH } from '@/screens/screens.constants';
import { useRouter, useParams } from '@tanstack/react-router';
import './FoeSidebar.css';

export const FoeSidebar = () => {
  const router = useRouter();
  const { adventureId, foeId } = useParams({
    from: '/adventure/$adventureId/foe/$foeId',
  });
  const { foe, updateFoe, deleteFoe, removeFoeImage } = useFoe(foeId, adventureId);
  const { openDeleteDialog } = useDeleteDialog();

  if (!foe) return;

  const handleFoeDelete = async () => {
    await deleteFoe();
    void router.navigate({ to: `/adventure/${adventureId}/foes` });
  };

  return (
    <aside className='foe-sidebar'>
      <UploadImgBtn
        dimensions={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
        image_id={foe.image_id ?? null}
        title={foe.name ?? ''}
        uploadFn={(filePath) => {
          updateFoe({ imgFilePath: filePath, image_id: foe.image_id });
        }}
        deleteFn={() => {
          if (foe.image_id) void removeFoeImage();
        }}
      />

      <Button
        label='Delete Foe'
        onClick={() => {
          openDeleteDialog({
            name: foe.name ?? '',
            onDeletionConfirm: () => {
              void handleFoeDelete();
            },
            oneClickConfirm: false,
          });
        }}
        buttonStyle={'danger'}
      />
    </aside>
  );
};
```

#### `app/src/screens/foe/components/FoeSidebar/FoeSidebar.css`

```css
.foe-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
```

---

#### `app/src/screens/foe/components/index.ts`

```ts
export { FoeSidebar } from './FoeSidebar/FoeSidebar';
export { FoeHeader } from './FoeHeader/FoeHeader';
```
