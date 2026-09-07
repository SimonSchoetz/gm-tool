# HTML

## The `ul` element's content model permits only `li` and script-supporting elements

**Verified at:** HTML Living Standard, fetched 2026-08-06
**Citation:** [refine-claude_5: https://html.spec.whatwg.org/multipage/grouping-content.html#the-ul-element — Content model: "Zero or more `li` elements and script-supporting elements."]

A `button` (or any component rendering one) is not a permitted direct child of `ul` — it is legal only inside an `li` that is itself the `ul`'s child. `li`'s own parent must be `ol`, `ul`, or `menu`. Script-supporting elements means `script` and `template` only. This is invisible to tsc, ESLint, and Prettier: a spec'd or implemented `ul` → `button` nesting produces no toolchain error and must be checked against the content model directly.
