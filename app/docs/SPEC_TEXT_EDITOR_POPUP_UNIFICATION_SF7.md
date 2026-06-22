# SF7 — `FloatingToolBar/index.ts` barrel (chore)

Creates the missing module-directory barrel for `FloatingToolBar/` and updates its parent grouping barrel to import from the new barrel path. This is a housekeeping chore detected during spec authoring — no behaviour changes.

## Files Affected

**New:**
- `src/components/TextEditor/components/FloatingToolBar/index.ts`

**Modified:**
- `src/components/TextEditor/components/index.ts`

## Frontend

### Purpose

`FloatingToolBar/` is a module directory (single concern: the floating editor toolbar). CLAUDE.md requires every module directory to expose its public API through an `index.ts` barrel. The barrel is absent [verified: `src/components/TextEditor/components/FloatingToolBar/` — no `index.ts` exists]. `TextEditor/components/index.ts` currently imports via the double-name path `'./FloatingToolBar/FloatingToolbar'` [verified: `src/components/TextEditor/components/index.ts:1`] — the CLAUDE.md anti-pattern for module directories that have a barrel at the grouping level.

### `FloatingToolBar/index.ts` — new file

Single public export — `FloatingToolbar` is the only symbol in this module consumed outside it. `export *` is not used because the file exports more than one symbol at the sub-component level, and internal symbols (sub-components, helpers, config) must not leak from the module barrel.

```typescript
export { FloatingToolbar } from './FloatingToolbar';
```

### `TextEditor/components/index.ts` — update import path

Replace the double-name import path with the barrel path. The barrel file created above makes `'./FloatingToolBar'` valid.

**Before:**
```typescript
export { FloatingToolbar } from './FloatingToolBar/FloatingToolbar';
```

**After:**
```typescript
export { FloatingToolbar } from './FloatingToolBar';
```

The other two exports in `TextEditor/components/index.ts` (`MentionBadge`, `EditorPopup`) are unchanged [verified: `src/components/TextEditor/components/index.ts:2–3`].
