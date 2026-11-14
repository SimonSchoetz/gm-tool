# UI

UI/UX decisions that hold across the app: what the project's UI conventions leave open, and each deliberate departure from them with its reason.

## Scroll edges

| Rule | Why | Source |
| --- | --- | --- |
| Every vertical scroll area that has spacing between its content and its top or bottom edge fades its content out toward that edge while it scrolls, instead of cutting it off; an edge with no spacing has no fade, and a scroll area with none stays as it is. The slash command menu, the table handle menu and the mention suggestion list keep a hard edge, as do the sortable entity tables and the sidebar's button list, whose only spacing is a gutter that keeps the buttons' hover shadow from being clipped | "It just cuts off abruptly"; a bar painted over the edge cannot hide it, because the glass panels behind the content are not opaque; a faded row in a short pick menu could read as disabled, and a fade there would hide the hover shadow the gutter exists for | Simon Schötz, 2026-11-14; hand test |
| Content at rest keeps its spacing to the edge and is never faded: the fade covers that spacing and, on a side where more content lies beyond the edge, a further reach into the content that grows over the first part of a scroll and is gone at the start and the end of the scroll range | "I like the spacing that's currently between first line of texteditor and the content section"; the last line faded "even though it's scrolled all the way down" was a defect | Simon Schötz, 2026-11-14; hand test |
| The fade reaches twice the spacing into the content, so the whole fade is three times the spacing: 48 px in the text editor, whose spacing is 16 px, and 24 px in a content section, whose spacing is 8 px | "For these smaller content boxes with less spacing, the fade should also be smaller … we need to make more of the less given space" | proposed by Claude, accepted by Simon Schötz, 2026-11-14; hand test |
| The fade's opacity follows an ease-in curve, so content is nearly gone before it meets the edge | "Can the fade be more drastic?" | proposed by Claude, accepted by Simon Schötz, 2026-11-14; hand test |
| The scrollbar is never faded and stays the height of the area the content rests in | "I'd love if it's really only on the contents, not on the scroll bar" | Simon Schötz, 2026-11-14; hand test |
| A row that the keyboard highlights or focuses, or that the app scrolls into view, in a faded area ends fully visible, clear of the fade | A highlighted row is never shown half-transparent | proposed by Claude, accepted by Simon Schötz, 2026-11-14; hand test |
| On a Mac whose WebKit has no scroll-driven animations (Safari before 26), the fade covers only the spacing | Without them the reach cannot follow the scroll, and a fixed reach would fade content at rest | Claude's call, 2026-11-14; no test |

## Where to look

- `app/src/styles/scroll-edge-fade.css` — the `scroll-edge-fade` class, its `--sm` size, the `--no-top` and `--no-bottom` modifiers for an edge with no spacing, and the `scroll-padding-block` that keeps a scrolled-to row clear of the fade.
