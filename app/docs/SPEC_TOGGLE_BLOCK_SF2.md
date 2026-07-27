# SF2 — Toggle styles and animation

Gives the structure from SF1 its visual form: the two-column layout, the chevron and its rotation, the body expand/collapse animation, and the hover treatment on the gutter. After this sub-feature a toggle looks correct in both states, but still cannot be created or clicked.

## Files affected

**Modified:**

- `app/src/components/TextEditor/TextEditor.css` — add the toggle block's styles

## Frontend

### `TextEditor.css`

**Purpose** — Editor node styles live in this file, alongside the existing checklist, table, and link node styles. Toggles follow that placement; they are node styles, not component styles, so they do not get their own `.css` file.

Add the toggle rules as a new commented section, matching the section-comment style already used in this file for checklist and link styles.

**Behavior**

Every visual state is driven by the `toggle-node--collapsed` modifier that SF1's `updateDOM` maintains on the root element. No JavaScript touches these styles directly.

**UI / Visual**

Layout — a flex row, so the gutter is a real full-height column beside the content:

- `.toggle-node` — `display: flex`, `align-items: stretch`. The stretch is what makes the gutter span the full height of the toggle including a long body, which is what makes it clickable from anywhere alongside the content.
- `.toggle-gutter` — fixed width `var(--spacing-lg)`, matching the indent `.editor-checklist` already uses. `display: flex`, `justify-content: center`, `align-items: flex-start` so the chevron pins to the top and aligns with the header rather than centering against the whole toggle. `cursor: pointer`, `user-select: none`.
- `.toggle-content` — `flex: 1 1 auto`, `min-width: 0`. The `min-width: 0` is required: without it a wide child such as a table forces the flex item past its container instead of scrolling within it.

Nesting requires no additional rules. A nested `.toggle-node` sits inside its parent's `.toggle-body-inner`, so it inherits the parent's content-column position and indents naturally.

Chevron:

- `.toggle-chevron` — sized `var(--spacing-md)` square, matching the checkbox's box size. Drawn with `background-image` set to a data-URI right-pointing chevron SVG, `background-repeat: no-repeat`, `background-position: center`, `background-size: contain`. This mirrors the checkbox technique already in this file.
- Rotation: the base rule sets `transform: rotate(90deg)` — the expanded state, chevron pointing down. `.toggle-node--collapsed .toggle-chevron` sets `transform: rotate(0deg)` — collapsed, pointing right.
- Transition: `transform var(--transition-fast)` and `opacity var(--transition-fast)` on `.toggle-chevron`.

Do not use `mask-image` to make the chevron recolorable. `background-image` with a fixed fill plus an opacity change is sufficient for the required hover treatment and introduces no dependency on mask support.

Hover — the whole column tints and the chevron brightens together:

- `.toggle-gutter` has a `background-color` transition over `var(--transition-fast)`.
- `.toggle-gutter:hover` sets `background-color: var(--color-hover-bg)`.
- `.toggle-chevron` rests at reduced opacity; `.toggle-gutter:hover .toggle-chevron` raises it to full. Both changes are driven by hovering the gutter, not the chevron, so the entire clickable area gives feedback and the two effects fire together.

Body collapse:

- `.toggle-body` — `display: grid`, `grid-template-rows: 1fr`, `transition: grid-template-rows var(--transition-fast)`.
- `.toggle-node--collapsed .toggle-body` — `grid-template-rows: 0fr`.
- `.toggle-body-inner` — `overflow: hidden`, `min-height: 0`. Both are required for the grid-track animation to actually collapse; without `min-height: 0` the inner element refuses to shrink below its content height.
- `.toggle-node--collapsed .toggle-body-inner` — `visibility: hidden`, with `visibility var(--transition-fast)` added to its transition. This keeps the caret and text selection out of collapsed content. Without it the body is zero-height but still selectable, and SF4's rule that Enter at the end of a collapsed header creates a sibling would be undermined by a caret that can still reach hidden body text.

The `grid-template-rows` technique is required rather than `max-height`: a `max-height` transition runs at a speed that varies with content length, so a short body and a long body would not both complete in `var(--transition-fast)`, and the story requires the body and the chevron to share one timing.

**Raw values with no existing token**

The chevron's resting and hover opacity values have no token in `styles/variables/`, and the gutter's `padding-top` — the small offset that aligns the chevron with the first line of the header rather than the top edge of the block — is a visual-tuning value with no token either. Introduce all three inline and report them to the user at the end of the task with file, line, and value, per the deferred raw-value reporting rule in `app/src/CLAUDE.md`. Do not add tokens to `styles/variables/` and do not apply a `/* one-off */` annotation — both are the user's call, not the implementer's.

The gutter `padding-top` in particular is a value to tune against the rendered result across header types: the header may be a paragraph or any of `h1`, `h2`, `h3`, whose line heights differ.

## Tests

None. This sub-feature changes only CSS, and no helper or util function is added.
