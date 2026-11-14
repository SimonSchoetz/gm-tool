---
paths: ["app/src/**/*.css", "src/**/*.css"]
---

# Stylesheets under `src/`

Whether a component or screen owns a `.css` file at all, and where its CSS goes when a sub-component is extracted, are decided before this file exists — see `app/src/CLAUDE.md` — Styles.

## Scope of `styles/`

`.css` files in `src/styles/` hold variables and globals only.

## A shared global class in `styles/`

A class in `src/styles/` that components apply to their own elements (such as `scroll-edge-fade`) states in its stylesheet's header comment what a consumer owes it, and that comment is read before the class is applied. A consumer option is a modifier class in the class's own stylesheet, never a custom property a consumer's stylesheet sets. A consumer rule never sets a property the class sets on the element that carries it, `padding` shorthand included: the two tie in specificity and the later-loaded stylesheet wins, so a need the class does not meet becomes a new modifier. A scroll box is an element carrying such a class whose height is capped, so that it scrolls. A child stretched to that height loses the box's bottom spacing, because the child's content overflows it and the box's bottom padding then sits inside the overflow instead of after the content. When no child has to fill the box's height, `align-items: flex-start` (which the class does not set) on a flex-row box keeps each child at its content height and is the remedy. When a child must fill the box's height (a click area), `align-items: flex-start` would shrink it and collapse the click area, so the class goes instead on a new wrapper element the component owns: the wrapper takes the height cap (`max-height`, `height`, or `flex: 1` with `min-height: 0` in a sized parent) and is `display: flex; flex-direction: column`, and the original element, unclassed, fills it with `flex: 1`, as `.screens-text-editor-layout--body-scroll` in `app/src/screens/components/ScreensTextEditorLayout/ScreensTextEditorLayout.css` does for `TextEditor`'s container.

## Class naming — flat BEM-ish

- Root element: `block-name` (e.g. `button-wrapper`, `search-input`).
- Modifier: `block-name--modifier` (e.g. `button-wrapper--danger`).
- Never use the BEM element suffix (`__`). There are no `block__element` class names in this codebase.
  - ✅ `search-input`, `search-input--active`
  - ❌ `search-input__icon`, `search-input__field`

## Design token obligation

- All CSS property values in a component stylesheet — a `.css` file outside `src/styles/` — must reference tokens from `styles/variables/` (e.g. `var(--spacing-sm)`, `var(--radius-xl)`). Raw pixel, color, `rem`, and unitless z-index integer values are banned in component `.css` files. A file in `src/styles/` carries no token obligation and no `/* one-off */` marker.
  - ✅ `padding: var(--spacing-sm)`
  - ❌ `padding: 8px`
  - ❌ `color: #ffffff`
- **`/* one-off */` — intentional CSS singularities:** when a raw value does not warrant a design token, because its use-case is narrow enough that the user has decided it need not be reused, mark it with a comment on the same line containing `one-off`; anything further in that comment records why the value was kept, for whoever reads it next. A reviewer who sees the marker on a raw value in a component stylesheet must not file a violation; one in a file under `src/styles/` is filed as a violation, since no obligation exists there for it to exempt. Whether a raw value warrants the annotation is the user's call — never an agent's.
  - ✅ `border-radius: 3px; /* one-off */`
- **Raw values without `/* one-off */` are surfaced to the user after the task completes, not mid-task, and never block the commit — except a value that equals a token of its property's family.** Such a value in a component stylesheet under `app/src/`, outside `app/src/styles/`, is replaced with that token at once and never deferred: `node scripts/css-token-check.ts`, run from the repository root, prints `<value> equals <token>` for each, the families are `TOKEN_FAMILIES` in `scripts/css-token-check-find.ts`, and the `pre-commit` and `pre-merge-commit` hooks reject the commit while one remains. A `/* one-off */` marker exempts the line from that check and stays the user's call: never add one to silence the check, never strip one the user placed — except when the declaration moves into `src/styles/`, where no obligation applies and the marker is dropped with the move. Every other raw value — one that equals no token of its family, or a property in no family — is collected during implementation and reported as file path, line, and value at the end of the task; the user then decides: add a token, add the annotation, or leave it. The deferred state is not a violation; this bullet departs from the shared Best Practices & Code Quality rule beginning "When editing a file for an unrelated task" and from root `CLAUDE.md` — Best Practices & Code Quality, "Active check on touched files", for those other raw CSS values only, since whether such a value is a violation is the user's call.

## A class that sets `display` on an element rendered with `hidden`

The `hidden` attribute hides an element through a user-agent default rule that an author `display` value overrides (`.claude/knowledge/html.md` — "The `hidden` attribute hides an element through a user-agent default rule, which the standard says style sheets can override"). So when a class sets `display` on an element a component renders with `hidden`, the same stylesheet also holds a rule for that class with `[hidden]` that sets `display: none`, or the element stays visible.

## No unilateral additions to `styles/variables/`

Never add a new CSS variable to the variables folder on your own. If a value appears to be reused across components and would benefit from a token, flag it to the user — they decide whether to add it and which file it belongs in. Introduce the value inline (or as a runtime custom property if DB-sourced) in the meantime. This inline fallback is temporary, pending token approval — not a permanent state.

## Custom properties consumed here are declared elsewhere

A `var(--…)` that is not a global token from `styles/variables/` is declared by that component's own `.tsx` on the component's root element, except a static value shared only between rules of one stylesheet, which that stylesheet declares: the `--rt-[component-name]-` prefix marks a DB-sourced runtime value, `--[component-name]-` a static or JS-computed one. Never introduce a DB-sourced or JS-computed one, or re-prefix an existing one, from the CSS side — the declaring rule is `.claude/rules/src-components.md` — Component-scoped custom properties.
