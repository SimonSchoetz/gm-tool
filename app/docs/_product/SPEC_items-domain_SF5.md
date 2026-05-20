# SF5: Screens

Create the list screen (`ItemsScreen`) and detail screen (`ItemScreen` +
sub-components). Depends on SF4 (`useItems`, `useItem` from
`@/data-access-layer`). Consumed by SF6 (barrel registration + route files).

**tsc coupling**: SF5 imports `useItems` and `useItem` from `@/data-access-layer`,
which does not export them until SF6's barrel update is applied. Do not run
`tsc --noEmit` on SF5 alone — implement SF6 first and commit both SFs together.

## Files Affected

```
New:
  app/src/screens/items/ItemsScreen.tsx
  app/src/screens/items/ItemsScreen.css
  app/src/screens/item/ItemScreen.tsx
  app/src/screens/item/ItemScreen.css
  app/src/screens/item/components/ItemHeader/ItemHeader.tsx
  app/src/screens/item/components/ItemHeader/ItemHeader.css
  app/src/screens/item/components/ItemSidebar/ItemSidebar.tsx
  app/src/screens/item/components/ItemSidebar/ItemSidebar.css
  app/src/screens/item/components/index.ts
```

## Frontend Layer

Follow `screens/foes/FoesScreen.tsx`, `screens/foe/FoeScreen.tsx`,
`screens/foe/components/FoeHeader/`, and `screens/foe/components/FoeSidebar/`
exactly, substituting `item`/`Item`/`items`/`Items` for
`foe`/`Foe`/`foes`/`Foes`.

Domain-specific values that differ from the Foe screens:

| Item | Value |
|---|---|
| List route `from` | `'/adventure/$adventureId/items'` |
| Detail route `from` | `'/adventure/$adventureId/item/$itemId'` |
| URL param | `itemId` |
| `textEditorId` description | `` `ITEM_${item.id}_description` `` |
| `textEditorId` summary | `` `ITEM_${item.id}_summary` `` |
| Search placeholder | `'e.g. "name, type, some text in description"'` |
| On-create navigate target | `` `/adventure/${adventureId}/item/${newItemId}` `` |
| Row-click navigate target | `` `/adventure/${adventureId}/item/${item.id}` `` |
| Delete navigate target | `` `/adventure/${adventureId}/items` `` |
| Delete button label | `'Delete Item'` |
| CSS class prefix | `item-` (e.g. `item-screen`, `item-text-edit-area`, `item-summary`, `item-name-input`, `item-sidebar`) |
| `tableConfigs.find` | `c.table_name === 'items'` |
| `tableConfigNotFoundError` arg | `'items'` |
| Hook | `useItems(adventureId)`, `useItem(itemId, adventureId)` |
