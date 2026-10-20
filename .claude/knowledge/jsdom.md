# jsdom

## jsdom does not compute layout

**Verified at:** jsdom 30.1.1, read 2026-10-20
**Citation:** [instruction-pass_12: app/node_modules/.pnpm/jsdom@30.1.1/node_modules/jsdom/README.md:527-538 — "Layout" is listed as unimplemented; many layout-related properties return zeros]

Many layout-related values, such as `offsetTop`, read as zeros in a jsdom test.

## jsdom 30.1.1 steps a number input only through its `stepUp()` and `stepDown()` methods and has no ArrowUp or ArrowDown key handling

**Verified at:** jsdom 30.1.1, read 2026-10-20
**Citation:** [spec-writer_4: grep ArrowUp app/node_modules/jsdom/lib/jsdom/living --include='*.js' -l — not found; app/node_modules/jsdom/lib/jsdom/living/nodes/HTMLInputElement-impl.js:573-574 — `stepUp(n = 1)` calls `_stepUpdate(n, true)`]

A dispatched `keydown` of `ArrowUp` on a number input therefore leaves its value unchanged in a jsdom test, so no test in this project can pin keyboard stepping.
