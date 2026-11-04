# 5e Stat Block

**Purpose.** A GM, the app's single user, adds a "5e Stat Block" content section to a base entity — usually a foe — and fills in its 5e stat fields: HP, AC, Initiative, Proficiency Bonus, Speed, Creature Type, MOD and SAVE per ability, Resistances, Immunities, Senses, Skills and Languages. The app saves them, so a foe's 5e stats sit in one consistent, glanceable layout instead of a hand-built table in free text.

## How it works

Happy path:

1. On an entity's screen, the GM picks "5e Stat Block" from the content-section type menu. The section shows four groups, in this order: a row of HP, AC, Initiative and Proficiency Bonus (number fields) above a row of Speed and Creature Type (text fields); an abilities grid with MOD and SAVE for STR, DEX, CON, INT, WIS and CHA (number fields); Resistances and Immunities (text fields); Senses, Skills and Languages (text fields). Empty fields show a placeholder.
2. Each field autosaves on its own shortly after the last keystroke, and switching to another section saves a pending change at once. Edits to different fields made straight after each other are all kept.
3. In the entity's mention popup, the same layout shows read-only. An empty number field keeps its label and shows no placeholder. A text field shows its value as plain text, and is left out together with its label when it is blank or only spaces. Speed and Creature Type keep their own columns when the other is hidden, and a row or group with nothing to show takes no space.
4. Duplicating the entity copies its 5e sections with all fields.

Failure:

- Text typed in a text field is saved as typed: `--`, `->` and `<-` are rewritten while typing, and nothing is trimmed.
- A number field takes only empty or a whole number, negatives included. While it holds anything else — a decimal, `1.` on the way to `1.5`, a lone `-` — nothing is saved, and when the field loses focus it goes back to the last saved value. A number beyond the safe-integer range of about 16 digits is not saved either, and reverts the same way.
- A section whose stored content is old free text, Lexical editor state or anything that is not the 5e Stat Block shape reads as empty, and the first edit replaces it; nothing is kept from the old content.
- A save written at the moment the GM switches sections shows no error if it fails.
- Two paired devices on different sync protocol versions pause sync until both are upgraded.

Where the user waits: the panel shows nothing, and the popup only its header, until the entity's sections have loaded. Saving never holds up typing.

## Data

- **Reads:** the entity's content sections — type, name and content — shared by the panel, the 5e body and the mention popup.
- **Writes:** one JSON value in the section's existing content field: `{ fiveEStatBlock: { <key>: value } }` with 16 number keys (whole number or empty) and 7 text keys (text). A new section has no content until its first edit, which reads as every number empty and every text empty. The section's type is set once, when it is created.
- **Sync:** sections reach paired devices by sync; the sync protocol version is 3. A section arriving by sync has its content checked only as text.

## Rules

| Rule | Why | Source |
| --- | --- | --- |
| A 5e Stat Block section on an entity's screen looks as the outline in commit `ff9df60e` renders it: row one HP, AC, Initiative, Proficiency Bonus; row two Speed, Creature Type; a 7-column grid with a MOD and a SAVE row under STR, DEX, CON, INT, WIS, CHA; then Resistances and Immunities; then Senses, Skills and Languages, with the outline's labels, placeholders, proportions, spacing and label style; the only visible difference is the outline's misspelt "Resistences:", which reads "Resistances:"; the code behind the look is free to change | "The code is garbage but I want all agents that work on this to have a look how it looks now. The goal is to have it look exactly as it is rn and work under the hood as expected" | Simon Schötz, 2026-10-24; hand test |
| Every field's value is still there after switching to another section and back, and after restarting the app | The fields are saved, not display state | Simon Schötz, 2026-10-24; FiveEStatBlockSectionBody.test, fiveEStatBlockContent.test, hand test |
| Changing two different fields straight after each other keeps both changes after a restart | All fields share the section's one content value, so no save may undo another; the body holds one autosave queue for all its fields (one `useBaseEntityContentSections` call passing one `saveField` callback down), because each hook call owns its own queue and on unmount the queues flush in tree order, not edit order, so a quick Speed-then-HP edit before a section switch would lose HP | Simon Schötz, 2026-10-24; FiveEStatBlockSectionBody.test, fiveEStatBlockContent.test |
| Each number field (HP, AC, Initiative, Proficiency Bonus, the six MODs, the six SAVEs) accepts empty or any whole number, negatives included; anything else is not saved and the field goes back to the last saved value on blur; no digit limit | Same input behaviour across stat blocks as the Basic Stat Block HP; the outline's `maxLength` has no effect on number inputs | proposed by Claude, accepted by Simon Schötz, 2026-10-24; FiveEStatBlockNumberField.test, wholeNumberInput.test, readSaveableWholeNumber.test |
| A number beyond the safe-integer range (about 16 digits) is unsaveable and reverts on blur, as the Basic Stat Block HP does | `z.int()` rejects it, and no stat reaches that size | Claude's call, 2026-10-25; wholeNumberInput.test |
| Number fields show no stepping arrows; ArrowUp and ArrowDown in a focused number field still step by one | The user does not like the arrows; keyboard stepping stays | Simon Schötz, 2026-10-24; no test, jsdom draws no arrows and does not step number inputs |
| Each text field uses the shared `SyncedInput`, so `--` becomes an em dash and `->` / `<-` arrows as elsewhere; the saved value is exactly what the field shows, never trimmed | Same typing behaviour as every other text input in the app | proposed by Claude, accepted by Simon Schötz, 2026-10-25; FiveEStatBlockTextField.test |
| A new 5e Stat Block section shows every field empty with its placeholder | A new section has no content until its first edit | Simon Schötz, 2026-10-24; fiveEStatBlockContent.test |
| In the read-only mention popup the section shows the same layout read-only; an empty number field shows its label and no value or placeholder; a text field with no value is not shown, label included | Example text must not read as real data; "for all input type text, when there are no values, they should not be visible at all in read only mode, so not even the label should show to keep the stat block as tidy as possible" | Simon Schötz, 2026-10-24; isHiddenTextField.test, FiveEStatBlockTextField.test, hand test |
| In read-only, a text field whose value is blank after trimming counts as empty and is hidden; stored text is never trimmed | Whitespace-only text carries nothing to read | proposed by Claude, accepted by Simon Schötz, 2026-10-25; isHiddenTextField.test |
| In read-only, a hidden text field leaves the other fields in their own column positions (Speed and Creature Type pinned to their grid columns); a row with no visible field collapses | Fields don't jump between columns depending on which are filled | proposed by Claude, accepted by Simon Schötz, 2026-10-25; no test, layout is not computed under jsdom |
| In the read-only popup a text field shows its value as plain text, not as an input; every `Input` shows its value as a tooltip unless the caller passes a `title`, has rounded corners, and highlights on hover only when editable | — | Simon Schötz, 2026-10-25; no test |
| A section whose stored content is not the 5e Stat Block shape (old free text, Lexical editor state) shows every field empty; the first edit replaces that content | Old free text has no field to map to | Simon Schötz, 2026-10-24; fiveEStatBlockContent.test |
| Duplicating an entity copies its 5e Stat Block sections with all field values | A duplicate copies every section field except ids and timestamps | Simon Schötz, 2026-10-24; duplicate-by-base-entity.test |
| MOD and SAVE are independent typed values; the app calculates nothing | Matches the outline, which has no ability scores or proficiency toggles | proposed by Claude, accepted by Simon Schötz, 2026-10-24; no test |
| Paired devices sync only when both use the same sync protocol version (`SYNC_PROTOCOL_VERSION`, 3), so a build that holds 5e Stat Block content as editor text and a build with this structured content pause sync until both are upgraded | An older build would read the structured content as editor text; a pause is better than devices silently diverging | proposed by Claude, accepted by Simon Schötz, 2026-10-24; no test |
| A field added to the schema later must carry a zod default | `readFiveEStatBlockContent` reads content the schema rejects as empty, so a new required key would make every stored 5e section read as empty | Claude's call, 2026-10-24; no test |

## Open points

None in the open-questions register.

Not yet registered: hand checks that need the native app (`pnpm run dev`) — no stepping arrows on the 16 number fields, ArrowUp and ArrowDown stepping by one, and the section's values after restarting the app. The popup's read-only layout (Creature Type alone keeps its column, empty rows collapse, plain-text values) has also not been looked at in the browser pane.

## Where to look

- Domain: `fiveEStatBlockContent` (the content shape, its total read and patch functions), `wholeNumberInput` (the whole-number rule), `contentSectionContentSchemas`, and the sync `messages` module (the protocol version).
- Screens and components: `FiveEStatBlockSectionBody` with its four groups, `FiveEStatBlockNumberField` and `FiveEStatBlockTextField` with its `isHiddenTextField` helper, the shared `readSaveableWholeNumber` helper, and the `Input` component (tooltip and hover).
- Tests: `fiveEStatBlockContent.test`, `wholeNumberInput.test`, `contentSectionContentSchemas.test`, `duplicate-by-base-entity.test`, `readSaveableWholeNumber.test`, `isHiddenTextField.test`, and the tests of the number field, the text field and the body.
