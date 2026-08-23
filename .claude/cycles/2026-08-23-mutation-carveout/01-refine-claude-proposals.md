# Proposals — deferred-dispatch mutation carve-out

Session: 2026-08-23. Mode: Retrospective. Branch at time of session: `fix/cross-entity-description-overwrite`. HEAD: `4f9b28c6`.

Input: pasted friction brief (no cycle-directory artifact existed for this cycle at session start, so the Retrospective-mode pre-write verdict gate does not apply — there was no `/implement` friction brief, spec quality brief, or spec-writer artifact on disk to verdict against).

Teammates: `head-of-instructions` (CLAUDE.md files), `head-of-agents` (`.claude/agents/`, `.claude/commands/`).

**Status: presented to the user for approval. Not applied at time of writing.**

## Originating friction (summary, self-contained)

A cross-entity data-loss bug: editing Foe A's description, then navigating to Foe B, silently overwrote Foe B's description with Foe A's content. Nine data-access-layer hooks debounce their auto-save through `setTimeout`. TanStack Router resolves same-route-pattern param changes (`/foe/$foeId` → `/foe/$otherFoeId`) without remounting the matched component, so the hook's component instance is reused for a different entity. `useMutation` creates one `MutationObserver` per call site and a `useEffect` calls `observer.setOptions(options)` on every render where the options identity changes, repointing `mutationFn` to whatever entity id is current on that render. A `mutationFn` closing over `foeId` therefore does not stay pinned to the id current when the debounce was scheduled. Technical citation trail: `.claude/knowledge/tanstack-query.md`.

The rule at `app/src/CLAUDE.md` banned id-as-call-time-parameter unconditionally ("always wrong"). The correct fix — `mutate({ id, data })` with the id captured by the deferred closure at schedule time — read as a rule violation, despite that exact shape already being in use, uncontaminated by the bug, at `app/src/data-access-layer/session-steps/useSessionSteps.ts` (lines 42-45 and 96-101). The implementer instead bypassed `useMutation` entirely, hand-wiring `useErrorBoundary`/`showBoundary` and hand-writing cache invalidation as `.then()` blocks across nine files, discarding the codebase's `throwOnError`-bubbling idiom. It worked but was the wrong shape. Crucially, the rule/correctness tension was reasoned about internally and never surfaced for a decision.

## Coordinator-verified facts

- Rule located at `app/src/CLAUDE.md:277-279`; text matches the brief verbatim.
- Nine duplicated comments confirmed present in the working tree — `grep -rn "call-time variable" app/src/data-access-layer/` returns exactly 9 hits (`adventures/useAdventure.ts:89`, `encounters/useEncounter.ts:90`, `factions/useFaction.ts:102`, `foes/useFoe.ts:95`, `items/useItem.ts:95`, `locations/useLocation.ts:105`, `npcs/useNpc.ts:95`, `pcs/usePc.ts:95`, `sessions/useSession.ts:92`), verbatim identical but for the entity name.
- `useSessionSteps.ts` reference implementation confirmed by direct read.
- `.claude/cycles/` contained only `2026-08-08-encounters-retro`, `2026-08-09-queryoptions-carveout`, `2026-08-22-pnpm-claude-md-sync` at session start — none for this branch or cycle.
- `implement.md` ordering: Delivery ("creating the directory first if it does not already exist") and Manual fix mode ("After both briefs are produced, enter manual fix mode") together establish the cycle directory is created _before_ manual fix mode. Its absence therefore indicates this episode did not reach manual fix mode inside an `/implement` session.
- `spec-writer.md:14` states CLAUDE.md files "are loaded into context by the harness" — root CLAUDE.md content is co-present in every spec-writer invocation.
- `app/src/CLAUDE.md`, root `CLAUDE.md`, and `.claude/agents/spec-writer.md` are all LF-only and contain zero non-BMP characters, so `(Get-Content -Raw <path>).Length` is a valid character count for each.

## Phase 1 — Agreed diagnosis

**F1 — rule-content gap.** `app/src/CLAUDE.md:277-279` states an unconditional ban with no carve-out for deferred-closure dispatch on a reusable component instance, so a correct, already-precedented shape reads as a violation. Not tooling-enforceable: the `MutationObserver` repointing behavior is a runtime semantic invisible to tsc, eslint, and vitest. Both teammates independently reached this; `head-of-agents` referred it as out of its scope.

**F2 — surfacing gap.** No rule instructed surfacing a perceived conflict between a codified rule's literal wording and the implementation correctness actually requires. Root CLAUDE.md's nearest rule is scoped to linter/compiler findings by its own text and ESLint/Clippy examples, so its conditions never activated. A scope gap in an existing rule, not a missing rule.

**Not a shared root cause.** F1 is "what is allowed"; F2 is "what to do when a rule appears to forbid the correct thing." Fixing either alone leaves the other class open.

**The nine duplicated comments are corroborating evidence for F1's placement, not a separate item** — both teammates reached this independently, invoking root CLAUDE.md's "a comment that would need to be duplicated in more than one file is not a comment — it is a missing CLAUDE.md rule."

## Phase 2 — Proposals

### F1 — `app/src/CLAUDE.md` (head-of-instructions)

Section: State Management & Error Handling — TanStack Query pattern — Non-negotiable rules. Type: REPLACE.

**Old:**

```text
- **Mutations close over construction-time arguments — never accept them at call time.** When a `useMutation` hook requires an entity identifier that is known when the hook is constructed (e.g., `npcId`, `sessionId`, `adventureId`), capture it in the hook's closure — never declare it as a parameter of `mutationFn`. A `mutationFn` that accepts an id parameter when that id was already available at construction time is always wrong.
  - ✅ GOOD: `const useDeleteNpc = (npcId: string) => useMutation({ mutationFn: () => npcService.deleteNpc(npcId) })`
  - ❌ BAD: `const useDeleteNpc = (npcId: string) => useMutation({ mutationFn: (id: string) => npcService.deleteNpc(id) })`
```

**New:**

```text
- **Mutations close over construction-time arguments — never accept them at call time — except when dispatch itself is deferred past construction.** When a `useMutation` hook requires an entity identifier known at construction and the mutation dispatches synchronously, inside the same event handler, capture it in the hook's closure — never declare it as a parameter of `mutationFn`. Carve-out: when dispatch is deferred past construction — scheduled via `setTimeout`, a debounce wrapper, or equivalent — on a hook whose component instance can be reused for a different entity before the callback fires (e.g. a route param change without remount), give `mutationFn` an `{ id, data }` parameter and pass the identifier through `mutate({ id, data })`, captured by that closure at schedule time, not read from `mutationFn`'s own closure — see `.claude/knowledge/tanstack-query.md`. Test: same synchronous call stack that read the identifier → closure-capture, id-as-parameter still always wrong; identifier read inside a callback scheduled to fire later → that callback must capture it and pass it through `mutate()`'s variables. Either shape keeps the hook's return type a named wrapper per the rule below — this carve-out touches only `mutationFn`'s parameter shape and the `mutate()` call, never the hook's return type.
  - ✅ GOOD (synchronous dispatch): `const useDeleteNpc = (npcId: string) => useMutation({ mutationFn: () => npcService.deleteNpc(npcId) })`
  - ❌ BAD (synchronous dispatch): `const useDeleteNpc = (npcId: string) => useMutation({ mutationFn: (id: string) => npcService.deleteNpc(id) })`
  - ✅ GOOD (deferred dispatch): `mutationFn: ({ id, data }: { id: string; data: UpdateStepInput }) => service.updateStep(id, data)`, dispatched via `mutate({ id: stepId, data: accumulated })` from inside a `setTimeout`-scheduled debounce closure that captured `stepId` at schedule time
  - ❌ BAD (deferred dispatch): `mutationFn: (data: UpdateStepInput) => service.updateStep(stepId, data)` reading `stepId` from the hook's own closure — a re-render that changes `stepId` after the `setTimeout` was scheduled but before it fires repoints the write at the new id, not the one being edited when the debounce started
```

**Why:** Closes F1. States the firing condition as a checkable-by-inspection test (same synchronous call stack vs. a callback scheduled to fire later) rather than a vague distinction, and gives both GOOD/BAD pairs for each side.

**Contradiction check (head-of-instructions):** No contradiction with "Hook return functions are typed to the caller's contract — never expose TanStack Query internals" (`app/src/CLAUDE.md:283`). That rule governs what a hook _returns_; the carve-out governs only `mutationFn`'s internal parameter shape and the internal `mutate()` call site. The final clause of the New: text states this explicitly to stop a future reader inferring the carve-out licenses exposing `mutate` itself.

**Measurement:** 43299 → **44846** (delta +1547, headroom 154 against the 45000 ceiling). Verified in the projected file: old block matched exactly once; all 4 example bullets present; knowledge pointer present; return-type clause present; zero non-BMP.

### F2 — root `CLAUDE.md` (head-of-instructions)

Section: Best Practices & Code Quality. Type: REPLACE.

**Old:**

```text
- **When a linter or compiler finding conflicts with an intentional design goal, surface the conflict — never comply silently.** Automated checks are heuristics, not commands. State what the rule flags, what design goal the code serves, and the options — let the user decide. If suppressing, apply the narrowest suppression with an inline explanation:
```

...and the final sub-bullet:

```text
  - Silent removal or suppression without surfacing the conflict is always wrong.
```

**New:**

```text
- **When a codified project rule — an automated linter/compiler finding, or a CLAUDE.md-documented convention — conflicts with an intentional design goal or with the implementation actually required for correctness, surface the conflict — never resolve it silently in code.** Automated checks and written conventions are both heuristics, not commands, when a case arises they didn't anticipate. State what the rule flags, what design goal or correctness requirement the code serves, and the options — let the user decide. For an automated tool finding, if suppressing, apply the narrowest suppression with an inline explanation:
```

...and the final sub-bullet becomes two:

```text
  - For a CLAUDE.md-documented convention, there is no suppression mechanism — state the rule's exact text, the conflicting requirement, and the implementation options, then wait for the user's decision before writing either path.
  - Silent removal, suppression, or an unsurfaced workaround chosen to route around the conflict is always wrong.
```

The ESLint and Clippy sub-bullets between them are unchanged.

**Why:** Closes F2 by broadening an existing rule's trigger rather than adding a parallel rule. The ESLint/Clippy suppression mechanics stay scoped to actual tool findings, since a CLAUDE.md rule has no suppression syntax. The "unsurfaced workaround chosen to route around the conflict" clause is the one that names this episode's actual mechanism.

**Contradiction check (head-of-instructions):** None elsewhere in root CLAUDE.md. "When the user opts for an approach that conflicts with documented best practices" governs a different trigger (the user's choice vs. framework best practice). "Immediate Application of Corrections" governs behavior after a correction is reached, not whether to surface a conflict.

**Measurement:** 28304 → **28844** (delta +540, ceiling 32000). Both replacement targets matched exactly once each. Note this crosses the 90% proximity threshold (28800) — the next proposal touching root CLAUDE.md triggers the projection gate.

### F3 — `.claude/agents/spec-writer.md` (head-of-agents)

Section: Behavior Rules. Type: REPLACE. **Discovered by Proposal Quality Gate Criterion 6 — a contradiction created by F2, not present in the original input.**

**Old:**

```text
- If a detail can be resolved by reading CLAUDE.md or existing codebase patterns, resolve it silently — do not ask the user
```

**New:**

```text
- If a detail can be resolved by reading CLAUDE.md or existing codebase patterns, resolve it silently — do not ask the user. Exception: when resolving it this way would mean writing a spec that implements something CLAUDE.md's own text conflicts with on correctness grounds, that is not a resolvable detail — state the rule's exact text, the conflicting requirement, and the implementation options, then wait for the user's decision before writing the spec either way.
```

**Why:** The current bullet, paired with the next line ("If a detail cannot be resolved from available context, surface it as an explicit question"), presents an apparently exhaustive binary with no branch for a detail that is textually resolvable but whose resolution conflicts with correctness. That is precisely this episode's failure shape: a rule read as fully dispositive, silently applied, without surfacing the conflict it created. Without this, F2 would ship alongside a rule pointing the opposite direction on the same trigger.

**Measurement:** 24237 → **24582** (delta +345, headroom 1418 against the 26000 ceiling, 94.55%). Old block matched exactly once; zero non-BMP; LF-only.

## No-change findings

**`head-of-agents` — `.claude/commands/implement.md`: no change.** Its own Behavior Rules fire: "Adding a more specific restatement of a rule that already failed is permitted only with an explicit statement of why dilution is not the cause and why a second statement will fire where the first did not." The condition was met and the required statement was not supplied — assertion of a mechanism is not establishing one. It had originally diagnosed a scope gap in `implement.md`'s Engineering Validity check (textually limited to spec/spec-writer output, so it could never fire on implementer-authored code) and withdrew it after the cycle-directory evidence showed the episode most likely occurred outside `/implement` entirely, where `.claude/commands/` files do not load at all.

**`head-of-agents` — `.claude/agents/architect.md`: no change.** The existing four-outcome verdict structure and `RULE NEEDS REFINEMENT`/`BOTH` routing worked as designed when architect was spawned. It considered mandating an architect spawn on every manual-fix-mode bug fix and rejected it as disproportionate to that mode's fast-iteration intent.

**`head-of-instructions` — no `implement.md` companion fix.** It initially recommended one and withdrew it, naming its own inconsistency: it used the cycle-directory absence to rule out manual fix mode, then recommended a manual-fix-mode-scoped fix in the same response. It confirmed the supporting "attention competition" argument had no evidence behind it.

## Contradictions found and how they resolved

**F2 ownership (round 1).** `head-of-instructions` diagnosed a scope gap in root CLAUDE.md's linter/compiler surfacing bullet (behavioral); `head-of-agents` diagnosed a scope gap in `implement.md`'s Engineering Validity check (structural). Resolved by coordinator-established evidence, not argument: `.claude/cycles/` contains no directory for this branch, and `implement.md` requires the directory to exist before manual fix mode begins. `head-of-agents` reversed, citing that evidence and self-diagnosing that it had treated "a friction brief exists, formatted like `/implement`'s required shape" as sufficient evidence `/implement` had run — an unverified inference.

**F2 ownership (round 2).** `head-of-instructions` then moved to "both are real" and asked `head-of-agents` to draft the fix it had just withdrawn. The coordinator read `implement.md` lines 60-120 and established that the second fix targeted manual fix mode — a context the same evidence ruled out. `head-of-instructions` withdrew, naming the inconsistency directly.

**F3 ownership.** `head-of-agents` preferred a root-level override (in `head-of-instructions`'s scope), applying its own reach argument even though it pointed work away from itself. `head-of-instructions` preferred a local fix (in `head-of-agents`'s scope), distinguishing an _active content contradiction_ from a _coverage gap_: two rules already exist, both fire on the same trigger, and the contradiction resolves only where they meet a reader simultaneously. `head-of-agents` accepted, while correcting one supporting claim — `spec-writer.md:14` confirms root CLAUDE.md is co-present in every spec-writer invocation, so "requires an active cross-reference" was wrong; the binary-exhaustiveness argument holds without it.

**The "in code" scoping problem.** Surfaced by `head-of-agents`: F2's headline says "never resolve it silently **in code**," but spec-writer produces a spec, not code. The coordinator verified this and established a countervailing fact neither had raised — F2's final sub-bullet carries no code qualifier. `head-of-agents` chose a self-contained F3 (option a), rejecting a pointer at the unqualified sub-bullet on the grounds that it is nested under the code-scoped headline and refers back to a conflict the headline already framed in code terms.

## Open item carried forward (not a proposal)

`head-of-agents` flags, for a future session and explicitly not blocking this batch: F2's "in code" scoping is narrower than its own final sub-bullet's reach and than the principle appears to intend. The same gap would recur for any non-code artifact a role produces — a review verdict, an architectural brief — where a rule/correctness conflict is silently resolved. Worth revisiting once root CLAUDE.md has ceiling headroom. `head-of-instructions` declined to broaden it now on cost/evidence grounds: root CLAUDE.md is past its proximity threshold, and no second instance of the contradiction exists anywhere besides `spec-writer.md`.

## Application-code follow-up (Criterion 4)

Tracked item `task_bf5de8d0` — "Shrink 9 duplicated mutation comments to a pointer." Gated on F1 actually landing; the task carries its own precondition check. Per `head-of-instructions`: shrink to a one-line pointer, do not delete outright — a bare deletion would leave the deferred-dispatch shape looking unexplained at the call site to a reader who has not memorised the carve-out. Outside this session's write scope.

## Batch totals

| File                            | Before | After | Delta | Ceiling | Headroom |
| ------------------------------- | ------ | ----- | ----- | ------- | -------- |
| `app/src/CLAUDE.md`             | 43299  | 44846 | +1547 | 45000   | 154      |
| `CLAUDE.md` (root)              | 28304  | 28844 | +540  | 32000   | 3156     |
| `.claude/agents/spec-writer.md` | 24237  | 24582 | +345  | 26000   | 1418     |

All figures via `(Get-Content -Raw <path>).Length`, computed by applying each exact `Old:`/`New:` to a copy of the real file and measuring the copy. Both sides of every subtraction come from that same method.
