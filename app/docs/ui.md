# UI

UI/UX decisions that hold across the app: what the project's UI conventions leave open, and each deliberate departure from them with its reason.

## Scroll edges

| Rule | Why | Source |
| --- | --- | --- |
| Every vertical scroll area in the app fades its content out toward both its top and its bottom edge while it scrolls, instead of cutting it off, with no exception: the pick menus (slash command menu, table handle menu, mention suggestion list), the section menu, the encounter queue and the adventures list included, and an area with no spacing at either edge fades over its reach alone | "It just cuts off abruptly"; a bar painted over the edge cannot hide it, because the glass panels behind the content are not opaque; "I want all fades to be top and bottom, no exception"; "I want this to be used everywhere where the app handles overflow" | Simon Schötz, 2026-11-23; hand test |
| An area's spacing is the distance the user sees between its content at rest and the area's edge, however the layout provides it | The size rule below measures what the user sees | Claude's call, 2026-11-14; no test |
| Content at rest keeps its spacing to the edge and is never faded: the fade covers that spacing and, on a side where more content lies beyond the edge, a further reach into the content that grows over the first part of a scroll and is gone at the start and the end of the scroll range | "I like the spacing that's currently between first line of texteditor and the content section"; the last line faded "even though it's scrolled all the way down" was a defect | Simon Schötz, 2026-11-14; `scrollDrivenAnimationsBuild.test` (the release build keeps the reach following the scroll); hand test |
| The fade reaches twice the spacing into the content, so the whole fade is three times the spacing: 48 px in the text editor, whose spacing is 16 px, and 24 px in a content section, whose spacing is 8 px | "For these smaller content boxes with less spacing, the fade should also be smaller … we need to make more of the less given space" | proposed by Claude, accepted by Simon Schötz, 2026-11-14; hand test |
| An edge with no spacing of its own fades too, over the scroll-driven reach alone: twice the spacing the area has at its other edge, gone at the start and at the end of the scroll range like every reach, with no padding and no track margin there, so content at rest and the last line at the end of the scroll stay where they were | Both edges of a faded area read the same, and the reach is the only part of the fade that needs no spacing | Claude's call, 2026-11-14; hand test |
| The fade's opacity follows an ease-in curve, so content is nearly gone before it meets the edge | "Can the fade be more drastic?" | proposed by Claude, accepted by Simon Schötz, 2026-11-14; hand test |
| The scrollbar is never faded and keeps the length it had before the area got the fade, the height of the area the content rests in | "I'd love if it's really only on the contents, not on the scroll bar" | Simon Schötz, 2026-11-14; hand test |
| A row that the keyboard highlights or focuses, or that the app scrolls into view, in a faded area ends fully visible, clear of the fade | A highlighted row is never shown half-transparent | proposed by Claude, accepted by Simon Schötz, 2026-11-14; hand test |
| While typing in a faded text editor, the line holding the caret stays fully visible, clear of the fade, when the editor scrolls to follow the caret; a scroll the user made is not pulled back by an update that leaves the selection alone | The line being typed is never shown half-transparent; a future update without a selection change must not move a position the user chose | proposed by Claude, accepted by Simon Schötz, 2026-11-14; `computeCaretScrollDelta.test`, `revealCaretClearOfScrollPadding.test`, `ScrollPaddingCaretPlugin.test`; the scroll itself: hand test |
| Giving an area the fade changes nothing around it: with its content at rest no neighbouring element moves and the panel around it keeps its size, while the scroll area itself may grow into the spacing it takes over | No user-visible difference | Simon Schötz, 2026-11-14; hand test |
| A border or background that an area paints itself, such as the log composer's border or the error details' frame, stays fully visible: only the content fades | A faded border would read as a broken edge | Claude's call, 2026-11-14; hand test |
| The sortable entity tables and the sidebar's button list fade like every other area, with a gutter of 4 px kept around the buttons so that a hover shadow at an edge is not cut off | "why the list screens don't have the fade?" | proposed by Claude, accepted by Simon Schötz, 2026-11-14; hand test |
| The height of a content section box that takes the `--sm` fade spacing on both sides is one design token, `--popup-content-section-height-faded`, which the entity view, the mention popup's description, the in-game summary and the content section panel use | A change of the fade spacing then edits one value | proposed by Claude, accepted by Simon Schötz, 2026-11-14; no test |
| On a Mac whose WebKit has no scroll-driven animations (Safari before 26), the fade covers only the spacing, so an edge with none has no fade | Without them the reach cannot follow the scroll, and a fixed reach would fade content at rest | Claude's call, 2026-11-14; no test |

## Screen widths

| Rule | Why | Source |
| --- | --- | --- |
| On a window wider than it, the encounter screen stops growing at the width of its left column, the text editor's maximum width, its right column and the screen's own gaps, paddings, borders and scrollbar room. At that width the text editors of the global combat notes and of the shown item's notes are at their maximum width, 680 px, with nothing beside them beyond the room kept for a scrollbar, 4 to 12 px depending on whether one shows | The text editors of the notes are the width that matters, and the panels around them must not be wider than an editor uses | Simon Schötz, 2026-11-27; hand test |
| The Sessions list, the Encounters list and every base entity list stop growing when the list panel is 1200 px wide | — | Simon Schötz, 2026-11-27; hand test |
| The card grid of the Adventures screen stops growing at the width that holds 4 cards in a row, the "Create new adventure" card counting as one, also while the grid shows a scrollbar | — | Simon Schötz, 2026-11-27; hand test |
| On a window narrower than its cap, each of these screens fills the available width: on the encounter screen the middle column shrinks, and in the Adventures grid the cards wrap | — | Simon Schötz, 2026-11-27; hand test |
| However tall the window is, the rows of the Adventures grid stay together as one compact block, one card gap apart | "The rows should stay compact and centered horizontally" | Simon Schötz, 2026-11-27; hand test |
| That block of rows is centred vertically on the screen; when the rows don't fit, the grid scrolls and starts at the first row | The same vertical placement as a grid with a single row | Claude's call, 2026-11-27; hand test |
| On a window wider than a screen's cap, the encounter screen, these lists and the Adventures grid sit centred horizontally | The same placement as on the base entity and session screens | proposed by Claude, accepted by Simon Schötz, 2026-11-27; hand test |

## Dates

| Rule | Why | Source |
| --- | --- | --- |
| A date reads with a three-letter month: the adventure's start date ("Nov 27, 2026"), the date columns of the list tables, with the time after the date ("Nov 27, 2026 3:05 PM"), and the default name of a new adventure, encounter or base entity ("New adventure Nov 27, 2026 3:05 PM"). A name that is already stored stays as it is | One date format everywhere | proposed by Claude, accepted by Simon Schötz, 2026-11-27; `getDateString.test`, `getDateTimeString.test`, `formatDateValue.test`; where each date shows: hand test |

## Where to look

- `app/src/styles/scroll-edge-fade.css` — the `scroll-edge-fade` class, its `--sm` size, the `--no-top` and `--no-bottom` modifiers for an edge with no spacing of its own, the `--own-padding` and `--shadow-gutter` modifiers that keep a scrollbar track at the length it had, and the `scroll-padding-block` that keeps a scrolled-to row clear of the fade.
- `ScrollPaddingCaretPlugin` of the text editor, with its helpers `computeCaretScrollDelta` and `revealCaretClearOfScrollPadding` and their tests — the code that keeps the caret line clear of the fade.
- `app/src/styles/variables/dimensions-variables.css` — `--popup-content-section-height-faded`.
- `app/src/screens/encounter/EncounterScreen.css`, `app/src/components/SortableList/SortableList.css` and `app/src/screens/adventures/AdventuresScreen.css` — the width caps and the centring of the encounter screen, the list screens and the Adventures grid.
- `app/util/getDateString.ts` and `app/util/getDateTimeString.ts` — the date format.
