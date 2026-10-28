# Sub-feature 4: Three-column screen

Replaces the encounter screen's two-column text layout with the layout of the combat screen: the name header above a body whose left column holds Duplicate and Delete (SF5 adds the queue above them), whose middle column holds the global combat notes, and whose right column SF6 adds. The global combat notes are the encounter's existing description editor, unchanged in data and id.

## Files affected

Modified:

- `app/src/screens/encounter/EncounterScreen.tsx` — drops `ScreensTextEditorLayout`, `TextEditor` and `EncounterSidebar` and composes the new layout
- `app/docs/_product/domain-scaffold.md` — rewrite the `screens/encounter/` bullet of Detail Screen Composition

Deleted: none

New:

- `app/src/screens/encounter/EncounterScreen.css`
- `app/src/screens/encounter/components/EncounterNotes/EncounterNotes.tsx`, `EncounterNotes.css`

Moved:

- `mv app/src/screens/encounter/components/EncounterSidebar.tsx app/src/screens/encounter/components/EncounterQueueActions.tsx`, then rename the component to `EncounterQueueActions`, remove the `ScreensSidebar` import and wrapper so the component returns a fragment of the `ScreensDuplicateBtn` and the Delete `Button`, and keep everything else unchanged (the Delete label "Delete Encounter", the confirmation through `openDeleteDialog`, the navigation to the adventure's encounter list, and the `if (!encounter) return;` guard)

Draft: none

## Layered breakdown

### Frontend

`EncounterScreen.tsx`

- Purpose: the root of the encounter route; owns the three-column frame and the loading state.
- Behavior: reads `adventureId` and `encounterId` with `useParams({ from: '/adventure/$adventureId/encounter/$encounterId' })` and `useEncounter(encounterId, adventureId)`; while `loading || !encounter` it renders `<div className='content-center'><LoadingIcon /></div>` exactly as today. Otherwise it renders the frame; it no longer needs `updateEncounter`.
- UI / Visual: a `GlassPanel` with class `encounter-screen` and the inline custom property `--encounter-screen-side-width` set to `${PREVIEW_WIDTH * 1.5}px` (`PREVIEW_WIDTH` from `../screens.constants`, one cast `as React.CSSProperties`, as `SessionScreen` does). Inside it, `<header className='encounter-screen-header'>` holding `EncounterHeader`, then `<div className='encounter-screen-body'>` holding two children: `<div className='encounter-screen-queue-column'>` with `EncounterQueueActions`, and `<div className='encounter-screen-middle-column'>` with `EncounterNotes`. `EncounterScreen.css`: the root is a flex column filling its parent (`height: 100%`, `width: 100%`, `min-height: 0`), the header has `padding: var(--spacing-md)` and `padding-bottom: 0`, the body is `flex: 1` with `min-height: 0`, `padding` and `gap` of `var(--spacing-md)`, and a grid of two columns, the first `var(--encounter-screen-side-width)` and the second `minmax(0, 1fr)`; both columns are flex columns with `gap: var(--spacing-md)` and `min-height: 0`. There is no maximum width and no centering. SF6 adds the third column.

`EncounterNotes.tsx` (no props, so no `FCProps`)

- Purpose: the global combat notes at the top of the middle column.
- Behavior: reads the route params and `useEncounter` as above and returns early with `if (!encounter) return;` as `EncounterHeader` does. It renders the existing `TextEditor` with the `textEditorId` string `ENCOUNTER_<encounter.id>_description`, `value` set to `encounter.description ?? ''`, an `onChange` that calls `updateEncounter({ description })`, and `placeholder='Global combat notes...'`; the id, the field and the save path are the ones `EncounterScreen` uses today, so existing text and saving are untouched. The panel is a case-1 container: `GlassPanel` with `intensity='bright'`, class `encounter-notes`, wrapping the editor that carries class `encounter-notes-text-editor`.
- UI / Visual: `EncounterNotes.css` declares the same properties as `.in-game-view--summary` (`padding: var(--spacing-sm)`, `padding-left: 0`, `border-radius: var(--radius-lg)`) for `.encounter-notes`, and as `.in-game-view--summary-text-editor` (`height: var(--popup-content-section-height)`, `overflow-y: auto`) for `.encounter-notes-text-editor`, from `app/src/screens/session/components/InGameView/InGameView.css`; that reference was read against `.claude/rules/src-css.md` and holds only tokens. The panel keeps its height and the text scrolls inside it.

`EncounterQueueActions.tsx` has no stylesheet; the queue column's flex `gap` spaces its two children, which are direct flex children because the component returns a fragment.

No declaration moves off a rule that also applies to other elements: the notes panel's declarations are copied from `InGameView.css`, not moved, so that stylesheet stays unchanged.

Unchanged after reading: `app/src/screens/encounter/index.ts` (exports `EncounterScreen` only) and `EncounterHeader.tsx` (composes the shared `ScreensNameInput`).

Modified-file scan: `EncounterScreen.tsx` is rewritten with no inline sub-component and no `return null` or `return undefined` in a void context; the remaining `return;` guards are in components that return JSX, as `EncounterHeader.tsx` has them today.

### Documentation

`app/docs/_product/domain-scaffold.md`, Detail Screen Composition, second bullet of the list under "`screens/session/` and `screens/encounter/` are deliberate exceptions": the sentence that begins "`screens/encounter/`: `EncounterScreen` bypasses `ScreensTextEditorLayout`" is replaced by a bullet stating that `EncounterScreen` has its own `EncounterScreen.css` (a `GlassPanel` root with `EncounterHeader` above a three-column body: the combat queue with Duplicate and Delete below it, the global combat notes in a fixed-height panel, and a sidebar of tabs), that `EncounterHeader` composes the shared `ScreensNameInput` rather than hand-rolling it, and that the shape is justified by an encounter being a working surface with a queue, notes and an action sidebar, not a new default pattern, so it is not to be copied either. The file was read through; this bullet is the only statement in it about the encounter screen's layout, and the sentence "each for its own reason, and neither is a template to copy" above it stays true.

Test behaviors: none. The only event handling in these components is the `onChange` forward to `updateEncounter`, unchanged from today's `EncounterScreen`, and the outcome it decides is Lexical's emission of that change, which a test cannot drive: typing into `TextEditor` under jsdom never reaches the editor state (`.claude/knowledge/lexical.md`, the entry beginning "Typing into `TextEditor` with user-event under jsdom"). The Delete and Duplicate handlers are moved unchanged.

[MANUAL-VERIFY] Text typed into the global combat notes is still there after leaving the encounter and returning, and text written before this change is still there. Verify in the browser pane (web mode).

[MANUAL-VERIFY] The notes panel keeps a fixed height and scrolls its text when the text is longer. Layout is not computed by the test environment; verify in the browser pane.

[MANUAL-VERIFY] The left column shows Duplicate and Delete Encounter; Duplicate creates and opens a new encounter named as before, and Delete asks for confirmation, removes the encounter and returns to the encounter list. Verify in the browser pane.
