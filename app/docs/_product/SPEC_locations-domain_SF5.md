# SF5: Screens

Create the list screen (`LocationsScreen`) and detail screen (`LocationScreen` +
sub-components). Depends on SF4 (`useLocations`, `useLocation` from
`@/data-access-layer`). Consumed by SF6 (barrel registration + route files).

**tsc coupling**: SF5 imports `useLocations` and `useLocation` from `@/data-access-layer`,
which does not export them until SF6's barrel update is applied. Do not run
`tsc --noEmit` on SF5 alone — implement SF6 first and commit both SFs together.

## Files Affected

```
New:
  app/src/screens/locations/LocationsScreen.tsx
  app/src/screens/locations/LocationsScreen.css
  app/src/screens/location/LocationScreen.tsx
  app/src/screens/location/LocationScreen.css
  app/src/screens/location/components/LocationHeader/LocationHeader.tsx
  app/src/screens/location/components/LocationHeader/LocationHeader.css
  app/src/screens/location/components/LocationSidebar/LocationSidebar.tsx
  app/src/screens/location/components/LocationSidebar/LocationSidebar.css
  app/src/screens/location/components/index.ts
```

## Frontend Layer

Follow `screens/foes/FoesScreen.tsx`, `screens/foe/FoeScreen.tsx`,
`screens/foe/components/FoeHeader/`, and `screens/foe/components/FoeSidebar/`
exactly, substituting `location`/`Location`/`locations`/`Locations` for
`foe`/`Foe`/`foes`/`Foes`.

Domain-specific values that differ from the Foe screens:

| Item | Value |
|---|---|
| List route `from` | `'/adventure/$adventureId/locations'` |
| Detail route `from` | `'/adventure/$adventureId/location/$locationId'` |
| URL param | `locationId` |
| `textEditorId` description | `` `LOCATION_${location.id}_description` `` |
| `textEditorId` summary | `` `LOCATION_${location.id}_summary` `` |
| Search placeholder | `'e.g. "name, region, some text in description"'` |
| On-create navigate target | `` `/adventure/${adventureId}/location/${newLocationId}` `` |
| Row-click navigate target | `` `/adventure/${adventureId}/location/${location.id}` `` |
| Delete navigate target | `` `/adventure/${adventureId}/locations` `` |
| Delete button label | `'Delete Location'` |
| CSS class prefix | `location-` (e.g. `location-screen`, `location-text-edit-area`, `location-summary`, `location-name-input`, `location-sidebar`) |
| `tableConfigs.find` | `c.table_name === 'locations'` |
| `tableConfigNotFoundError` arg | `'locations'` |
| Hook | `useLocations(adventureId)`, `useLocation(locationId, adventureId)` |
