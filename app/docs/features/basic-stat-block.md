# Basic stat block

**Purpose.** A GM can add a "Basic Stat Block" content section to a base entity (an NPC, PC, foe, faction, location or item): an HP field with a text editor underneath. The app then holds the stat-block structure, so the GM no longer keeps their own stat-block format in free text. It is the first stat-block template; a later template adds its own section type the same way.

## How it works

Happy path:

1. On an entity's screen, the GM opens the content-section type menu (the "+" in the panel's menu bar, or "Add section" in the section list) and picks "Basic Stat Block", listed between "Text" and "5e Stat Block". The app creates a section named "Basic Stat Block" and shows it.
2. The section shows an "HP" number field with the text editor underneath. A new section starts with HP empty and the editor's placeholder showing.
3. The GM types an HP value and text. Each change saves on its own shortly after the last keystroke, and switching to another section saves a pending change at once. An HP change and a text change made straight after each other are both kept.
4. In the entity's mention popup, the section shows "HP" and its value above the text, both read-only. An empty HP shows the label alone.
5. Duplicating the entity copies its basic stat block sections with their HP and text.

Failure:

- HP takes only empty or a whole number, negatives included. While the field holds anything else — a decimal, `1.` on the way to `1.5`, a lone `-` — nothing is saved, and when the field loses focus it goes back to the last saved HP.
- The app checks a stat block's content against its shape before every save on this device. Content that fails that shape anyway — only possible if a paired device's build wrote it — shows the app's error screen when the section is opened or shown in the popup.
- A save written at the moment the GM switches sections shows no error if it fails.
- Two paired devices, one on a build from before this feature and one after, pause sync until both are upgraded.

Where the user waits: the panel shows nothing, and the popup only its header, until the entity's sections have loaded. Saving never holds up typing.

## Data

- **Reads:** the entity's content sections — type, name and content — shared by the panel, the stat-block body and the mention popup.
- **Writes:** a basic stat block's HP and text together, as one JSON value in the section's existing content field: `{ basicStatBlock: { hp }, textEditor }`, where `hp` is a whole number or empty and `textEditor` is the text editor's own saved state, kept as text. A new section has no content until its first edit, which reads as HP empty and text empty. The section's type is set once, when it is created.
- **Sync:** sections reach paired devices as before; the sync protocol version is 2. A section arriving by sync has its content checked only as text.

## Rules

| Rule | Why | Source |
| --- | --- | --- |
| The type menu lists "Basic Stat Block" between "Text" and "5e Stat Block"; picking it creates a section named "Basic Stat Block" and shows it | The user story: the GM adds a Basic Stat Block section to a base entity | not recorded; no test |
| A Basic Stat Block section shows a number field labelled "HP" with the text editor underneath; a new one starts with HP empty and the editor's placeholder showing | The user story: an HP field with a text editor underneath | not recorded; no test |
| HP and text are still there after switching to another section and back, and after restarting the app | The user story: the app holds the stat-block structure | not recorded |
| Changing HP and then typing in the editor straight away, and the reverse, keeps both changes after a restart | HP and text share the section's one content value, so neither save may undo the other | not recorded |
| HP accepts empty or any whole number, negatives included: a cleared HP is empty after a restart, and a value with decimals is not saved, so after a restart HP shows the last whole number entered | Applies the HP rule below to what gets saved | not recorded |
| In an entity's mention popup, a Basic Stat Block section shows its HP above its text, both read-only | The popup rule below | not recorded; no test |
| Text and 5e Stat Block sections, new and existing, look and behave as before | The existing section types are out of scope and stay as they are | not recorded |
| Duplicating an entity copies its Basic Stat Block sections with their HP and text | A duplicate copies every section field except its ids and timestamps | not recorded |
| A "Basic Stat Block" section type: an HP number field with a text editor underneath | The GM uses template stat blocks so they do not have to maintain the system themselves | Simon Schötz, 2026-10-19; no test |
| HP and text are stored together as one JSON value in the section's existing content field, shaped `{ basicStatBlock: { … }, textEditor: … }` | Keeps the database consistent | Simon Schötz, 2026-10-19 |
| The stored content is checked against a zod schema | not recorded | not recorded |
| The schema sits in the domain layer, in a table keyed by section type so each later template adds one entry; the database update checks content against it before writing, and the panel and the popup read content through it | The project requires validated schemas for JSON columns, and places validation rules and lookup tables keyed by a domain type in the domain layer; the popup reads the schema too | proposed by Claude, accepted by Simon Schötz, 2026-10-19 |
| In the mention popup, a basic stat block shows its HP above its text, both read-only | Matches text sections, which are read-only in the popup | proposed by Claude, accepted by Simon Schötz, 2026-10-19; no test |
| HP holds empty or any whole number, negatives included | not recorded | not recorded |
| The 5e stat block is out of scope; the existing "5e Stat Block" type stays a plain text section | To be fleshed out later | Simon Schötz, 2026-10-19; no test |
| The type's label is "Basic Stat Block", listed between "Text" and "5e Stat Block" | Names the type the way "5e Stat Block" does, and orders the menu from the plainest type to the most specific | Claude's call, 2026-10-19; no test |
| HP is the creature's hit points as written in its stat block; current HP and damage during an encounter are not tracked here | Encounter HP tracking is planned separately, and can later be prefilled from this value | Claude's call, 2026-10-19; no test |
| A new basic stat block starts with HP empty and empty text | Matches a new text section, which starts with no content | Claude's call, 2026-10-19 |
| The design — the content envelope, the type-keyed schema table, validation in the database update, and HP and text writes built on the latest cached content — went through an architecture review and was approved without changes | Approved by the user before the implementation was specified | Simon Schötz, 2026-10-19; no test |
| The sync protocol version goes from 1 to 2, so devices on builds from before and after this feature pause sync until both are upgraded | An older build skips a section whose type it does not know and still moves past it, so that section would be missing on that device until edited again; a sync pause is better than devices silently diverging | proposed by Claude, accepted by Simon Schötz, 2026-10-19; no test |
| In the panel, HP is one row above the editor: "HP" in the shared label style (the global `.label` class, as the adventure stats), then the number field filling the rest of the row with small spacing; the label is vertically centered on the number, and the row starts at the editor text's left edge through the editor's gutter constant, `TEXT_EDITOR_GUTTER_WIDTH`, and scrolls with the text | The user wants the row to line up with the editor text and the label to look like the other labels; colours and spacing come from the design tokens | Simon Schötz, 2026-10-20 |
| An empty HP shows nothing: the panel's HP field has no placeholder, and the popup shows "HP" with no value after it | The reviewed design shows an empty value when HP is empty | Claude's call, 2026-10-19; no test |
| When the HP field loses focus holding a value that cannot be saved (a decimal, `1.`, a lone `-`), it goes back to the last saved HP | The displayed HP then always matches the stored one | proposed by Claude, accepted by Simon Schötz, 2026-10-19; no test |
| The HP number field shows no stepping arrows, with the pointer over it or focused, and keeps ArrowUp and ArrowDown stepping by one; it stays a number field | The user does not like the arrows; the save and revert logic reads the browser's `badInput`, which only a number field reports | Simon Schötz, 2026-10-20 for the arrows, Claude's call, 2026-10-20 for staying a number field |
| In the popup, the HP line sits above the text: "HP" in the shared label style (the global `.label` class, as in the panel), vertically centered on the value, which is in the normal text colour at the base font size, with a small gap before the text | The user asked for the popup's HP label to match the panel's label and for the labels to be vertically centered; colours, sizes and spacing come from the design tokens | Simon Schötz, 2026-10-20 |
| The "HP" label reads "HP" without a colon; only its styling comes from the adventure stats | The Basic Stat Block rule fixes the label as "HP", shared with the popup; the user named the styling | Claude's call, 2026-10-20 |
| The arrow-free look, keyboard stepping, alignment and label style are checked by measuring in the `web` pane and by a hand test in `pnpm run dev`, not by a unit test | The browser decides the outcome, and jsdom neither computes layout nor steps a number input from the keyboard | Claude's call, 2026-10-20 |
| A stat-block save still pending when the GM switches sections is written at once; if that write fails, the GM sees no error | The project accepts this for every automatic save written when a screen part closes; HP is checked before it is saved, so only a database failure can reach this path | Claude's call, 2026-10-19 |
| The HP field is a plain number field rather than the project's `SyncedInput`: it saves only when the browser can read its text and that text is empty or a whole number, and it reverts an unsaveable value when it loses focus | `SyncedInput` gives no access to losing focus and passes on only the text, so it can neither revert nor tell unreadable text from a cleared field — typing `1.5` after `1` would save an empty HP | proposed by Claude, accepted by Simon Schötz, 2026-10-19 |
| The stat-block body reads and saves its own section, receiving only the section's id | The project rule that data a component can fetch itself is not passed down as a prop | Claude's call, 2026-10-19; no test |
| A section arriving by sync keeps having its content checked only as text, so a malformed stat block from a faulty paired build shows the error screen when read; checking JSON content on sync, the table-layout setting included, is a separate follow-up | Keeps stored content that fails its shape an error for the error screen, as the table-layout setting already is; skipping a bad section during sync would lose it silently, because sync still moves past it | Claude's call, 2026-10-19 |
| The HP rule converts text with the standard number conversion, so `1e3` saves 1000; hex and binary text cannot reach it from the number field | A number field's value is always empty or a valid decimal number, and `1e3` is a whole number; a digits-only check would add a second whole-number rule | Claude's call, 2026-10-19; no test |

## Open points

None in the open-questions register.

Not yet registered: checking JSON content against its shape when it arrives by sync — a basic stat block's content and the table-layout setting. The lead takes it to the user. The sync rule in Rules above depends on it.

## Where to look

- Domain: `basicStatBlockContent` (the content shape, its parse and patch functions, the HP rule and the "HP" label), `contentSectionContentSchemas` (the schema table keyed by section type and its accessor), `contentSectionTypes`, `contentSectionTypeLabels`, and the sync `messages` module (the protocol version).
- Database: the content-section `update`.
- Data access: `useBaseEntityContentSections` (`updateSectionContent`).
- Screens and components: `BaseEntityContentSectionPanel`, `BasicStatBlockSectionBody` with its `readSaveableHp` helper, `TextEditor.constants` (the editor's gutter width, which the HP row reads), `BaseEntityPopupContent`, `EntityPopupBody`.
- Tests: `basicStatBlockContent.test`, `contentSectionContentSchemas.test`, the content-section `update.test` and `duplicate-by-base-entity.test`, `useBaseEntityContentSections.test`, `readSaveableHp.test`, `useAutosaveQueue.test`.
