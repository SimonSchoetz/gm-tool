# 5e Stat Block

**Purpose.** A GM can add a "5e Stat Block" content section to a base entity (usually a foe) and fill in its 5e stat fields — HP, AC, Initiative, Proficiency Bonus, Speed, Creature Type, MOD and SAVE per ability, Resistances, Immunities, Senses, Skills and Languages — which the app saves. Before this feature the section was a plain text section.

## How it works

Happy path:

1. On an entity's screen, the GM picks "5e Stat Block" from the content-section type menu. The section shows four groups, in this order: a row of HP, AC, Initiative and Proficiency Bonus (number fields) above a row of Speed and Creature Type (text fields); an abilities grid with MOD and SAVE for STR, DEX, CON, INT, WIS and CHA (number fields); Resistances and Immunities (text fields); Senses, Skills and Languages (text fields). Empty fields show a placeholder.
2. Each field autosaves on its own shortly after the last keystroke, and switching to another section saves a pending change at once. Edits to different fields made straight after each other are all kept.
3. In the entity's mention popup, the same layout shows read-only: an empty number field keeps its label and shows no placeholder; a text field that is blank, or only spaces, is left out together with its label; Speed and Creature Type keep their own columns when the other is hidden; a row, Defenses or Misc group with nothing to show takes no space.
4. Duplicating the entity copies its 5e sections with all fields.

Failure:

- Text typed in a text field is saved as typed: `--`, `->` and `<-` are rewritten while typing, and nothing is trimmed.
- A number field takes only empty or a whole number, negatives included. While it holds anything else — a decimal, `1.` on the way to `1.5`, a lone `-` — nothing is saved, and when the field loses focus it goes back to the last saved value. A number beyond the safe-integer range of about 16 digits is not saved either, and reverts the same way.
- A section whose stored content is old free text, Lexical editor state or anything that is not this feature's shape reads as empty, and the first edit replaces it; nothing is kept from the old content.
- A save written at the moment the GM switches sections shows no error if it fails.
- Two paired devices, one on a build from before this feature and one after, pause sync until both are upgraded.

Where the user waits: the panel shows nothing, and the popup only its header, until the entity's sections have loaded. Saving never holds up typing.

## Data

- **Reads:** the entity's content sections — type, name and content — shared by the panel, the 5e body and the mention popup.
- **Writes:** one JSON value in the section's existing content field: `{ fiveEStatBlock: { <key>: value } }` with 16 number keys (whole number or empty) and 7 text keys (text). A new section has no content until its first edit, which reads as every number empty and every text empty. The section's type is set once, when it is created.
- **Sync:** sections reach paired devices as before; the sync protocol version is 3. A section arriving by sync has its content checked only as text.

## Rules

| Rule | Why | Source |
| --- | --- | --- |
| A 5e Stat Block section shows the fields and layout described above, with the look of the earlier outline | The user story: the section holds real, saved 5e fields | the feature story, 2026-10-24; checked by hand in `pnpm run web` |
| Every field autosaves; each save is composed against the latest cached content, so edits to different fields are all kept | All fields share the section's one content value, so no save may undo another | the feature story, 2026-10-24 |
| Number fields take empty or a whole number, negatives included; an unsaveable value is not saved and reverts on blur | The whole-number rule shared with the Basic Stat Block HP | the feature story, 2026-10-24 |
| Text fields save what they show: `--`, `->` and `<-` are rewritten as typed and nothing is trimmed | The saved value is what the field shows | the feature story, 2026-10-24 |
| Read-only: an empty number field keeps its label without a placeholder; a blank text field is hidden with its label; Speed and Creature Type keep their columns; empty rows collapse | The popup shows only what has been written | the feature story, 2026-10-24; the blank-text hide is tested; the placeholder drop, column pinning and row collapse are checked by hand |
| Old free text and Lexical editor state read as empty and the first edit replaces them | The earlier section held plain text, which has no field to map to | the feature story, 2026-10-24 |
| Duplicating an entity copies its 5e sections with all fields | A duplicate copies every section field except its ids and timestamps | the feature story, 2026-10-24 |
| The sync protocol version goes from 2 to 3 | Devices on builds from before and after this feature pause sync until both are upgraded, instead of one device reading the other's 5e content as empty | the feature story, 2026-10-24; no test |
| A field added to the schema later must carry a zod default | Any new required key would make every stored 5e section read as empty | spec KAD, 2026-10-24 |
| No Size field, no ability scores and no derived values (modifiers, proficiency from level) | Out of scope: the section stores what the GM types | the feature story, 2026-10-24 |
| The body reads the content once, calls the data hook once and passes one save function to the fields | One hook instance owns one autosave queue; a second instance would flush its own pending write out of edit order on unmount | spec KAD, 2026-10-24 |

## Open points

None in the open-questions register.

Not yet registered: hand checks that need the native app (`pnpm run dev`) — no stepping arrows on the 16 number fields, ArrowUp and ArrowDown stepping by one, and the section's values after restarting the app.

## Where to look

- Domain: `fiveEStatBlockContent` (the content shape, its total read and patch functions), `wholeNumberInput` (the whole-number rule), `contentSectionContentSchemas`, and the sync `messages` module (the protocol version).
- Screens and components: `FiveEStatBlockSectionBody` and its groups, `FiveEStatBlockNumberField` and `FiveEStatBlockTextField` (under `app/src/components/ContentSectionBody/components/FiveEStatBlockSectionBody/`), and the shared `readSaveableWholeNumber` helper.
- Tests: `fiveEStatBlockContent.test`, `wholeNumberInput.test`, `contentSectionContentSchemas.test`, `duplicate-by-base-entity.test`, `readSaveableWholeNumber.test`, and the tests of the number field, the text field and the body.
