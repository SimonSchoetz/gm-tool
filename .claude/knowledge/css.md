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
