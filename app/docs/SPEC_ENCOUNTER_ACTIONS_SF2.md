# Sub-feature 2: Selection and the tabbed sidebar

A click on a queue entry selects it and opens an Actions tab in a two-tab right sidebar (Add, Actions); Escape clears the selection. The Actions tab shows only the selected combatant's name and HP here; SF4 adds the amount field and buttons. Governing Key Architectural Decisions: "Selection reconcile", "Both sidebar panels stay mounted", "Component locations", "Escape clears the selection", "The tabs look like browser tabs".

## Files affected

Moved:

- `mv app/src/screens/encounter/components/EncounterAddSidebar/EncounterAddSidebar.tsx app/src/screens/encounter/components/EncounterSidebar/EncounterSidebar.tsx`, then rewrite it (below). The same for `EncounterAddSidebar.css` to `EncounterSidebar.css` and `index.ts`.
- `mv app/src/screens/encounter/components/EncounterAddSidebar/components app/src/screens/encounter/components/EncounterSidebar/components`, with no content change: it carries `EncounterAddTab/` (tsx, css, `index.ts`, its test, three helpers and their tests, `components/EncounterAddRow/` tsx, css and test); the relative imports inside keep their depth.
- `mv app/src/screens/encounter/components/EncounterQueue/components/EncounterQueueEntry/helper/describeQueueEntryHp.ts app/src/screens/encounter/helper/describeQueueEntryHp.ts` and its test under `helper/__tests__/`; `describeQueueEntryImage` stays in `EncounterQueueEntry/helper/describeQueueEntryImage.ts`, its own file, since `EncounterQueueEntry` is its one consumer. The Actions tab becomes the second consumer of `describeQueueEntryHp`, a sibling of the queue, so the file is promoted to the parent module's `helper/`. `EncounterQueueEntry` and the Actions tab import `describeQueueEntryHp` from `../../../../helper/describeQueueEntryHp`, and the Actions tab imports `../../../../hooks/useEncounterQueueEntries` (from either folder, four levels up reach `screens/encounter/`).

Deleted:

- `app/src/screens/encounter/components/EncounterQueue/components/EncounterQueueEntry/index.ts` — the folder holds one main file, its stylesheet and `__tests__/` once `helper/` has left (`app/src/CLAUDE.md` — Barrel Files). Rewrite the importer in `EncounterQueue.tsx` to `./components/EncounterQueueEntry/EncounterQueueEntry`.

Modified:

- `app/src/screens/encounter/EncounterScreen.tsx`, `components/EncounterQueue/EncounterQueue.tsx`, `components/EncounterQueue/components/EncounterQueueEntry/EncounterQueueEntry.tsx` and `.css`.

New:

- `app/src/screens/encounter/hooks/useEncounterSelection.ts` and `hooks/__tests__/useEncounterSelection.test.ts`.
- `app/src/screens/encounter/components/EncounterSidebar/components/EncounterSidebarTabs/EncounterSidebarTabs.tsx` and `.css`.
- `app/src/screens/encounter/components/EncounterSidebar/components/EncounterCombatantActionsTab/EncounterCombatantActionsTab.tsx` and `.css`.
- `app/src/screens/encounter/components/EncounterSidebar/__tests__/EncounterSidebar.test.tsx`.
- `app/src/screens/encounter/components/EncounterQueue/components/EncounterQueueEntry/__tests__/EncounterQueueEntry.test.tsx`.

## Layered breakdown

### Frontend

**`useEncounterSelection(encounterId, shownIds)`** owns selection and the open tab. It exports `type SidebarTab = 'add' | 'actions'`, imported by `EncounterSidebar` and `EncounterSidebarTabs` (the sub-component imports the hook file, never its parent).

```ts
declare const useEncounterSelection: (
  encounterId: string,
  shownIds: string[],
) => {
  selectedId: string | null;
  activeTab: SidebarTab;
  select: (id: string) => void;
  setActiveTab: (tab: SidebarTab) => void;
};
```

State starts as nothing selected, tab `'add'`. The signature is valid under the project toolchain [spec-writer_4: ran `npx tsc --noEmit` and `npx eslint <scratch file>` from `app/` on it as a `declare` in `app/src/screens/encounter/` — tsc reported nothing and eslint reported only `local/no-unused-exports` on the scratch export]. `select(id)` sets both selection and tab `'actions'`. A `document` `keydown` listener (registered in an effect, setting state inside the listener) clears the selection on `Escape` and leaves the tab. Two render-phase resets: when `encounterId` differs from the one last seen, selection becomes `null` and the tab `'add'`; when `selectedId` is not in `shownIds`, selection becomes `null`. Both use the store-the-previous-value pattern of `LabeledToggleButton.tsx`; the project's lint accepts it [spec-writer_1: ran `npx eslint` on a scratch hook with both resets and the listener — only `local/no-unused-exports` reported; control `react-hooks/set-state-in-render` fired on an unconditional `setState`]. Add a named code comment at the second reset: the id is cleared in state, so it stays cleared when the combatant returns (Hide off, a later revert); hiding the selection in the UI would bring it back.

Behaviours (`useEncounterSelection.test.ts`, `renderHook`; Escape through `fireEvent.keyDown(document, …)` in `act`): starts with nothing selected on `'add'` — wrong defaults; `select` selects and switches to `'actions'` — tab not switching; `setActiveTab('add')` keeps the selection — tab change clearing it; Escape clears and keeps the tab, another key does nothing — wrong key or tab closing; a rerender whose `shownIds` lacks the id clears it, and it stays cleared when the id returns — selection resurrecting; a new `encounterId` resets selection and tab — a duplicated encounter opening on Actions.

**`EncounterScreen`**: above the loading early return, call `useEncounterQueueEntries()` and `useEncounterSelection(encounterId, entries.map(…id))`. Pass `selectedId` and `select` (as `onSelect`) to `EncounterQueue`; `activeTab`, `setActiveTab` (as `onTabChange`) and `selectedId` to `EncounterSidebar`.

**`EncounterQueue`** takes `selectedId: string | null` and `onSelect: (id: string) => void`, and passes `selected={entry.id === selectedId}` and `onSelect` to each `EncounterQueueEntry`.

**`EncounterQueueEntry`** gains `selected: boolean` and `onSelect: (id: string) => void`. The root `div` gets `onClick={() => onSelect(id)}`, never the handle `span` (dnd-kit stops a click after a drag and the handle is not a select target [architect_4: `app/node_modules/@dnd-kit/core/dist/core.esm.js:1502-1508`]). Root classes via `cn`: `encounter-queue-entry--selected` sets `box-shadow: var(--box-shadow-active)`; the base class gains `cursor: pointer` and `border-radius: var(--radius-xl)`. Behaviour (`EncounterQueueEntry.test.tsx`, click on the name text, no provider needed [spec-writer_3: `.claude/knowledge/dnd-kit.md`]): a click reports the entry's id once — a handler bound to the wrong id.

**`EncounterSidebar`** (props `activeTab`, `onTabChange`, `selectedId`): the `GlassPanel` (class `encounter-sidebar`) keeps the old column layout and `padding: var(--spacing-sm)` and loses its `gap`: the tab strip and the panel below it touch, which the joined look needs. The "Add" heading and its class are removed. It renders `EncounterSidebarTabs` and two sibling panels, both always mounted: `div` `role='tabpanel'` `aria-label` `'Add'` holding `EncounterAddTab`, and `'Actions'` holding `EncounterCombatantActionsTab`; the panel not matching `activeTab` carries `hidden`. The tab list is a module constant of two `{ id, label }` entries. Panel class `encounter-sidebar-panel` is the tab body: `flex: 1; min-height: 0; display: flex; flex-direction: column; gap: var(--spacing-sm); padding: var(--spacing-sm); background-color: var(--color-surface); border: var(--border-thin) solid var(--color-border); border-radius: var(--radius-lg)`, plus `.encounter-sidebar-panel[hidden] { display: none; }`. Add a named code comment on that rule: the class's `display` overrides the `hidden` attribute's default [spec-writer_5: `.claude/knowledge/html.md`], so without it the inactive panel stays visible. Mounting both keeps the Add tab's search text when the GM clicks a combatant.

Behaviours (`EncounterSidebar.test.tsx`; mocks: the set `EncounterAddTab.test.tsx` uses plus `@services/encounterService`, `@services/encounterLogEntryService`): clicking a tab reports its id — wrong id wired; only the active tab's panel is found by role, the other is hidden — both visible; the Add search text survives Actions and back — an inactive panel unmounted.

**`EncounterSidebarTabs`** (props `tabs: { id: SidebarTab; label: string }[]`, `activeTab`, `onChange`; no `index.ts`)

- **Purpose** — the strip of two tabs above the sidebar panels that looks like browser tabs: the active tab joins the panel body below it, the inactive one sits behind it.
- **Behavior** — a `div` `role='tablist'` of one `ActionContainer` per tab (`@/components/ActionContainer/ActionContainer`) with `label`, `role='tab'`, `aria-selected={id === activeTab}`, `onClick={() => onChange(id)}` and the label as its child, so the accessible name is the label; `ActionContainer` spreads the other props onto its `button` [spec-writer_12: `app/src/components/ActionContainer/ActionContainer.tsx:10-26`]. The tab is not a `Button`: its `GlassPanel` wrapper brings a rounded glass box, which cannot join a panel.
- **UI / Visual** — tokens only, no raw value. The strip: `position: relative; display: flex; gap: var(--spacing-xs); padding: 0 var(--spacing-sm); margin-bottom: calc(-1 * var(--border-thin))`; the negative margin and `position: relative` put the strip over the panel's top border, so the active tab's bottom edge covers that line. Class `encounter-sidebar-tabs-tab` (inactive, sits behind): `margin-top: var(--spacing-xs)` (shorter than the active tab), `padding: var(--spacing-xs) var(--spacing-md)`, `border: var(--border-thin) solid var(--color-border-muted)` with `border-bottom-color: var(--color-border)` (the panel's top line continues under it), `border-radius: var(--radius-md) var(--radius-md) 0 0`, `background-color: var(--color-bg-muted)`, `color: var(--color-fg-muted)`; its `:hover` gives `color: var(--color-fg)`. Modifier `encounter-sidebar-tabs-tab--active` (added via `cn` on the active tab): `margin-top: 0`, `background-color: var(--color-surface)` (the panel's background), `border-color: var(--color-border)` with `border-bottom-color: var(--color-surface)`, `color: var(--color-fg)`.
- **Rationale (KAD "The tabs look like browser tabs")** — `.action-container` sets `border: none` and `background-color: transparent` with one class of specificity, and `.action-container:hover` sets `border: none` and `box-shadow: none` with two [spec-writer_12: `app/src/components/ActionContainer/ActionContainer.css:1-15`]. A tie is decided by source order, so the sub-component imports its `.css` after `ActionContainer`; the `border` declarations of the inactive and the `--active` rule are each written for `.x, .x:hover` (the `--active` pair after the inactive one) so a hovered tab keeps its border. Add a named code comment at the import and one at the `:hover` selectors saying so: without them an edit that drops either lets a hovered tab lose its border and jump.

[MANUAL-VERIFY] The active tab shows no line between itself and the panel below and the inactive tab sits behind it, with its panel-top line continuing under it; hovering either tab keeps its border (layout the test environment does not compute).

**`EncounterCombatantActionsTab`** (prop `selectedId`; no `index.ts` yet)

- **Purpose** — the place where the selected combatant is acted on; SF4 completes it.
- **Behavior** — finds the entry in `useEncounterQueueEntries().entries` by `selectedId` (`?? null`). No entry: the line `Select a combatant in the queue.` With one: a row with the shown name and `describeQueueEntryHp(entry).text`, or `HP is not set. Set max HP to track it.` when that is `null`.
- **UI / Visual** — column, `gap: var(--spacing-sm)`; row flex with the text block `flex: 1; min-width: 0`, HP in `var(--color-fg-muted)` at `var(--font-size-md)` as the queue entry shows it.

[MANUAL-VERIFY] In the browser pane (`pnpm run web`): clicking an entry highlights it and opens Actions, clicking another moves the highlight, Escape removes it.
[MANUAL-VERIFY] Clicking and dragging the handle selects nothing.
[MANUAL-VERIFY] The inactive panel is invisible and the Add list scrolls inside the sidebar panel.
