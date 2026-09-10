---
paths: ["app/src/**/*.css", "src/**/*.css"]
---

# Stylesheets under `src/`

Whether a component or screen owns a `.css` file at all, and where its CSS goes when a sub-component is extracted, are decided before this file exists — see `app/src/CLAUDE.md` — Styles.

## Scope of `styles/`

`.css` files in `src/styles/` hold variables and globals only.

## Class naming — flat BEM-ish

- Root element: `block-name` (e.g. `button-wrapper`, `search-input`).
- Modifier: `block-name--modifier` (e.g. `button-wrapper--danger`).
- Never use the BEM element suffix (`__`). There are no `block__element` class names in this codebase.
  - ✅ `search-input`, `search-input--active`
  - ❌ `search-input__icon`, `search-input__field`

## Design token obligation

- All CSS property values must reference tokens from `styles/variables/` (e.g. `var(--spacing-sm)`, `var(--radius-xl)`). Raw pixel, color, `rem`, and unitless z-index integer values are banned in component `.css` files.
  - ✅ `padding: var(--spacing-sm)`
  - ❌ `padding: 8px`
  - ❌ `color: #ffffff`
- **`/* one-off */` — intentional CSS singularities:** when a raw value does not warrant a design token, because its use-case is narrow enough that the user has decided it need not be reused, mark it with a `/* one-off */` comment on the same line. A reviewer who sees `/* one-off */` must not file a violation. Whether a raw value warrants the annotation is the user's call — never the implementer's or reviewer's.
  - ✅ `border-radius: 3px; /* one-off */`
- **Raw values without `/* one-off */` are surfaced to the user after the task completes, not mid-task, and never block the commit.** Collect them during implementation and report file path, line, and value at the end of the task; the user then decides: add a token, add the annotation, or leave it. The deferred state is not a violation.

## No unilateral additions to `styles/variables/`

Never add a new CSS variable to the variables folder on your own. If a value appears to be reused across components and would benefit from a token, flag it to the user — they decide whether to add it and which file it belongs in. Introduce the value inline (or as a runtime custom property if DB-sourced) in the meantime. This inline fallback is temporary, pending token approval — not a permanent state.

## Custom properties consumed here are declared elsewhere

A `var(--…)` that is not a global token from `styles/variables/` is declared on the component's root element by that component's own `.tsx`: the `--rt-[component-name]-` prefix marks a DB-sourced runtime value, `--[component-name]-` a static or JS-computed one. Never introduce a new one, or re-prefix an existing one, from the CSS side — the declaring rule is `.claude/rules/src-components.md` — Component-scoped custom properties.
