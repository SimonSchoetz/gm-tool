# Spec quality brief — SPEC_PREFETCH

Producing role: `implement`. Source spec: `app/docs/SPEC_PREFETCH.md` (+ `SPEC_PREFETCH_SF1.md`–`SF6.md`). Branch: `feat/queryoptions-carveout`.

## Over-specified

None identified. SF2's per-domain substitution tables and SF4/SF5's route-loader substitution tables were used exactly as intended — read the table row, apply the named reference pattern, no reproduced boilerplate beyond what a substitution table already requires.

## Under-specified or wrong

- **`SPEC_PREFETCH_SF6.md`'s `mentionPrefetchByType` code sample** declares `Record<string, MentionPrefetch>`. Under this project's `tsconfig.json` (no `noUncheckedIndexedAccess`), that type makes `mentionPrefetchByType[entityType]` always-defined to `tsc`, which makes ESLint's `@typescript-eslint/no-unnecessary-condition` flag the same section's required `if (!prefetch) return;` guard as dead code. The type should have been `Record<string, MentionPrefetch | undefined>` from the start — the spec's own KAD text ("the lookup must tolerate an unrecognized value") already implies this; the code sample just didn't carry it through to the type declaration. See `04-implement-friction-brief.md` item 2 for the full resolution.

## Decisions vs. substitutions

Per SF, classifying whether the spec's content was a decision (non-obvious choice the implementer could not derive), a substitution (name-only change from a named reference), or mixed:

- **SF1** — mixed. The `QueryClient` hoisting itself (ownership move out of the provider component, `context: { queryClient }` on the router, provider placement in `main.tsx` rather than `App.tsx`) is a decision. The `TanstackQueryClientProvider.tsx`/`routes/__root.tsx` edits that follow from it are near-mechanical once the decision is stated.
- **SF2** — substitution. The reference implementation (`foeQueryOptions.ts`) plus the two substitution tables (list, detail) fully determined every other domain's factory. Zero implementer judgment was required beyond the file-naming pattern, which the spec didn't restate because it was already established by the existing `*Keys.ts` convention in each domain.
- **SF3** — decision. The placeholder-reuses-the-loaded-image's-block-class approach (`image-by-id image-by-id--pending` rather than a fresh class) is the non-obvious choice — it's what makes the box geometry identical across the pending→resolved swap. The CSS addition itself is a one-line mechanical consequence once that's stated.
- **SF4** — substitution. The reference implementation (`adventure.$adventureId.foes.tsx`) plus the substitution table fully determined every other list route. The `adventures.tsx` exception (single query, no `Promise.all`) was explicitly called out rather than left for the implementer to notice on their own.
- **SF5** — mixed. The loader bodies are substitution (reference + two tables, entities-with-image vs. entities-without). `ensureImagePainted`'s existence and its `ensureQueryData()`-then-`decode()` two-step shape is a decision — the spec explains why `ensureQueryData` alone is insufficient (it resolves a url, not a painted bitmap).
- **SF6** — mixed. The eight `mentionPrefetchByType` entries are substitution (table-driven, one row per mention entity type). The hook's `.catch()`-swallowing contract and the `handleBadgeMouseEnter` placement (guard, then prefetch, then timer registration) are decisions, and both were correctly flagged in the spec as needing an inline code comment at the call site per the SF self-containment rule — the placement is load-bearing but looks arbitrary without it.

## Format observations

None. The split-file format (root index + 6 SF files) tracked cleanly against the sub-feature implementation loop with no cross-file navigation friction — each SF file was self-contained enough to implement without re-reading the root index mid-SF, and the Key Architectural Decisions section in the root file supplied exactly the cross-cutting rationale (image readiness split by surface, freshness-option carry-through, loaders-not-preloading) that individual SF files needed to reference inline.
