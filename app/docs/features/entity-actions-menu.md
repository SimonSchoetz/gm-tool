# Entity actions menu

**Purpose.** The GM duplicates or deletes an entity from a gear button beside its name on its screen, or from the 3-dot menu of its row in a list, so the sidebars hold no action buttons and an entity can be duplicated or deleted without opening it first. The same page records that Escape closes every popup the user opens.

## How it works

On the adventure screen, the NPC, PC, foe, faction, location and item screens, the encounter screen and the session screen in Prep view, a gear sits at the right end of the line that holds the entity's name. Clicking it opens a popup below the gear with its right edge aligned to the gear's, so the gear stays visible, with Duplicate and then Delete as icon and label rows, Delete in the danger color; on the adventure the popup holds Delete only. The popup has no close icon. It closes on a click on the gear, a click outside it, Escape, a window resize and when an action is chosen.

Duplicate creates the copy and opens it with its name field focused. Delete opens the delete confirmation dialog and, once confirmed, deletes the entity and goes to its list screen.

In the Sessions, Encounters, NPCs, PCs, Foes, Factions, Locations and Items lists, each row's 3-dot menu opens to the left of the dots, vertically centered on them, and shows Pin or Unpin, then Duplicate, then Delete in the same icon and label style. Duplicate opens the copy with its name field focused. Delete opens the same confirmation dialog, and once confirmed the user stays on the list, where the row is gone. Choosing an action closes the menu and does not open the row's entity, except Duplicate, which opens the copy. A session row shows all three actions whatever the session's current view. The Adventures list has no row menu.

The sidebars and the area below the encounter queue no longer show Duplicate and Delete; the image upload, Hide defeated and the session tooltips toggle stay where they are.

Escape closes the open popup: the gear popup, the row menu and the other popups the user opens, such as the section menus, the link popup, the table handle menu, the mention popups and the dialogs. While a popup is open, Escape only closes it; Escape's other effects, such as clearing the encounter selection, apply with no popup open.

## Data

Reads the entity's name for the delete dialog's title; the dialog opens without a name when the entity has not loaded yet. Writes: the copy of the entity (its content as each entity's Duplicate defines it) or the deletion of the entity with what it owns.

## Rules

| Rule | Why | Source |
| --- | --- | --- |
| A gear sits on the same line as the entity name input, at the right end of that line, on the adventure, NPC, PC, foe, faction, location, item and encounter screens and on the session screen in Prep view; the name input takes the remaining width; on the session screen the gear sits right of the name input, before the Session Date field | Keeps the name input's width use and a stable gear spot | proposed by Claude, accepted by Simon Schötz, 2026-11-23; hand test |
| The sidebars and the area below the encounter queue show no Duplicate and no Delete; the image upload, Hide defeated and the session tooltips toggle stay where they are | Those are the entity actions; the others are content or view settings | proposed by Claude, accepted by Simon Schötz, 2026-11-23; hand test |
| The gear popup shows its actions as icon and label menu rows, the same as the row menu: Duplicate with a copy icon, then Delete with a trash icon in the danger color; the adventure's popup shows Delete only, since adventures cannot be duplicated | One look for the entity actions in both places | proposed by Claude, accepted by Simon Schötz, 2026-11-23; `ScreensEntityActionsMenu` test, `AdventureActionRows` test, hand test |
| The Adventures list, which shows cover cards, has no 3-dot menu | Only lists that already have a 3-dot menu get the actions; a card menu would grow the scope | proposed by Claude, accepted by Simon Schötz, 2026-11-23; hand test |
| The popup has no X close icon: "It's unnecessary" | A click on the gear, outside or Escape already close it | Simon Schötz, 2026-11-23; `ScreensEntityActionsMenu` test |
| The popup opens below the gear with its right edge aligned to the gear's, so the gear stays visible | The gear is at the right end of its line, so the popup stays inside the window; the user named no placement | Claude's call, 2026-11-23; hand test |
| A list row's 3-dot menu opens to the left of the dots, vertically centered on them | — | Simon Schötz, 2026-11-23; hand test |
| The gear popup closes on a click on the gear, on a click outside it, on Escape and when an action is chosen | Usual menu behaviour; the delete dialog opens on its own | proposed by Claude, accepted by Simon Schötz, 2026-11-23; `ScreensEntityActionsMenu` test, `usePopupDismiss` test |
| The gear popup also closes on a window resize | A fixed position goes stale on resize | proposed by Claude, accepted by Simon Schötz, 2026-11-23; `usePopupDismiss` test |
| No focus moves anywhere after the gear popup closes | — | proposed by Claude, accepted by Simon Schötz, 2026-11-23; no test |
| Duplicate, from the gear or from a row menu, creates the copy and opens it with its name field focused | Same as Duplicate on the screen before the gear | proposed by Claude, accepted by Simon Schötz, 2026-11-23; `EntityActionRows` test, `ScreensEntityActions` test, hand test |
| Delete in the gear popup opens the delete confirmation dialog; confirming deletes the entity and goes to its list screen | — | Simon Schötz, 2026-11-23; `EntityActionRows` test, `ScreensEntityActionsMenu` test, `AdventureActionRows` test |
| Delete in a row's 3-dot menu opens the same confirmation dialog; confirming deletes the entity and the user stays on the list, where the row is gone | — | Simon Schötz, 2026-11-23; `EntityActionRows` test, `ScreensEntityActions` test |
| Delete is always enabled, also before the entity has loaded, and the dialog then opens without the entity's name | "A user won't start to delete stuff without seeing the name. Moreover, they cant be THAT fast" | Simon Schötz, 2026-11-23; `ScreensEntityActions` test |
| On the session screen the gear shows in Prep view only | Nothing gets deleted by accident during play | proposed by Claude, accepted by Simon Schötz, 2026-11-23; hand test |
| In the lists, each row's 3-dot menu shows Pin or Unpin, then Duplicate with a copy icon, then Delete with a trash icon in the danger color, in the existing icon and label row style | Matches the existing menu and marks the destructive action | proposed by Claude, accepted by Simon Schötz, 2026-11-23; `RowActionsMenu` test, hand test |
| A session row's 3-dot menu shows Pin or Unpin, Duplicate and Delete whatever the session's current view | The list is not used during play | proposed by Claude, accepted by Simon Schötz, 2026-11-23; hand test |
| Choosing an action in a row's 3-dot menu closes the menu and does not open the row's entity, except Duplicate, which opens the copy | — | Simon Schötz, 2026-11-23; `RowActionsMenu` test, `ScreensEntityActions` test, hand test |
| Escape closes any popup the user opens, the list row's 3-dot menu and the gear popup included, and only the topmost one when several are open | — | Simon Schötz, 2026-11-23; `useEscapeDismiss` test, `RowActionsMenu` test, `ScreensEntityActionsMenu` test, hand test |
| While a popup is open, Escape only closes it; Escape's other effects, such as clearing the encounter selection, apply only with no popup open | One key press does one thing | proposed by Claude, accepted by Simon Schötz, 2026-11-23; `useEncounterSelection` test, `useEscapeDismiss` test |
| The floating text-formatting toolbar does not close on Escape; the popups Escape closes are the ones the user opens, not the toolbar that follows the text selection | — | Claude's call, 2026-11-23; no test |
| With an editor typeahead list and a click-opened popup open together, one Escape closes both | — | Claude's call, 2026-11-23; no test |
| The Settings Devices pairing dialog closes on Escape; the browser pane cannot pair a device, so only the Tauri app can check it | Web mode cannot open the pairing dialog | proposed by Claude, accepted by Simon Schötz, 2026-11-23; hand test |

## Open points

None.

## Where to look

- The gear and its popup: `ScreensEntityActionsMenu` with `EntityActionsPopup`, `usePopupDismiss` and `getEntityRouteId`; the name line: `ScreensNameRow`.
- The Duplicate and Delete rows, shared by the gear and the row menus: `ScreensEntityActions` with `EntityActionRows` and its per-type rows (`BaseEntityActionRows`, `SessionActionRows`, `EncounterActionRows`, `AdventureActionRows`).
- The row menu: `RowActionsMenu` in `SortableListItem`, fed by `SortableList`'s `renderRowActions`; the danger look: `MenuOptionRow`.
- Escape: `useEscapeDismiss`, used by `AnchoredPopup`, `PopUpContainer`, `useDismissClickOpened` and `usePopupDismiss`; `useEncounterSelection` skips an Escape a popup took.
- Tests: `EntityActionRows`, `ScreensEntityActions`, `ScreensEntityActionsMenu`, `AdventureActionRows`, `usePopupDismiss`, `getEntityRouteId`, `RowActionsMenu`, `useEscapeDismiss`, `useEncounterSelection`.
