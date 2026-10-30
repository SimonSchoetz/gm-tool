# Sub-feature 7: Entity view

The shown combatant's view gains its entity's editable content section panel and description editor, below the notes. An edit there changes the entity itself, because both pieces write through the entity's own hooks and cache keys. The panel is `ScreensBaseEntityContentSectionPanel` from sub-feature 3; the queue entry's `entity` field is from sub-feature 5.

## Files affected

New:

- `app/src/screens/encounter/components/EncounterShownCombatant/components/EncounterCombatantEntityView/EncounterCombatantEntityView.tsx` and `index.ts`
- `…/EncounterCombatantEntityView/components/EncounterCombatantEntityDescription/EncounterCombatantEntityDescription.tsx`

Modified:

- `app/src/screens/encounter/components/EncounterShownCombatant/EncounterShownCombatant.tsx` — render `EncounterCombatantEntityView` after `EncounterCombatantNotes`, keyed by the queue item id, imported by `./components/EncounterCombatantEntityView` (its `index.ts`).

`index.ts` exports `EncounterCombatantEntityView` as one explicit named export; the folder has one because it holds `components/`.

## Frontend

`EncounterCombatantEntityView` — Purpose: the shown combatant's entity, editable as on the entity's screen. Props: `{ shownItemId: string }`. Behavior: it reads `useEncounterQueueEntry(shownItemId)` and renders nothing when the entry is null or its `entity` is null, which covers a combatant whose entity was deleted. Otherwise it renders, as sibling fragment children, `ScreensBaseEntityContentSectionPanel` with `baseEntityId={entity.id}`, then `EncounterCombatantEntityDescription` (imported by `./components/EncounterCombatantEntityDescription/EncounterCombatantEntityDescription`, a single-file module with no `index.ts`) with `entityType` and `entityId` from the entry's `entity`. Neither child carries a `key`: the parent keys this view by the queue item id and a queue item's entity is only ever emptied, never replaced by another (decision: "The entity view exists only while the entity is in the adventure's base entity lists, and the queue entry decides it" in the root Key Architectural Decisions), so the view remounts whenever another combatant is shown, and when the entity is removed `entity` is null and both children unmount. The import of the panel is relative, `../../../../../components/ScreensBaseEntityContentSectionPanel`, because both files lie below `src/screens/` (`app/src/CLAUDE.md` — Barrel Files). Adding, renaming, deleting and stepping through sections, editing a section's body, and editing the description work exactly as on the entity's screen, since the panel and the description write through the entity's own hooks.

`EncounterCombatantEntityDescription` — Purpose: the entity's description editor. Props: `{ entityType: BaseEntityType; entityId: string }` (a separate component because of the decision "The entity view's description editor is its own component" in the root Key Architectural Decisions). Behavior: it reads `adventureId` with `useParams` (route `/adventure/$adventureId/encounter/$encounterId`), calls `useBaseEntity(entityType, entityId, adventureId)`, renders nothing while `baseEntity` is null, and otherwise a `TextEditor` with `value` the entity's `description ?? ''`, `onChange` calling `updateBaseEntity({ description })`, and `textEditorId` `ENCOUNTER_SHOWN_ENTITY_${baseEntity.id}_description`. It does not repeat the entity screen's id template: the id only has to be unique per mounted field, and the entity screen and this view never mount together. The description editor is not shared with the entity screen's: that screen's is a short element fed by its own `useBaseEntity` instance, which also saves the name, so a shared component would add a second hook instance and autosave queue there.

UI / Visual: no stylesheet of its own. The panel keeps its own `width: fit-content`; the description sits in the shell's block layout with the shell's spacing between children. `ContentSectionBody` keeps its existing `max-height` and `overflow-y: auto` [spec-writer_18: `app/src/components/ContentSectionBody/ContentSectionBody.css:1-6` — as of 1cbf2b90], so a long section scrolls inside the panel body at that height, while the notes and the description grow with their text; the user decided that the panel shows unchanged, as on the entity screen (row 22). Stylesheet reach: the description editor leaves the entity screen's `.screens-text-editor-layout--body-scroll` (its own scroller) for the shell's single scroll container; no other element's appearance changes.

## Tests — behaviours and the defect each catches

None. Both components are React components whose behaviour is decided by render-time conditions and the `TextEditor` runtime, which the testing policy exempts; a test cannot assert what a user typing into `TextEditor` saves under jsdom (`.claude/knowledge/lexical.md`, the entry beginning "Typing into `TextEditor` with user-event under jsdom"). The condition that selects the view, `entity`, is pinned in sub-feature 5 (`buildQueueEntries.test.ts`).

## Verification steps

After the check rows pass, there is no production source with a test file in this sub-feature, so no mutation run is needed.

[MANUAL-VERIFY] In web mode, click a Goblin combatant: below its notes the middle column shows the Goblin's content section panel with the entity's first section and, under it, the description editor. Use the panel's add control to add a Text section, rename it "Tactics", type text in its body, step to the previous section with the up button, and type "Cunning" in the description. Open the Goblin's own screen: it shows the "Tactics" section with that text and the description "Cunning". Open another encounter that holds a Goblin and click it: the same section and description show.

[MANUAL-VERIFY] In web mode, fill the shown combatant's notes and description with enough lines to pass the column's height: both grow with their text and the column scrolls as one area from the name field to the end of the description, while the global combat notes stay fixed at the top. Click the combatant of an entity that was deleted on its own screen: the name, HP, notes show and no content section panel or description appears.

[MANUAL-VERIFY] Hand-off to the human tester, since an agent session cannot pair devices: the entity edits made here show on a paired device after a sync.
