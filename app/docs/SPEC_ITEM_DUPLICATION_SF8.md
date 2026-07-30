# SF8 — Sidebar wiring and focus-on-arrival

Places `ScreensDuplicateBtn` in all eight item screen sidebars and focuses the name input when a screen is reached by duplication.

## Files affected

**Modified — sidebars:**

- `app/src/screens/npc/components/NpcSidebar/NpcSidebar.tsx`
- `app/src/screens/pc/components/PcSidebar/PcSidebar.tsx`
- `app/src/screens/foe/components/FoeSidebar/FoeSidebar.tsx`
- `app/src/screens/faction/components/FactionSidebar/FactionSidebar.tsx`
- `app/src/screens/location/components/LocationSidebar/LocationSidebar.tsx`
- `app/src/screens/item/components/ItemSidebar/ItemSidebar.tsx`
- `app/src/screens/adventure/components/AdventureScreenSidebar/AdventureScreenSidebar.tsx`
- `app/src/screens/session/components/StepsNavSidebar/StepsNavSidebar.tsx`

**Modified — name inputs:**

- `app/src/screens/npc/NpcScreen.tsx`
- `app/src/screens/pc/PcScreen.tsx`
- `app/src/screens/foe/FoeScreen.tsx`
- `app/src/screens/faction/FactionScreen.tsx`
- `app/src/screens/location/LocationScreen.tsx`
- `app/src/screens/item/ItemScreen.tsx`
- `app/src/screens/session/components/SessionHeader.tsx`
- `app/src/screens/session/components/SessionHeader.css` — cleanup, see below

## Frontend layer

### Sidebars

**Purpose** — Each sidebar gains the duplicate control directly above its existing delete control.

**Behavior** — Import `ScreensDuplicateBtn` from `'../../../components'`. That specifier resolves to `src/screens/components/` from all eight files, which sit at a uniform depth of `screens/<domain>/components/<Name>Sidebar/`. It is not a barrel these files belong to, so the sibling-import restriction in `app/src/CLAUDE.md` does not apply.

Render `<ScreensDuplicateBtn entityType='<plural>' />` immediately before the existing delete control:

| Sidebar | `entityType` | Insert directly above |
| --- | --- | --- |
| `NpcSidebar` | `'npcs'` | the `<Button label='Delete NPC' … />` |
| `PcSidebar` | `'pcs'` | the `<Button label='Delete PC' … />` |
| `FoeSidebar` | `'foes'` | the `<Button label='Delete Foe' … />` |
| `FactionSidebar` | `'factions'` | the `<Button label='Delete Faction' … />` |
| `LocationSidebar` | `'locations'` | the `<Button label='Delete Location' … />` |
| `ItemSidebar` | `'items'` | the `<Button label='Delete Item' … />` |
| `AdventureScreenSidebar` | `'adventures'` | the `<Button label='Delete Adventure' … />` |
| `StepsNavSidebar` | `'sessions'` | the `<DeleteSessionBtn />` |

Read each sidebar's delete control before inserting — the six leaf sidebars render an inline `Button`, `AdventureScreenSidebar` renders one too, and `StepsNavSidebar` renders a dedicated `DeleteSessionBtn` component instead.

`AdventureScreenSidebar` gets the component even though it renders nothing there. This is intentional and follows the "Duplicability is declared by a switch, not by a list" decision in the root spec: the omission lives in one switch case rather than in this file.

Insert after the existing `UploadImgBtn` where one is present, so the order is image, duplicate, delete. `StepsNavSidebar` has no `UploadImgBtn`; there the control goes between the conditional tooltips-toggle `Button` and `<DeleteSessionBtn />`.

No sidebar gains state, a hook call, or a handler — the leaf owns the action.

**UI / Visual** — One additional full-width button in the existing sidebar flow, taking `Button`'s default treatment. No stylesheet changes in any sidebar.

### Name inputs

**Purpose** — A duplicate arrives with an empty name; focusing that input is what tells the user the duplication happened and puts them straight into naming it.

**Behavior** — In each of the seven files, read the navigation flag and pass it to the name input:

```ts
const focusNameInput = useRouterState({
  select: (state) => state.location.state.focusNameInput ?? false,
});
```

`useRouterState` is imported from `@tanstack/react-router`. Pass the result as `autoFocus={focusNameInput}`.

The prop reaches the DOM: `ScreensNameInput` spreads its props into `SyncedInput`, whose props `Omit` only `value`, `onChange`, `onFocus`, `onBlur`, and `defaultValue`; `SyncedInput` spreads into `Input`, which spreads into `<input>`. `autoFocus` survives the whole chain.

Six screens pass it to `ScreensNameInput`. `SessionHeader.tsx` passes it to the `SyncedInput` it renders directly — the session screen has no `ScreensNameInput`.

`autoFocus` acts on mount only. Each screen mounts fresh on navigation, and the six leaf screens gate on `loading || !entity` before rendering the input, so the input mounts once data has arrived — still a mount, so the focus fires. Because it acts only on mount, the flag remaining set on the history entry causes no repeat focusing.

**UI / Visual** — No layout or style change. The only visible difference is the caret sitting in an empty name field on arrival.

`[MANUAL-VERIFY]` Duplicate an NPC and a Session and confirm the name field is empty and focused on arrival, then navigate to an existing NPC directly and confirm its name field is **not** focused. Focus-on-mount depends on the browser's native focus handling, which no helper or data-layer test exercises, and `app/src/CLAUDE.md`'s Testing Policy forbids component tests.

## Cleanup

`SessionHeader.tsx` applies two class names using the BEM element suffix: `session-date__label` and `session-date__input`. `app/src/CLAUDE.md` bans it outright: "Never use the BEM element suffix (`__`). There are no `block__element` class names in this codebase." Rename both to the flat form, `session-date-label` and `session-date-input`.

`SessionHeader.css` declares a rule for `.session-date__label` only — rename that selector to match. There is no `.session-date__input` rule; that class name is applied in the `.tsx` with no corresponding style. Rename the class name in the `.tsx` and do not add a rule for it.

This cleanup is required, not optional: the file is modified by this sub-feature, and `app/CLAUDE.md` requires fixing every violation found in a file being touched, in the same pass.

## Tests

None. Every file in this sub-feature exports a function returning JSX, which `app/src/CLAUDE.md`'s Testing Policy exempts. The residual interaction risk is covered by the `[MANUAL-VERIFY]` note above.
