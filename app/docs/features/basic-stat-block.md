# Basic stat block

**Purpose.** A GM can add a "Basic Stat Block" content section to a base entity (an NPC, PC, foe, faction, location or item): an HP field with a text editor underneath. The app holds the stat-block structure, so the GM need not keep their own stat-block format in free text. Each stat-block template, this one and the 5e Stat Block, is its own section type.

## How it works

Happy path:

1. On an entity's screen, the GM opens the content-section type menu (the "+" in the panel's menu bar, or "Add section" in the section list) and picks "Basic Stat Block", listed between "Text" and "5e Stat Block". The app creates a section named "Basic Stat Block" and shows it.
2. The section shows an "HP" number field with the text editor underneath. A new section starts with HP empty and the editor's placeholder showing.
3. The GM types an HP value and text. Each change saves on its own shortly after the last keystroke, and switching to another section saves a pending change at once. An HP change and a text change made straight after each other are both kept.
4. In the entity's mention popup, the section shows "HP" and its value above the text, both read-only and laid out as on the entity's screen (HP row, then the text, no indent). An empty HP shows the label alone.
5. Duplicating the entity copies its basic stat block sections with their HP and text.

Failure:

- HP takes only empty or a whole number, negatives included. While the field holds anything else — a decimal, `1.` on the way to `1.5`, a lone `-` — nothing is saved, and when the field loses focus it goes back to the last saved HP.
- The app checks a stat block's content against its shape before every save on this device. Content that fails that shape anyway — only possible if a paired device's build wrote it — shows the app's error screen when the section is opened or shown in the popup.
- A save written at the moment the GM switches sections shows no error if it fails.
- Two paired devices on different sync protocol versions pause sync until both are upgraded.

Where the user waits: the panel shows nothing, and the popup only its header, until the entity's sections have loaded. Saving never holds up typing.

## Data

- **Reads:** the entity's content sections — type, name and content — shared by the panel, the stat-block body and the mention popup.
- **Writes:** a basic stat block's HP and text together, as one JSON value in the section's existing content field: `{ basicStatBlock: { hp }, textEditor }`, where `hp` is a whole number or empty and `textEditor` is the text editor's own saved state, kept as text. A new section has no content until its first edit, which reads as HP empty and text empty. The section's type is set once, when it is created.
- **Sync:** sections reach paired devices by sync; the sync protocol version is 3. A section arriving by sync has its content checked only as text.

## Rules

| Rule | Why | Source |
| --- | --- | --- |
| The type menu lists "Basic Stat Block" between "Text" and "5e Stat Block"; picking it creates a section named "Basic Stat Block" and shows it | Names the type the way "5e Stat Block" does, and orders the menu from the plainest type to the most specific | Simon Schötz, 2026-10-19; no test |
| A Basic Stat Block section shows a number field labelled "HP" with the text editor underneath; a new one starts with HP empty and the editor's placeholder showing | The GM uses template stat blocks so they do not have to maintain the system themselves; a new section has no content, as a new text section has none | Simon Schötz, 2026-10-19; basicStatBlockContent.test |
| HP and text are still there after switching to another section and back, and after restarting the app | The app holds the stat-block structure | Simon Schötz, 2026-10-19; basicStatBlockContent.test, update.test |
| Changing HP and then typing in the editor straight away, and the reverse, keeps both changes after a restart: each write is built on the latest cached content | HP and text share the section's one content value, so neither save may undo the other | Simon Schötz, 2026-10-19; useBaseEntityContentSections.test, basicStatBlockContent.test |
| HP accepts empty or any whole number, negatives included: a cleared HP is empty after a restart, and a value with decimals is not saved, so after a restart HP shows the last whole number entered | — | Simon Schötz, 2026-10-19; wholeNumberInput.test, readSaveableWholeNumber.test, update.test |
| When the HP field loses focus holding a value that cannot be saved (a decimal, `1.`, a lone `-`), it goes back to the last saved HP | The displayed HP then always matches the stored one | proposed by Claude, accepted by Simon Schötz, 2026-10-19; no test |
| The HP rule converts text with the standard number conversion, so `1e3` saves 1000; hex and binary text cannot reach it from the number field | A number field's value is always empty or a valid decimal number, and `1e3` is a whole number; a digits-only check would add a second whole-number rule | Claude's call, 2026-10-19; no test |
| An empty HP shows nothing: the panel's HP field has no placeholder, and the popup shows "HP" with no value after it | — | Claude's call, 2026-10-19; no test |
| In an entity's mention popup, a Basic Stat Block section shows its HP above its text, both read-only, laid out as on the screen (HP then text, no indent) | Matches text sections, which are read-only in the popup | Simon Schötz, 2026-10-19; no test |
| Duplicating an entity copies its Basic Stat Block sections with their HP and text | A duplicate copies every section field except its ids and timestamps | Simon Schötz, 2026-10-19; duplicate-by-base-entity.test |
| HP and text are stored together as one JSON value in the section's existing content field, shaped `{ basicStatBlock: { … }, textEditor: … }` | Keeps the database consistent | Simon Schötz, 2026-10-19; basicStatBlockContent.test |
| The stored content is checked against a zod schema in the domain layer, in a table keyed by section type so each template adds one entry; the database update checks content against it before writing, and the panel and the popup read content through it | The project requires validated schemas for JSON columns, and places validation rules and lookup tables keyed by a domain type in the domain layer; the popup reads the schema too | proposed by Claude, accepted by Simon Schötz, 2026-10-19; contentSectionContentSchemas.test, update.test |
| HP is the creature's hit points as written in its stat block; current HP and damage during an encounter are not tracked here | The encounter tracks current HP in its combat log (`deriveCombatState`), and a combatant's starting max HP is prefilled from this value when the entity has exactly one stat block (`singleStatBlockHp`) | Claude's call, 2026-10-19; no test |
| Paired devices sync only when both use the same sync protocol version (`SYNC_PROTOCOL_VERSION`), so a build without the Basic Stat Block type and a build with it pause sync until both are upgraded | An older build skips a section whose type it does not know and still moves past it, so that section would be missing on that device until edited again; a sync pause is better than devices silently diverging | proposed by Claude, accepted by Simon Schötz, 2026-10-19; no test |
| The HP number field shows no stepping arrows, with the pointer over it or focused | "It has arrows to move numbers up and down that I don't like" | Simon Schötz, 2026-10-20; hand test |
| The HP field stays a number field: ArrowUp or ArrowDown in the focused field still steps the number by one | Only the visible arrows go; the field's save and revert logic reads the browser's own `badInput` state, which only a number field reports | Simon Schötz, 2026-10-20; hand test |
| The "HP" label starts at the same left edge as the editor text below it, and is vertically centred against its value, in the panel row and in the popup line | The user wants the row to line up with the editor text; "I want the labels to be vertically centered" | Simon Schötz, 2026-10-20; no test |
| The "HP" label, in the panel and in the popup, has the app's shared label style, the same font, colour and size as the labels in the adventure stats row ("Started", "Sessions", …), and still reads "HP" (no colon) | "it should have same styling as other labels, e.g. the adventure stats. I think there is even a class for that"; the label text is shared by the panel and the popup, and the user named styling only | Simon Schötz, 2026-10-20; no test |
| A stat-block save still pending when the GM switches sections is written at once; if that write fails, the GM sees no error | The project accepts this for every automatic save written when a screen part closes; HP is checked before it is saved, so only a database failure can reach this path | Claude's call, 2026-10-19; useAutosaveQueue.test |
| The HP field is a plain number field wired to `useSyncedInputValue`, not the project's `SyncedInput`: it saves only when the browser can read its text and that text is empty or a whole number, and it reverts an unsaveable value when it loses focus | `SyncedInput` gives no access to losing focus and passes on only the text, so it can neither revert nor tell unreadable text from a cleared field — typing `1.5` after `1` would save an empty HP | proposed by Claude, accepted by Simon Schötz, 2026-10-19; readSaveableWholeNumber.test |
| A section arriving by sync has its content checked only as text, so a malformed stat block from a faulty paired build shows the error screen when read | Keeps stored content that fails its shape an error for the error screen, as the table-layout setting already is; skipping a bad section during sync would lose it silently, because sync still moves past it | Claude's call, 2026-10-19; no test |

## Open points

None in the open-questions register.

Not yet registered:

- Checking JSON content against its shape when it arrives by sync — a basic stat block's content and the table-layout setting. The lead takes it to the user. The sync rule in Rules above depends on it.
- A hand test in `pnpm run dev` that the HP field shows no stepping arrows and still steps with ArrowUp and ArrowDown; both were checked only in the `web` pane.

## Where to look

- Domain: `basicStatBlockContent` (the content shape, its parse and patch functions and the "HP" label), `wholeNumberInput` (the whole-number rule), `contentSectionContentSchemas` (the schema table keyed by section type and its accessor), `contentSectionTypes`, `contentSectionTypeLabels`, and the sync `messages` module (the protocol version).
- Database: the content-section `update`.
- Data access: `useBaseEntityContentSections` (`updateSectionContent`).
- Screens and components: `BaseEntityContentSectionPanel`, `ContentSectionBody` with `BasicStatBlockSectionBody` and the `readSaveableWholeNumber` helper, `TextEditor.constants` (the editor's gutter width, which the HP row reads), `BaseEntityPopupContent` and `EntityReadOnlyView`.
- Tests: `basicStatBlockContent.test`, `contentSectionContentSchemas.test`, the content-section `update.test` and `duplicate-by-base-entity.test`, `useBaseEntityContentSections.test`, `wholeNumberInput.test`, `readSaveableWholeNumber.test`, `useAutosaveQueue.test`.
