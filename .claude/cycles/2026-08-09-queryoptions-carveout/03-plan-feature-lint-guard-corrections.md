# Corrections to tracked follow-up `task_6e608fcc` (queryOptions import-boundary lint guard)

Produced during a `/plan-feature` session for the prefetching story ("As GM, I want a UI that does not flicker because of short loading times"). That session's Step 2 architecture review is what will create the first `*QueryOptions` factories in the codebase, which makes it the first session in a position to evaluate the follow-up task's premises against real consumers.

## Status: premature as of this writing — do not run yet

The task's own scope note requires confirming at least one `*QueryOptions` export has landed before implementing. It has not.

`[plan-feature_21: grep -rn "QueryOptions" app/src --include=*.ts --include=*.tsx — not found]`

Re-run the task only after the prefetching feature's implementation has landed its query-options factories. At that point roughly twelve will exist (one per data-access-layer module backing a route), along with the route loaders that consume them, so the rule can be evaluated against real code rather than a scratch file.

## Correction 1 — the allowlist in the task brief is wrong and would break the data-access layer

The task specifies "a path-scoped ESLint rule permitting imports of `*QueryOptions` symbols only from route files, and forbidding them in components and screens."

Route files are not the only legitimate consumer. The entire point of extracting a `queryOptions`-built factory is that one definition serves both the route loader and the existing hook — the hook is rewritten to consume the same object rather than declaring `queryKey`/`queryFn` inline. So `data-access-layer/<domain>/use<Entity>.ts` imports its own sibling factory, and a route-files-only allowlist fires on the data-access layer itself.

Correct boundary:

- **Permitted**: `src/routes/**` and `src/data-access-layer/**`
- **Forbidden**: `src/screens/**` and `src/components/**`

The prohibited act this guard exists to prevent is a screen or component importing a factory and calling `useQuery` with it directly, bypassing the wrapping hook — which would violate `app/src/CLAUDE.md`'s existing rule that screens and components own no async logic.

## Correction 2 — `no-restricted-imports` cannot express this constraint

The task lists `no-restricted-imports` as one of three live candidates. It is not viable here, for a structural reason specific to this codebase rather than a limitation of the rule.

`no-restricted-imports` discriminates on the module specifier. Under `app/src/CLAUDE.md`'s barrel convention, external consumers import from exactly one level — so `npcQueryOptions` and `useNpc` both arrive from the identical specifier `@/data-access-layer`. There is no specifier that distinguishes the permitted import from the forbidden one, and restricting that specifier would ban every hook import in the app.

This eliminates one of the three candidates without settling the remaining two. Still to be evaluated by the task itself:

- `no-restricted-syntax` with an esquery selector matching the imported symbol name (e.g. an `ImportSpecifier` whose `imported.name` ends in `QueryOptions`)
- a local rule under `eslint-rules/`

Both mechanisms are already wired in `app/eslint.config.js`: `no-restricted-syntax` is configured with a `selector` key at line 35, and a local plugin rule is registered and active (`local/no-wrapped-line-comments`). Per-path scoping via `files:` config blocks is likewise already in use.

## Correction 3 — known coverage hole to name in the evaluation, not discover during it

A selector matching an import specifier's name catches direct imports and aliased imports (aliasing does not defeat it, since `imported.name` holds the original exported name, not the local binding). It does **not** catch a namespace import — `import * as dal from '@/data-access-layer'` followed by `dal.npcQueryOptions(id)`.

This is probably an acceptable gap rather than a disqualifying one: no file in `src/` currently imports the data-access layer that way. But the task's evaluation gate asks whether a rule form can express the constraint "without excessive fragility," and that judgment must be made with this hole stated explicitly. Discovering it after shipping the rule would be a worse outcome than accepting it deliberately up front.

## What is unchanged

The task's evaluate-before-building instruction stands exactly as written, including its statement that a written recommendation *not* to add the rule is a successful outcome. Nothing in these corrections argues for or against shipping the guard — they remove one dead candidate, fix an allowlist that would have produced false positives on the data-access layer, and surface one coverage limit early.
