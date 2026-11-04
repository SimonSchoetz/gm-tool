# Content section bodies

**Purpose.** The GM sees a content section the same way in both places that show it: editable on the base entity's screen, read-only in the entity's mention popup. Each section type (Text, Basic Stat Block, 5e Stat Block) has one body component of its own, used by both, so the popup shows exactly what was written in the panel.

## How it works

Happy path:

1. On a base entity's screen, the content panel shows the selected section through its type's body: a Text section as a text editor, a 5e Stat Block as its structured fields (see `five-e-stat-block.md`), a Basic Stat Block as the HP number field with the text editor underneath. Every edit autosaves.
2. In the entity's mention popup, the selected section is shown through the same body, read-only and laid out as on the screen. A Text section shows its text, a 5e Stat Block its fields (see `five-e-stat-block.md`); a Basic Stat Block shows "HP" and its value in a read-only field, then the text, with no indent on the HP row.
3. The entity's image stays beside the section region in the popup; stepping between sections (burger, up/down) slides only the section region.
4. The Session popup shows the session's summary and the Encounter popup the encounter's description, read-only.

Failure:

- A section with no content shows the editor's placeholder on the screen and nothing in the popup.
- An entity with no sections shows the image alone in the popup.

Where the user waits: the popup shows only its header until the entity's sections have loaded (see `section-carousel-mention-click.md`).

## Data

- **Reads:** the entity's content sections — type, name and content — from the cache every body shares; a section opened in the popup shows the screen's latest saved content.
- **Writes:** only the panel's editable bodies write (a text body its content; a Basic Stat Block its HP and text together, see `basic-stat-block.md`). The popup writes nothing.

## Rules

| Rule | Why | Source |
| --- | --- | --- |
| On a base entity screen, Text, Basic Stat Block and 5e Stat Block sections are editable and autosaved on the screen, the Basic Stat Block with its HP rules (see `basic-stat-block.md`) and the 5e Stat Block as its structured fields (see `five-e-stat-block.md`) | — | Simon Schötz, 2026-10-24; `readSaveableWholeNumber.test` |
| In the entity's mention popup, a Text section shows its text read-only, laid out as on the screen | — | Simon Schötz, 2026-10-24; no test |
| In the popup, a Basic Stat Block section uses the screen's layout: "HP" and its value then the text, with HP as a read-only input; an empty HP shows the label and an empty field | One component per type renders the same structure in both modes | Simon Schötz, 2026-10-24; no test |
| In the popup, a 5e Stat Block section shows its fields read-only, as the screen shows it | — | Simon Schötz, 2026-10-24; no test |
| No component, file, prop, helper or CSS class name in the popup or panel code contains "summary"; the exceptions are the Session's own `summary` data field and a section the user named "Summary". The rule is about code naming, not UI labels | — | Simon Schötz, 2026-10-24; no test |
| A section with no content shows the editor's placeholder on the screen and nothing in the popup | A read-only text editor renders no placeholder | Simon Schötz, 2026-10-24; no test |
| The entity image stays beside the section region in the popup, whatever the section type; stepping between sections slides only the section region | The image belongs to the entity, not to a section | Simon Schötz, 2026-10-24; no test |
| Session and Encounter popups show `session.summary` / `encounter.description` read-only; the Session's `summary` column stays as it is | They have no content sections | Simon Schötz, 2026-10-24; no test |
| A section opened in the popup while the same section is open on the screen shows the screen's latest saved content | Every body renders from the shared query cache, and an unfocused editor adopts a changed value | Simon Schötz, 2026-10-24; no test |
| Each content section type is rendered by one body component shared by the screen panel (editable) and the popup (read-only), selected by a mode | Both places render the same content; one component per type keeps them from drifting apart | proposed by Claude, accepted by Simon Schötz, 2026-10-24; no test |
| The Basic Stat Block body has one render path: `readOnly` on the HP input and the text editor, the HP a read-only input in the popup, the editor's change handler only when editable, the editable padding class the only conditional | Simpler than a separate read-only branch; a change handler passed to a read-only editor would save a checklist tick made in the popup | Simon Schötz, 2026-10-24; no test |
| The HP is part of the Basic Stat Block body, never a header slot of a generic body | HP is stat-block content, not a header; a header slot mixes concepts | Simon Schötz, 2026-10-24; no test |
| In read-only mode the Basic Stat Block's HP row carries no gutter padding, so it lines up with the text | A read-only text editor has gutter width 0 | Claude's call, 2026-10-24; no test |

## Open points

None in the open-questions register.

Not yet registered: two hand checks in the browser pane (`pnpm run web`) are still open. A Basic Stat Block popup's "HP" label starts at the same left edge as its text and the row looks like the screen's apart from the input; a Text section in the popup stays within the popup's size and long text scrolls inside the body at the popup height. The layout rules above depend on them.

## Where to look

- Shared bodies: `ContentSectionBody` (the dispatcher), `TextSectionBody`, `BasicStatBlockSectionBody` with the shared `readSaveableWholeNumber` helper, `FiveEStatBlockSectionBody`, and the `SectionBodyProps` type.
- Screen: `BaseEntityContentSectionPanel`.
- Popup: `BaseEntityPopupContent`, `EntityReadOnlyView`, `EntityPopupBody`, `EntityPopupBodyText`, `SessionPopupContent`, `EncounterPopupContent`.
- Tests: `readSaveableWholeNumber.test`, `FiveEStatBlockSectionBody.test` and its field components' tests, `EntityPopupBody.test`. The Text and Basic Stat Block bodies have no test: components carry none unless a handler alone decides an outcome.
