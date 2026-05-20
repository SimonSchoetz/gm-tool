# SF5: Screens

Create the list screen (`FactionsScreen`) and detail screen (`FactionScreen` +
sub-components). Depends on SF4 (`useFactions`, `useFaction` from
`@/data-access-layer`). Consumed by SF6 (barrel registration + route files).

**tsc coupling**: SF5 imports `useFactions` and `useFaction` from `@/data-access-layer`,
which does not export them until SF6's barrel update is applied. Do not run
`tsc --noEmit` on SF5 alone — implement SF6 first and commit both SFs together.

## Files Affected

```
New:
  app/src/screens/factions/FactionsScreen.tsx
  app/src/screens/factions/FactionsScreen.css
  app/src/screens/faction/FactionScreen.tsx
  app/src/screens/faction/FactionScreen.css
  app/src/screens/faction/components/FactionHeader/FactionHeader.tsx
  app/src/screens/faction/components/FactionHeader/FactionHeader.css
  app/src/screens/faction/components/FactionSidebar/FactionSidebar.tsx
  app/src/screens/faction/components/FactionSidebar/FactionSidebar.css
  app/src/screens/faction/components/index.ts
```

## Frontend Layer

Follow `screens/foes/FoesScreen.tsx`, `screens/foe/FoeScreen.tsx`,
`screens/foe/components/FoeHeader/`, and `screens/foe/components/FoeSidebar/`
exactly, substituting `faction`/`Faction`/`factions`/`Factions` for
`foe`/`Foe`/`foes`/`Foes`.

Domain-specific values that differ from the Foe screens:

| Item | Value |
|---|---|
| List route `from` | `'/adventure/$adventureId/factions'` |
| Detail route `from` | `'/adventure/$adventureId/faction/$factionId'` |
| URL param | `factionId` |
| `textEditorId` description | `` `FACTION_${faction.id}_description` `` |
| `textEditorId` summary | `` `FACTION_${faction.id}_summary` `` |
| Search placeholder | `'e.g. "name, leader, some text in description"'` |
| On-create navigate target | `` `/adventure/${adventureId}/faction/${newFactionId}` `` |
| Row-click navigate target | `` `/adventure/${adventureId}/faction/${faction.id}` `` |
| Delete navigate target | `` `/adventure/${adventureId}/factions` `` |
| Delete button label | `'Delete Faction'` |
| CSS class prefix | `faction-` (e.g. `faction-screen`, `faction-text-edit-area`, `faction-summary`, `faction-name-input`, `faction-sidebar`) |
| `tableConfigs.find` | `c.table_name === 'factions'` |
| `tableConfigNotFoundError` arg | `'factions'` |
| Hook | `useFactions(adventureId)`, `useFaction(factionId, adventureId)` |
