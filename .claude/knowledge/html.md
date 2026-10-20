# HTML

## The `ul` element's content model permits only `li` and script-supporting elements

**Verified at:** HTML Living Standard, fetched 2026-08-06
**Citation:** [refine-claude_5: https://html.spec.whatwg.org/multipage/grouping-content.html#the-ul-element — Content model: "Zero or more `li` elements and script-supporting elements."]

A `button` (or any component rendering one) is not a permitted direct child of `ul` — it is legal only inside an `li` that is itself the `ul`'s child. `li`'s own parent must be `ol`, `ul`, or `menu`. Script-supporting elements means `script` and `template` only. This is invisible to tsc, ESLint, and Prettier: a spec'd or implemented `ul` → `button` nesting produces no toolchain error and must be checked against the content model directly.

## A number input whose text is not a valid floating-point number has the value `''` and suffers from bad input; `1.` and a lone `-` are such text

**Verified at:** HTML Living Standard, fetched 2026-10-19
**Citation:** [spec-writer_3: https://html.spec.whatwg.org/multipage/input.html — Number state: "If the value of the element is not a valid floating-point number, then set it to the empty string instead."; "User agents must not allow the user to set the value to a non-empty string that is not a valid floating-point number."; while the UI holds input the user agent cannot convert, "the control is suffering from bad input"; "The default step is 1"] [spec-writer_4: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html — a valid floating-point number is an optional `-`, then digits and/or a `.` followed by one or more digits, then an optional exponent]

While the user types a partial number such as `-` (before the digits of a negative) or `1.` (before the decimals), `<input type='number'>` reports `value` as `''` and `validity.badInput` as `true`, so `value === ''` alone cannot tell a cleared field from unconvertible text. This is the standard's requirement; whether a given engine (WebKit in the Tauri webview) conforms was not observed.

## `selectionStart`, `selectionEnd`, `selectionDirection`, `setRangeText()` and `setSelectionRange()` do not apply to a number input

**Verified at:** HTML Living Standard, fetched 2026-10-19
**Citation:** [spec-writer_7: https://html.spec.whatwg.org/multipage/input.html — Number state bookkeeping details: "The following IDL attributes and methods do not apply to the element:" listing `selectionStart`, `selectionEnd` and `selectionDirection` and the `setRangeText()` and `setSelectionRange()` methods] [architect_25: https://html.spec.whatwg.org/multipage/input.html#number-state-(type=number)]

Code that reads the caret of an `<input type='number'>` gets no position from it, and calling `setSelectionRange()` on one is outside what the standard lets the element do. `select()`, `stepUp()`, `stepDown()`, `value` and `valueAsNumber` do apply.

## A `label` element may hold phrasing content plus its one labeled control, and without `for` its first labelable descendant is that control

**Verified at:** HTML Living Standard, fetched 2026-10-19
**Citation:** [spec-writer_8: https://html.spec.whatwg.org/multipage/forms.html#the-label-element — Content model: "Phrasing content, but with no descendant labelable elements unless it is the element's labeled control, and no descendant label elements."; "If the for attribute is not specified, but the label element has a labelable element descendant, then the first such descendant in tree order is the label element's labeled control."]

`<label><span>HP</span><input /></label>` is valid markup that makes the input the label's control, so a click on the label text focuses the input with no `for`/`id` pair. A second labelable element, or a nested `label`, inside it is not permitted.
