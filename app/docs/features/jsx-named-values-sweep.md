# JSX named values

**Purpose.** Every component under `app/src/` declares the derived values and event handlers its JSX uses as named consts above its return and passes them by name, so markup stays flat, a logic change leaves the markup untouched, and an agent copying the nearest component copies that form instead of the inline one. A local lint rule keeps the inline form from coming back.

**Users.** The developer and the agent sessions working in this checkout, not the GM: the convention and its lint rule are development tooling and change nothing the GM sees.

## How it works

Happy path:

1. A component declares each derived value its JSX uses — an array-method result, a `?:`, a call, a built object or array — and each event handler as a named const directly above its return, and its JSX references the const by name. A bare prop or hook value is passed directly, and a handler that only forwards its argument is not wrapped.
2. A `className` or `style` value stays in the JSX. Inside a `.map` or `.flatMap` callback, the JSX the callback returns stays inline, and so does a handler or value that reads a variable the callback declares, its parameters and its body's locals alike. A value in children position (`{cond ? <A /> : null}`, `{items.map(…)}`) is outside the convention.
3. A const that computes a value from more than one statement or a branch, and writes nothing, lives in a `helper/` folder of its component with a test. A const that holds a handler stays whole in the component file, its `?:` included, and so does one whose branches nest JSX.
4. The lint rule `local/no-inline-jsx-values` runs with the other lint rules over every `.tsx` under `app/src/` outside `__tests__/`, and reports an attribute whose braced value is an inline function (a handler message) or an inline call, `?:`, object or array (a derived-value message), looking through an `as`, `satisfies`, `!` and an optional call around it. `className` and `style` are matched by exact attribute name.
5. A file the work touches is checked against every other convention that applies to it, and its violations are fixed in the same pass.

Failure:

- An inline value in an attribute is a lint error at `error` level, reported on the attribute: "Declare this inline function as a named const above the return and pass it by name" for a handler, "Declare this derived value as a named const above the return and pass it by name" for a derived value, each naming the rule file `src-components` and its Component Internals section. The pre-commit hook runs lint, so the commit is refused.
- A handler hoisted above an early return would lose the narrowing the return established, so a hoisted const sits after every early return and every hook call.
- A handler that reads only a variable declared in the attribute's own expression, such as an inline arrow's own parameter, is reported even inside a `.map` callback.

Where the user waits: nowhere. The rule runs with the other lint rules.

## Data

- **Reads:** the source of every `.tsx` file under `app/src/` outside test folders, as a syntax tree, and each file's variable scopes, to decide whether an attribute value reads a callback's variable.
- **Writes:** nothing; the rule only reports.

## Rules

| Rule | Why | Source |
| --- | --- | --- |
| Every `.tsx` under `app/src/` outside `__tests__/` follows the convention, not only the files a change touches: no derived value (an array-method result, a `?:`, a call, a built object or array) and no arrow function is an inline JSX attribute value, except a `className` or `style` value, a bare prop or hook value, JSX returned by a `.map`-style callback, and a handler or value inside such a callback that reads the callback's item; a value in children position is outside it | — | Simon Schötz, 2026-11-10; `no-inline-jsx-values.test`, `scoped-rules-canary.test` |
| A local ESLint rule reports an inline function, call, `?:`, object or array as a JSX attribute value, for every `.tsx` under `app/src/` outside tests, at `error`, with no disable comment added for it, so `npx eslint . ../scripts` from `app/` exits 0 | Prevents drift for good, and the lint passing over all of `app/src/` is the evidence the tree follows the convention | proposed by Claude, accepted by Simon Schötz, 2026-11-10; `no-inline-jsx-values.test`, `scoped-rules-canary.test` |
| The rule's item-reading exemption covers callbacks of `map` and `flatMap` only, and counts a reference to any variable declared inside the enclosing callback, its parameters and its body's locals, but never a variable declared inside the attribute's own expression | A value derived from the item is still an item read, and a handler reading a callback-local cannot be hoisted above the component's return, so reporting it would force a sub-component per case; the rule follows the convention's ".map-style" wording | Simon Schötz, 2026-11-10; `no-inline-jsx-values.test` |
| Every file the work touches is checked against every other convention that applies to it, and its violations are fixed in the same edit pass, or in a preceding `chore(<branch>):` commit when one is large enough to obscure the work | Follows the project rule as written; more robust than fixing one rule only | proposed by Claude, accepted by Simon Schötz, 2026-11-10; no test |
| Every check row whose trigger holds (type-check, lint, format-check, test, mutation-check, and markdown-lint and css-token-check when their paths are touched) passes on the branch | — | Simon Schötz, 2026-11-10; no test |
| Naming a value or handler changes no user-visible behaviour, text or layout: every screen renders and its handlers (clicks, inputs, drag-reorder, add actions) do what they did without the named const; live Name-column resize on the Sessions and Encounters lists is left to a hand test in the Tauri app, since the browser pane's dispatched drags showed the rows not following live | A convention refactor; a visible change would be a separate feature | Simon Schötz, 2026-11-10; hand test |

## Open points

None in the open-questions register.

## Where to look

- Lint rule: `no-inline-jsx-values` in the project's local ESLint rules, wired in `eslint.config.js` (the `local` plugin map and one block over `src/**/*.tsx` outside `__tests__/`).
- Convention: the Component Internals section of the `src-components` rule file, whose ✅ example `SessionStepsNav` follows.
- Tests: `no-inline-jsx-values.test` (the deciding functions and the rule's valid and invalid cases) and `scoped-rules-canary.test` (the project config reports an inline arrow in a `src` component file and not in a `src` test file).
