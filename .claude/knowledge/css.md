# CSS

## A text decoration is not propagated to the contents of an inline block

**Verified at:** CSS Text Decoration Module Level 3 (W3C TR), fetched 2026-11-03
**Citation:** [implement_18: https://www.w3.org/TR/css-text-decor-3/ — section 2, "Line Decoration: Underline, Overline, and Strike-Through": decorations are not propagated "nor to the contents of atomic inline-level descendants such as inline blocks and inline tables"] [implement_19: ran `getComputedStyle(span).textDecorationLine` in the browser pane on a `span` with `display: inline-block; text-decoration: inherit` inside a `del` — observed `line-through`]

An inline-block child of a `del` or `u` is not struck through or underlined by it. Setting `text-decoration: inherit` on that inline-block gave it the computed `line-through`; the check read the computed value, not painted pixels.

## The baseline of an inline-block whose `overflow` is not `visible` is its bottom margin edge

**Verified at:** CSS 2.2 (W3C), fetched 2026-11-03
**Citation:** [implement_20: https://www.w3.org/TR/CSS22/visudet.html — section 10.8, "Line height calculations: the 'line-height' and 'vertical-align' properties": "The baseline of an 'inline-block' is the baseline of its last line box in the normal flow, unless it has either no in-flow line boxes or if its 'overflow' property has a computed value other than 'visible', in which case the baseline is the bottom margin edge."]

Unless `vertical-align` is set, the bottom margin edge of such an inline-block sits on the text baseline of its line.

## When one of `overflow-x` and `overflow-y` is neither `visible` nor `clip`, a `visible` value on the other axis computes to `auto`

**Verified at:** CSS Overflow Module Level 3 (W3C TR), fetched 2026-11-03
**Citation:** [implement_21: https://www.w3.org/TR/css-overflow-3/ — section 3.1, "Managing Overflow: the overflow-x, overflow-y, and overflow properties": "The visible/clip values of overflow compute to auto/hidden (respectively) if one of overflow-x or overflow-y is neither visible nor clip."] [implement_22: ran `getComputedStyle(list).overflowX` in the browser pane on the Add tab's entity list (class `encounter-add-entities-list`, styled `overflow-y: auto` only) — observed `auto`]

An element styled `overflow-y: auto` alone has a computed `overflow-x` of `auto`.

## A descendant's border box counts in a scroll container's scrollable overflow after its transform

**Verified at:** CSS Overflow Module Level 3 (W3C TR), fetched 2026-11-03
**Citation:** [implement_23: https://www.w3.org/TR/css-overflow-3/ — section 2.2, "Scrollable Overflow": descendant border boxes are included "accounting for transforms by projecting each box onto the plane of the element that establishes its 3D rendering context."] [implement_24: ran a hover on the plus icon of the first row of the Add tab's entity list (`scale: 1.1` on hover, list `overflow-x: auto`), then read `list.scrollWidth` and `list.clientWidth` in the browser pane — observed 157 and 156]

The scaled icon at the list's right edge made `scrollWidth` exceed `clientWidth` by one pixel.

## A right padding on the scroll container removed the overflow of a hover-scaled icon at its right edge

**Verified at:** observation in the app's dev build (`pnpm run web:seed`, Vite 8.3.1), 2026-11-03
**Citation:** [implement_25: ran the same hover and reads as the entry above after setting `padding: 0 0.25rem 0 0` on the entity list — observed `scrollWidth` 156 and `clientWidth` 156]

One reading, on one list with a 24 px icon; it is no general rule about how much padding removes such an overflow.

## Safari supports `animation-timeline`, including its `scroll()` value, from version 26

**Verified at:** MDN browser-compat-data `main`, fetched 2026-11-14
**Citation:** [claude_1: https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/properties/animation-timeline.json — `safari` `version_added` `26` for `animation-timeline` and for its `scroll` value]

This is MDN's compatibility data, not an observation in the app's webview. How the Tauri app's webview relates to the system WebKit is in `tauri.md`.

## In Chromium 156, a custom property registered with `@property` and `inherits: false` on an element is not read by that element's `::-webkit-scrollbar-track` rule

**Verified at:** Chromium 156.0.8078.75 (the Claude desktop app's browser pane, user agent `Claude/5.11492.5 Chrome/156.0.8078.75`)
**Citation:** [implement_26: ran `getComputedStyle(element, '::-webkit-scrollbar-track').marginTop` in the browser pane on an element with `--scroll-edge-fade-track-inset: 0`, the property registered with `syntax: '*'` and `inherits: false`, and a track rule `margin-block: var(--scroll-edge-fade-track-inset-top)` falling back to the element's inset — observed `16px`; after the registration was removed, the same call observed `0px`]

The track rule took the fallback, so the pseudo-element did not see the element's own value of a non-inheriting registered property. An unregistered custom property, which inherits, reached the pseudo-element.

## In Chromium 156, a flex item stretched to a capped row-direction scroll container's height lets its content overflow it, and the container's end padding is then not kept after that content

**Verified at:** Chromium 156.0.8078.75 (the Claude desktop app's browser pane), 2026-11-14; CSS Overflow Module Level 3 (W3C Working Draft, 7 October 2025), fetched 2026-11-14
**Citation:** [claude_2: ran a reproduction in the browser pane — a `display: flex` box with `max-height: 100px`, `overflow-y: auto`, `padding-block: 16px`, `box-sizing: border-box`, holding one item that holds a 300px-tall block, scrolled to its end — observed with the default `align-items`: item height 68, `scrollHeight` 316, 0px between the block's bottom and the box's bottom; with `align-items: flex-start`: item height 300, `scrollHeight` 332, 16px] [claude_3: https://www.w3.org/TR/css-overflow-3/ — section 2.2, "Scrollable Overflow": the scrollable overflow includes "The margin areas of grid item and flex item boxes", and its note says the added padding leaves padding "between the edge of its in-flow (or floated) content" and the box's border edge when scrolled to its end]

The stretched item ends at the box's content edge, and the bottom padding follows the item, not the content overflowing it, so at the end of the scroll the content touches the box's bottom edge. With `align-items: flex-start` the item takes its content's height and the padding follows the content; the spec defines the padding by the item's box, and that the item's own overflow gets none is the observation. How the Tauri app's webview relates to this Chromium build and to the system WebKit is in `tauri.md`.

## `align-items: flex-start` stops a flex item filling a row-direction container's height, unless it fills by `min-height: 100%` in a container of definite `height`

**Verified at:** Chromium 156.0.8078.75 (the Claude desktop app's browser pane), 2026-11-14; CSS Flexible Box Layout Module Level 1 (W3C Candidate Recommendation Draft, 14 October 2025), fetched 2026-11-14
**Citation:** [claude_4: https://www.w3.org/TR/css-flexbox-1/ — section 8.3, "Cross-axis Alignment: the align-items and align-self properties": with `stretch` the used cross size makes the item's margin box "as close to the same size as the line as possible"; with `flex-start` "The cross-start margin edge of the flex item is placed flush with the cross-start edge of the line."] [claude_5: ran a reproduction in the browser pane — a `display: flex` box (row direction), `padding-block: 16px`, `box-sizing: border-box`, `overflow-y: auto` — observed with `height: 100px` and one item holding one line of text: item height 68 under `stretch`, 24 under `flex-start`, 68 under `flex-start` with `min-height: 100%` on the item; with `max-height: 100px` and that item, carrying `min-height: 100%`, beside a 300px-tall sibling that holds the box at its cap: item height 68 under `stretch`, 24 under `flex-start`]

An item that fills the box only by stretching, such as a click area, shrinks to its content under `flex-start`. A percentage `min-height` keeps it filling a box of definite `height`, but not a box capped by `max-height` alone, even while the box sits at its cap. How the Tauri app's webview relates to this Chromium build and to the system WebKit is in `tauri.md`.

## In Chromium 156, `display: -webkit-box` with `-webkit-box-orient: vertical`, `-webkit-line-clamp: 2` and `overflow: hidden` shows a flex item's text on at most two lines and ends the second in an ellipsis

**Verified at:** Chromium 156.0.8078.100 (the Claude desktop app's browser pane), 2026-11-23
**Citation:** [implement_1: ran the queue entry's name element in the browser pane — a flex item with `flex: 1`, `min-width: 0`, `overflow-wrap: anywhere`, 24px line height, 99px wide — observed `clientHeight` 48 for texts whose `scrollHeight` was 72, 168 and 192, an ellipsis at the end of the second line, and the scroll container's `scrollWidth` equal to its `clientWidth` (190) for a 60-character name with no break opportunity]

With `overflow-wrap: anywhere`, a word with no break opportunity wraps at any character instead of overflowing the item, and the clamp then cuts it like any other text. How the Tauri app's webview relates to this Chromium build and to the system WebKit is in `tauri.md`.
