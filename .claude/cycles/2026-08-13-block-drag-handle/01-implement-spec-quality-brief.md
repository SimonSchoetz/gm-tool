# Spec Quality Brief — Block Drag Handle

Source spec: `app/docs/SPEC_BLOCK_DRAG_HANDLE.md`. Implementation session ran with zero friction — all sub-features (one, "Block Drag Handle Plugin") implemented as specified, baseline and per-sub-feature `tsc`/`eslint`/`prettier` checks passed on first attempt, and the code-reviewer cycle-1 pass returned zero violations and zero concerns, closing the review loop immediately with no architect or spec-writer invocation needed.

## Over-specified

None. Full file bodies were reproduced for `BlockDragHandle.tsx`, `BlockDropIndicator.tsx`, `isOnMenu.ts`, and the barrel files (`components/index.ts`, `helper/index.ts`, `plugins/index.ts` addition), but each of these files is small enough (3–10 lines of actual logic) that the full body *is* the decision — there was no derivable boilerplate beyond what the spec's Key Architectural Decisions section already justified (e.g. `ref`-as-prop instead of `forwardRef`, the fixed CSS base position dictated by Lexical's own frame-by-frame style overwrites). No section reproduced content that a mechanical substitution table could have replaced instead.

## Under-specified or wrong

None found. No gap in the spec caused an implementation-time decision, a failed check, or a review-loop finding.

## Decisions vs. substitutions

- `BlockDragHandlePlugin.tsx` — mixed. The `registerRootListener`-inside-`useEffect` pattern (avoiding `react-hooks/set-state-in-effect`) is a genuine decision, verified via toolchain execution and cited in `.claude/knowledge/eslint.md`/`.claude/knowledge/lexical.md`. The two-`useRef` wiring pattern (each ref passed both to the Lexical plugin prop and to the sub-component's own `ref` prop) is a substitution, explicitly named in the spec as matching Lexical's own shipped `DraggableBlockPlugin/index.tsx` reference implementation.
- `BlockDragHandle.tsx` / `BlockDropIndicator.tsx` — decision: `ref` as an ordinary `Props` field, the first instance of this pattern in the codebase (spec noted no existing instance to follow, so it specified the full shape rather than pointing at a reference).
- `BlockDragHandle.css` / `BlockDropIndicator.css` — decision, not stylistic: the `position: absolute; left: -10000px; top: -10000px;` base and the prohibition on declaring `top`/`left`/`transform`/`opacity`/`display`/`width` are dictated by `DraggableBlockPlugin_EXPERIMENTAL`'s own inline-style overwrites (verified against the library's `.dev.mjs` source), not a design choice — full reproduction was necessary since no substitution table could express "these exact properties, no others."
- `isOnMenu.ts` + its test — decision (the predicate itself, `.closest('.block-drag-handle')`) with a fully specified two-case test list; both trivial enough that spec-level derivation vs. reproduction is a non-issue.
- `plugins/index.ts`, `TextEditor.tsx`, `TextEditor.css` changes — pure substitution: mechanical additions following each file's own pre-existing convention (barrel entry ordering, `!readOnly &&` gating pattern, `position: relative` addition).

## Format observations

None. The Key Architectural Decisions section correctly front-loaded both non-obvious gotchas that would otherwise have surfaced as review-loop or runtime friction — the `react-hooks/set-state-in-effect` trap on `anchorElem`, and the `anchorElem` `position: relative` requirement for Lexical's `translate()` math — each backed by a toolchain-execution or source-read citation. No section ordering or missing-section issue observed.
