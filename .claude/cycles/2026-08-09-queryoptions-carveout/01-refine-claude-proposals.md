# Proposals — queryOptions / route-loader carve-out

Batch name: **queryOptions Carve-Out**. Produced by `/refine-claude`, 2026-08-09, Review task mode. Blocking prerequisite for a queued implementation that cannot proceed against the current Barrel Files rule.

## Established facts (coordinator-verified at commit a6b78756)

- The current Barrel Files rule text matches `app/src/CLAUDE.md` exactly.
- `app/src/data-access-layer/foes/useFoes.ts:15-20` declares `queryKey: foeKeys.list(adventureId)` and `queryFn: () => service.getAllFoes(adventureId)` inline inside `useQuery`.
- `app/src/routes/adventure.$adventureId.foes.tsx` exists.
- No route under `app/src/routes/` uses a loader — `grep -rln "loader:" src/routes` returns nothing. The rule has never been exercised against a non-React consumer.
- `queryOptions` is verified at @tanstack/react-query 5.101.2 (installed `^5.101.2`) and already recorded in `.claude/knowledge/tanstack-query.md`, which states it is how one query definition is shared between a hook and a non-React caller such as a router loader. Step 0 satisfied; no re-verification performed.
- `app/eslint.config.js` uses flat-config per-path `files:` blocks (lines 48, 52) and restriction rules (`no-restricted-syntax`, line 35); `.claude/knowledge/eslint.md` records the local-plugin ESM constraint at eslint 10.6.0.

## Q1 — Barrel Files carve-out (head-of-instructions)

**Diagnosis.** Under-specified, not wrong. The "only hooks are exported" clause was accurate for its actual population at authorship time — every DAL consumer was a React component, so "hooks only" and "no raw key leakage" were the same boundary. A route loader is a structurally distinct consumer that cannot call a hook. The protected invariant (keys never leak raw into consuming code) is compatible with permitting a `queryOptions`-built export for that consumer class, since `queryOptions` encapsulates the key rather than exposing it. Structural; CHANGE, amended in place.

**No conflict with the consolidation-kept rule.** The kept-rule reasoning was about whether a general principle already covers query-key privacy (it does not, hence the explicit callout). That is orthogonal to whether "hooks" exhaustively enumerates legitimate export *shapes*. Widening the boundary does not undo the reason the boundary needs writing down.

```
File: app/src/CLAUDE.md
Type: REPLACE
Section: File Organization — Barrel Files
Old: - **Query key factories (`*Keys.ts`) are internal to the DAL module — never in the module barrel's public exports; only hooks are exported (`data-access-layer/domainA/index.ts` exports `useNpc`/`useNpcs`, never `npcKeys`).**
New: - **Query key factories (`*Keys.ts`) are internal to the DAL module and never in the module barrel's public exports.** React components remain hook-only consumers (`data-access-layer/domainA/index.ts` exports `useNpc`/`useNpcs`, never `npcKeys`) — unchanged. A consumer structurally unable to call a hook (e.g. a route loader) may instead consume a `queryOptions`-built factory exported from the barrel: `queryOptions()` produces a typed options object that still encapsulates the key rather than exposing it raw, so exporting its result is not the same act as exporting the key factory.
  - ✅ GOOD: `export const npcQueryOptions = (id: string) => queryOptions({ queryKey: npcKeys.detail(id), queryFn: () => service.getNpc(id) })` exported for a loader; illustrative, not tied to any specific file
  - ❌ BAD: exporting `npcKeys` directly, or a hand-assembled `{ queryKey: npcKeys.detail(id), queryFn: ... }` object bypassing `queryOptions()` — the carve-out permits only a `queryOptions`-built factory, never the raw key or an ad hoc substitute
```

**Size position, stated explicitly:** (a) present as drafted. `app/src/CLAUDE.md` 42,261 → 43,081 of 45,000 (95.7%, 1,919 headroom). Author's reasoning: the rule closes a currently-blocking gap, which is the case growth-is-not-free's own test is designed to pass; the ❌ example guards a real mis-generalization risk (a reader over-reading "a carve-out exists" as "any non-hook export is fine") and cutting it would be the shorten-for-skimmability move the dilution principle prohibits; no established padding exists elsewhere in the file to trade against, per this session's zero-remaining-candidates verdict; and `.claude/reference/` extraction does not fit, since this file is active coding convention consulted during coding, not on-demand agent-process content.

**Author's forward note, not acted on:** this is the second addition to `app/src/CLAUDE.md` this session (R3, now Q1), both individually justified. A third landing soon — not today's number — would be the trigger for a fresh evidence-based consolidation session on this file.

## C1 — Convention Discovery zero-result gap (head-of-instructions)

**Diagnosis.** Convention Discovery states only the search-and-match procedure and is silent on a zero-result outcome. Restatement filter applied against both candidate covering rules: root CLAUDE.md's absence-corollary covers only the *epistemic validity* of the finding (a zero-result grep legitimately proves absence) and says nothing about what to do with that proven absence; `implement.md`'s Ambiguity gate is built around choosing among visible competing candidates or a behavioural tradeoff, and "zero candidates exist, one must be originated" is not cleanly an instance of "more than one valid path" on that rule's own terms. Neither firing condition matches, so this is not a redundant restatement — but the fix needs only the missing procedural link, not new escalation logic. Structural; CHANGE. SIGN accepted — recognizing a first-instance situation and routing to escalation is not compiler-enforceable.

```
File: app/CLAUDE.md
Type: REPLACE
Section: Convention Discovery
Old: search the codebase for at least one existing instance of that same kind of thing and match its convention — even when no reference implementation was named for it.
New: search the codebase for at least one existing instance of that same kind of thing and match its convention — even when no reference implementation was named for it. When the search returns no existing instance, the resulting design choice is ambiguous per `implement.md`'s Ambiguity gate — surface it rather than originating a new convention silently.
```

Projected: `app/CLAUDE.md` 15,844 → 16,031 of 45,000.

## G1 — First-instance convention completeness gate (head-of-agents)

**Diagnosis.** Convention Discovery's implementer-facing mechanism has no branch for zero existing instances, and on the spec-writing side nothing distinguishes "this construct is a repeated pattern, safe to point at convention" (normal, correct brevity) from "this construct is a first instance, and pointing gives the implementer nothing to find." Structural; CHANGE.

**Standalone justification.** The author initially framed this as complementary to C1 and corrected that on challenge: the gate operates entirely on the spec-writer side and delivers full value regardless of whether any CLAUDE.md-side change lands, because it removes the scenario upstream rather than handling downstream fallout. C1's author independently confirmed the reverse direction — C1 stands alone too, and covers a case G1 cannot reach (a spec judged complete under G1, with an implementer still hitting an unrelated zero-result grep for an ancillary detail the spec never anticipated). Two self-sufficient layers, no dependency in either direction.

```
File: .claude/reference/spec-writer-gates.md
Type: ADD (appended after the Assertion value derivation row)
New row: | First-instance convention completeness | a spec introduces a construct instantiating a recurring codebase pattern — the kind of construct `app/CLAUDE.md`'s Convention Discovery rule would otherwise require the implementer to find and match — for which a codebase search finds zero existing instances (e.g. a new cross-layer sharing mechanism, a new export shape for an established internal-only construct) | the spec must state, specifically for this construct rather than by reference to an existing pattern (none exists to reference): its file placement, the exact name of every exported symbol, its exact shape (signature, parameters, what it wraps or composes), and which layer may import or call it versus which may not. A spec satisfying only some of these four, or expressing any of them as "follow existing convention," "match the pattern used elsewhere," or leaving it to implementer discretion, has not satisfied this gate — partial specification is not compliance, since the implementer has no independent source to fill the gap from | app/CLAUDE.md — Convention Discovery |
```

Projected: `.claude/reference/spec-writer-gates.md` 17,920 → 19,008 of 26,000 (73%).

## No-change verdicts

- **G2 — `spec-writer.md` body.** No change. General gate 1 (Convention compliance, outward) already routes correct application of whatever the corrected Barrel Files rule states, and G1's completeness obligation subsumes specifying where the shared factory lives and how it is structured. A second statement in `spec-writer.md`'s body would dilute G1, not add coverage. Verified against file content.
- **G3 — `implement.md`.** No change. The Ambiguity section's general rule structurally covers an implementer meeting an under-specified construct without naming first-instance patterns. Separately confirmed the existing Async ownership gate row never reached a router loader at all — a loader is neither a screen nor a component — so that row was never in tension with this pattern.

## Tracked application-code follow-up (Criterion 4)

`task_6e608fcc` — a path-scoped ESLint restriction permitting `*QueryOptions` imports only in route files. Arises from the SIGN classification head-of-instructions applied to Q1 proactively: nothing structurally prevents a component importing the new exported factory and bypassing its wrapping hook. The coordinator verified the config mechanism exists (per-path `files:` blocks, existing restriction rules, local-plugin support) but explicitly did not verify that any rule form can express the `*QueryOptions` match — that determination is the task's, and the task is instructed to recommend against the rule if no non-fragile form exists, and to report as premature if no `*QueryOptions` export has landed yet.
