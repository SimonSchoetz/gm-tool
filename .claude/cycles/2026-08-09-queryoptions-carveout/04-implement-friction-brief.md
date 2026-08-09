# Implementation friction brief — SPEC_PREFETCH

Producing role: `implement`. Source spec: `app/docs/SPEC_PREFETCH.md` (+ `SPEC_PREFETCH_SF1.md`–`SF6.md`). Branch: `feat/queryoptions-carveout`.

## Implementation friction

### 1. Pre-implementation baseline tsc failure (unrelated to the spec)

- **What happened**: `npx tsc --noEmit` failed on `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImagePreviewFramingOverlay/ImagePreviewFramingOverlay.tsx` before any spec sub-feature work began. None of the failing files appear in any SF's "Files affected" list.
- **Phase**: pre-implementation phase, baseline-check step.
- **Root cause**: `dimensions` was typed via `React.ComponentProps<typeof ImagePlaceholderFrame>['dimensions']`, a CSS-value type (`Width<string | number> | undefined`) borrowed from a component that only forwards the value into an inline `style` prop. `ImagePreviewFramingOverlay` and its child `IpfoBgImg` do numeric arithmetic (division, offset calculations) on the same value, which genuinely requires plain `number`.
- **How resolved**: classified Major per root CLAUDE.md's Minor/Major triage — fixing it required choosing between two valid designs (narrow the whole `dimensions` prop chain to `{ width: number; height: number }`, vs. a local numeric type in `ImagePreviewFramingOverlay` plus boundary narrowing at the `ImageViewerDialog` call site), not a mechanical field-match. Surfaced to the user via `AskUserQuestion`; user chose to narrow the whole chain. Applied across `UploadImgBtn.tsx`, `ImageViewerDialog.tsx`, `ImagePreviewFramingOverlay.tsx` (including removing the now-unused `ImagePlaceholderFrame` type-only imports), committed as its own `chore(queryoptions-carveout): fix pre-existing errors before spec work` commit before SF1.
- **Source**: pre-existing repo state, unrelated to this spec — not a spec gap and not an implementer reasoning error. A correctly-triaged Major classification per an explicit CLAUDE.md rule (root CLAUDE.md, Tool Use Discipline — baseline-failure triage).
- **Decision made under ambiguity**: which of the two valid fixes to apply — resolved by direct user choice via `AskUserQuestion`, not implementer judgment.

### 2. SF6's literal type sample conflicted with this project's ESLint config

- **What happened**: `mentionPrefetchByType`'s type, copied verbatim from `SPEC_PREFETCH_SF6.md`'s code sample (`Record<string, MentionPrefetch>`), caused ESLint's `@typescript-eslint/no-unnecessary-condition` to flag the same section's required `if (!prefetch) return;` unrecognized-type guard as dead code.
- **Phase**: SF6 implementation.
- **Root cause**: `app/tsconfig.json` does not set `noUncheckedIndexedAccess`, so TypeScript types `Record<string, T>[key]` as always-`T` — never `T | undefined` — regardless of whether the key exists at runtime. The spec's literal type sample is narrower than what its own guard needs.
- **How resolved**: widened the value type to `Record<string, MentionPrefetch | undefined>`. This makes the type accurately reflect runtime reality with no tsconfig change (a much larger, unrelated decision) and no eslint-disable suppression, and it preserves SF6's own stated architectural intent verbatim (KAD: "the lookup must tolerate an unrecognized value") — the fix corrects a code-sample type-accuracy gap, not the spec's decision.
- **Source**: spec quality gap — the code sample under-specifies relative to the toolchain guarantees `/implement` itself requires (zero eslint errors before any commit). Not a reasoning error and not a missing CLAUDE.md rule — `app/CLAUDE.md`'s "code must be valid under the full toolchain configuration, not just type-declaration correct" rule already covers this class of error; the spec sample simply didn't apply it.
- **Decision made under ambiguity**: none required beyond the type-accuracy fix itself — both tsc and eslint were satisfied by the same single change, with no remaining choice between alternatives.

## Process gaps identified during manual fix mode

None — manual fix mode has not yet been entered as of this brief; no bugs have been reported.

## Instruction gaps

None newly surfaced beyond what `SPEC_PREFETCH.md`'s own "CLAUDE.md impact" section already named (see `07-implement-claude-md-impact.md` in this cycle directory). Code-reviewer's cycle-1 output independently confirmed the same three gaps (DAL file-kind enumeration in `app/src/CLAUDE.md`'s State Management section, the `routes/` structure-tree comment, and `MentionPopupContent`/`mentionPrefetchByType`'s un-enforced dual registration) rather than surfacing anything new.

## Concerns

Code-reviewer (cycle 1) flagged that `app/docs/_product/domain-scaffold.md`'s route-file code templates (the copy-paste `createFileRoute(...)` blocks under "### Routes") weren't updated alongside the loader-requirement prose added in the same SF5 edit — a future domain scaffolded by copying the templates verbatim would silently reintroduce the flicker the new prose warns against. This was fixed inline immediately after the review loop exited (commit `c7dbc252`, "sync domain-scaffold route templates with loader requirement") rather than left open, since it directly completed SF5's own stated intent for that file. No disposition needed from the user — already resolved on this branch.
