# SF5: Screens

Create the list screen (`PcsScreen`) and detail screen (`PcScreen` + sub-components).
Depends on SF4 (`usePcs`, `usePc` from `@/data-access-layer`). Consumed by SF6
(barrel registration + route files).

**tsc coupling**: SF5 imports `usePcs` and `usePc` from `@/data-access-layer`, which
does not export them until SF6's barrel update is applied. Do not run `tsc --noEmit`
on SF5 alone — implement SF6 first and commit both SFs together.

## Files Affected

```
New:
  app/src/screens/pcs/PcsScreen.tsx
  app/src/screens/pcs/PcsScreen.css
  app/src/screens/pc/PcScreen.tsx
  app/src/screens/pc/PcScreen.css
  app/src/screens/pc/components/PcHeader/PcHeader.tsx
  app/src/screens/pc/components/PcHeader/PcHeader.css
  app/src/screens/pc/components/PcSidebar/PcSidebar.tsx
  app/src/screens/pc/components/PcSidebar/PcSidebar.css
  app/src/screens/pc/components/index.ts
```

## Frontend Layer

Follow `screens/foes/FoesScreen.tsx`, `screens/foe/FoeScreen.tsx`,
`screens/foe/components/FoeHeader/`, and `screens/foe/components/FoeSidebar/`
exactly, substituting `pc`/`Pc`/`pcs`/`Pcs` for `foe`/`Foe`/`foes`/`Foes`.

Domain-specific values that differ from the Foe screens:

| Item | Value |
|---|---|
| List route `from` | `'/adventure/$adventureId/pcs'` |
| Detail route `from` | `'/adventure/$adventureId/pc/$pcId'` |
| URL param | `pcId` (not `foeId`) |
| `textEditorId` description | `` `PC_${pc.id}_description` `` |
| `textEditorId` summary | `` `PC_${pc.id}_summary` `` |
| Search placeholder | `'e.g. "name, faction, some text in description"'` |
| On-create navigate target | `` `/adventure/${adventureId}/pc/${newPcId}` `` |
| Row-click navigate target | `` `/adventure/${adventureId}/pc/${pc.id}` `` |
| Delete navigate target | `` `/adventure/${adventureId}/pcs` `` |
| Delete button label | `'Delete PC'` |
| CSS class prefix | `pc-` (e.g. `pc-screen`, `pc-text-edit-area`, `pc-summary`, `pc-name-input`, `pc-sidebar`) |
| `tableConfigs.find` | `c.table_name === 'pcs'` |
| `tableConfigNotFoundError` arg | `'pcs'` |
| Hook | `usePcs(adventureId)`, `usePc(pcId, adventureId)` |
