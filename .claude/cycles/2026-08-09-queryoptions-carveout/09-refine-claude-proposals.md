# /refine-claude proposals — SPEC_PREFETCH implementation retrospective

Producing role: `refine-claude` (coordinator). Mode: Retrospective. Input: `04-implement-friction-brief.md`, `05-implement-deferred-violations.md` (empty), `06-implement-spec-quality-brief.md`, `07-implement-claude-md-impact.md`, `08-spec-writer-retrospective-verdict.md` in this cycle directory. Teammates: `head-of-instructions` (owns `.claude/CLAUDE.md`, `app/*/CLAUDE.md`, root `CLAUDE.md`), `head-of-agents` (owns `.claude/agents/`, `.claude/commands/`, `.claude/reference/`).

## Phase 1 — Diagnosis (agreed, no mediation round needed)

Both teammates independently reached the same root cause for every item:

| Finding | Root cause | Class | Verdict |
| --- | --- | --- | --- |
| `app/src/CLAUDE.md` DAL enumeration (07) | Spec added a 4th DAL file kind (`<domain>QueryOptions.ts`); enumeration text never updated | structural | CHANGE |
| `app/src/CLAUDE.md` `routes/` tree comment (07) | Route files gained a `loader` responsibility the tree comment doesn't convey | structural | CHANGE |
| MentionPopupContent / `mentionPrefetchByType` dual enumeration (07) | 8 entity-type literals duplicated across two files, no shared type | structural (code-level) | NO CLAUDE.md/agent-file change — existing DRY (root `CLAUDE.md`) and Convention Discovery (`app/CLAUDE.md`) rules already cover this; application failure (grep step skipped), not an instruction gap. Confirmed still-live in current repo state → tracked application-code follow-up created (`task_c7796e21`), per Criterion 4. |
| Finding A/A' — `mentionPrefetchByType` type sample (08) | Pre-Emission gate 2 (tsconfig enumeration) worded as self-certifying with no required output; correctly scoped but unfalsifiable | structural (gate wording) | CHANGE — `.claude/reference/spec-writer-gates.md` gate 2 rewrite. `app/CLAUDE.md`'s toolchain-validity rule itself needs no change (already correct). |
| Finding B — unread `domain-scaffold.md` edit (08) | No gate fires when a `Modified:`-listed file's prescribed edit is described without having been read in-session | structural (gap) | CHANGE — new gate row in `.claude/reference/spec-writer-gates.md`. Root `CLAUDE.md`'s Tool Use Discipline rule itself needs no change (already correct). |
| Finding C — pre-existing `tsc` baseline failure (08) | Unrelated pre-existing repo state, correctly triaged Major and fixed before SF1 | n/a | NO CHANGE — process worked as designed |
| Finding D — zero over/under-spec friction (08) | Calibration evidence the decision/substitution filter and split-format threshold work correctly | n/a | NO CHANGE |
| Finding E — spec-writer retrospective-mode persistence failure, behavior (08) | Session-local execution failure on 2nd occurrence after 1st was already corrected; three existing rules (Retrospective mode step 6, root `CLAUDE.md` Coding style, root `CLAUDE.md` Immediate Application of Corrections) already cover it | behavioral | NO CHANGE to the rules themselves |
| Finding E — registry routing ambiguity (08) | `.claude/CLAUDE.md`'s `/implement`, `spec-writer`, and `/refine-claude` registry entries describe the same artifacts' path inconsistently, with no cross-check requirement | structural | CHANGE — registry text, mediated (see below) |

## Phase 2 — Mediation on F4 (registry routing)

Initial positions diverged on strength, not scope: head-of-instructions' first draft made spec-writer retrospective mode the sole documented path (deleting "routable directly" outright); head-of-agents held a conditional/recommended position, citing that `/refine-claude`'s own registry Input field already names direct `/implement` summaries as valid — making an exclusive-path framing reintroduce Finding E's inconsistency in a third entry. Reconciled: spec-writer retrospective mode is the **recommended default** path for the friction brief and spec quality brief specifically (the two artifact types about spec-writer's own output); direct routing to `/refine-claude` remains named and available at the user's discretion. Both teammates confirmed this final framing; head-of-agents' `implement.md` proposal was written to mirror it.

## Proposals

### 1. `app/src/CLAUDE.md` — DAL enumeration (head-of-instructions)

```
Section: ## State Management & Error Handling — TanStack Query pattern — Layer responsibilities
Old: One concern = one file: query keys, single-entity hooks, and collection hooks each own a separate file (`sessionKeys.ts`, `useSession.ts`, `useSessions.ts`) — the shared cache deduplicates across hooks, so no `DomainProvider` wrapping mutations is needed.
New: One concern = one file: query keys, single-entity hooks, collection hooks, and a `queryOptions` factory module each own a separate file (`sessionKeys.ts`, `useSession.ts`, `useSessions.ts`, `sessionQueryOptions.ts`) — the shared cache deduplicates across hooks, so no `DomainProvider` wrapping mutations is needed. The `queryOptions` factory's own carve-out from the hook-only consumer rule is defined in Barrel Files above.
```

### 2. `app/src/CLAUDE.md` — Structure tree (head-of-instructions)

```
Section: ## Structure
Old: ├── routes/ # Tanstack router
New: ├── routes/ # Tanstack router — route files own data resolution via a `loader`
```

**Size**: baseline 43,081 chars; both edits together project to **43,299 chars** (canonical `Get-Content -Raw` measurement) against a 45,000-char ceiling (96.2%) — clears with 1,701 chars headroom, no compensating removal needed.

### 3–6. `.claude/CLAUDE.md` — registry routing (head-of-instructions, final hedged text)

```
Section: ## commands — /implement (friction brief clause)
Old: a friction brief written to the cycle directory (`.claude/cycles/` — see Agent Infrastructure) as the handoff artifact for a future /refine-claude session, with a chat pointer to its path;
New: a friction brief written to the cycle directory (`.claude/cycles/` — see Agent Infrastructure) as the recommended handoff artifact for a future spec-writer retrospective-mode session — routing directly to a future /refine-claude session instead remains the user's call — with a chat pointer to its path;
```

```
Section: ## commands — /implement (spec quality brief clause)
Old: a spec quality brief always written to the cycle directory at the end of the session (not conditional on friction), with a chat pointer, covering over-specified sections, under-specified gaps, per-file decisions vs. substitutions, and format observations — routable directly to `/refine-claude` for spec-writer improvement
New: a spec quality brief always written to the cycle directory at the end of the session (not conditional on friction), with a chat pointer, covering over-specified sections, under-specified gaps, per-file decisions vs. substitutions, and format observations — recommended to route through a future spec-writer retrospective-mode session before `/refine-claude`, though routing directly to `/refine-claude` remains available at the user's discretion
```

```
Section: ## commands — spec-writer (Input field)
Old: Input: An arch-review verdict (structured) or a feature outline + informal architectural decisions (unstructured — confirms derived decisions with user before proceeding)
New: Input: An arch-review verdict (structured), a feature outline + informal architectural decisions (unstructured — confirms derived decisions with user before proceeding), or a friction brief / spec quality brief produced by `/implement` (the recommended default path by which those briefs reach `/refine-claude`, though routing them there directly remains available at the user's discretion)
```

```
Section: ## commands — spec-writer (Output field)
Old: Output: A complete spec file following the canonical format defined in app/docs/CLAUDE.md; when the input is a retrospective finding about spec-writer's own prior output or the inputs it received (a spec quality brief or a post-implementation friction brief), a verdict artifact combining the original finding with spec-writer's classification and recommended action, written to the cycle directory as the handoff artifact for a future /refine-claude session, instead of a spec
New: Output: A complete spec file following the canonical format defined in app/docs/CLAUDE.md; for the friction-brief/spec-quality-brief input, a verdict artifact combining the original finding with spec-writer's classification and recommended action, written to the cycle directory as the handoff artifact for a future /refine-claude session, instead of a spec
```

**Size**: baseline 18,159 chars. Reduction (Output field trim) partially offsets the three additions; net growth expected small — not separately computed since none of these four edits individually or in aggregate approaches this file's ceiling based on baseline proximity.

### 7. `.claude/reference/spec-writer-gates.md` — gate 2 rewrite (head-of-agents)

```
Section: general gate 2, Toolchain validity
Old: 2. **Toolchain validity**: every code example passes the active compiler flags and ESLint plugin rules per `app/CLAUDE.md`'s TypeScript Coding Style toolchain-validity rule. Enumerate every flag in `app/tsconfig.json` compilerOptions — do not stop at the `strict` bundle; for non-strict-bundle flags, read `.claude/knowledge/typescript.md` before writing code touching the construct the flag governs.
New: 2. **Toolchain validity**: every code example passes the active compiler flags and ESLint plugin rules per `app/CLAUDE.md`'s TypeScript Coding Style toolchain-validity rule. Before writing any code example, read `app/tsconfig.json` compilerOptions in full and write out every non-default flag's name and value as an explicit checklist — do not stop at the `strict` bundle, and do not treat a prior session read as current without re-reading; a flag list that was never written down does not satisfy this gate, regardless of whether the code was inspected. For non-strict-bundle flags, read `.claude/knowledge/typescript.md` before writing code touching the construct the flag governs.
```

Note: head-of-agents' submitted Old: text said "1. **Toolchain validity**"; the actual file has this as item 2. Corrected against verified file content (`.claude/reference/spec-writer-gates.md:6`) before recording here — a transcription slip, not a content disagreement.

### 8. `.claude/reference/spec-writer-gates.md` — new gate row (head-of-agents)

```
Section: gate table, after "Files-affected completeness" row
Old: | Files-affected completeness | any file created, modified, moved, or read to derive a change in this sub-feature | confirm it appears under the sub-feature's Modified/New/Moved/Draft lists — including barrels, index files, and type files; for any import specifier a later SF names as a consumer, resolve it through every barrel it transits — grouping barrel and module barrel alike — not only the module barrel nearest the changed file | Output section — Files affected |
New: | Files-affected completeness | any file created, modified, moved, or read to derive a change in this sub-feature | confirm it appears under the sub-feature's Modified/New/Moved/Draft lists — including barrels, index files, and type files; for any import specifier a later SF names as a consumer, resolve it through every barrel it transits — grouping barrel and module barrel alike — not only the module barrel nearest the changed file | Output section — Files affected |
| Modified-file read requirement | a file appears under any sub-feature's `Modified:` list and the spec describes a required change to it | confirm the file was read in the current context window before the change was described; if reading now to close the gap, verify the prescribed change is consistent with, and complete relative to, every existing construct in the file that the change's own stated rationale applies to — not only the construct originally in mind | root CLAUDE.md — Tool Use Discipline (verify before naming a path or describing file content) |
```

**Size (items 7+8 combined)**: baseline 19,008 chars; projects to **19,858 chars** (canonical measurement). No stated ceiling exists for `.claude/reference/` files under current rules (the 26,000-char ceiling in `head-of-agents.md` is scoped to "each agent or command file") — noted as a documentation gap, not blocking this batch.

### 9. `.claude/commands/implement.md` — Handoff artifact discipline (head-of-agents)

```
Section: Handoff artifact discipline
Old: Each artifact must be self-contained per root CLAUDE.md's handoff-artifact self-containment principle (Epistemological Discipline) — state facts and reasoning directly, never in a form that requires the producing conversation to interpret. None of these four artifacts is ever submitted to `/refine-claude` by this command — produce each per the delivery rule below and stop; invoking `/refine-claude` is the user's decision, never this command's.
New: Each artifact must be self-contained per root CLAUDE.md's handoff-artifact self-containment principle (Epistemological Discipline) — state facts and reasoning directly, never in a form that requires the producing conversation to interpret. None of these four artifacts is ever submitted to `/refine-claude` by this command — produce each per the delivery rule below and stop; invoking `/refine-claude` is the user's decision, never this command's. For the friction brief and spec quality brief specifically, a future spec-writer retrospective-mode session is the recommended default path to `/refine-claude`, though routing them there directly remains available at the user's discretion; this command takes no position beyond producing the artifacts and stopping, consistent with never auto-chaining into `/refine-claude`.
```

Contingent on Proposals 3–6 landing in the same batch (per head-of-agents — otherwise the registry and command file would describe the routing relationship inconsistently again).

## Criterion 6 — batch self-consistency rechecks

- Head-of-agents' F3 (MentionPopupContent NO CHANGE) rechecked against its own Proposals 7 and 8 (both edit `spec-writer-gates.md`): confirmed still holds — neither edit's subject matter (tsconfig enumeration; single-file Modified: read completeness) reaches cross-file future-entity parity, which the pre-existing, unmodified Analogous-member-parity row already covers for future specs.
- Head-of-agents' Finding-C NO CHANGE (citing `implement.md` Pre-implementation phase steps 3–6) rechecked against its own Proposal 9 (edits `implement.md`'s Handoff artifact discipline section): confirmed still holds — non-overlapping sections, different points in the session lifecycle.

## Application-code follow-up (Criterion 4)

MentionEntityType duplication (see table above) — verified live against current repo state (`MentionPopupContent.tsx:13-51`, `mentionPrefetchByType.ts:17-55`, both read 2026-08-09) — tracked as `task_c7796e21`.

---

## G1 — Automatic pre-write verdict-gathering gate

New friction reported by the user mid-session, not from the cycle-directory input: historically the user has had to manually ask the implementer (`/implement`) and spec-writer to review `/refine-claude`'s proposed rule changes and write down a verdict before those changes are finalized (see `.claude/retro-log.md`'s 2026-08-08 "Batch 'Retrospective Corrections'"). The user wants this automatic.

**Diagnosis (agreed)**: genuine structural gap — nothing in `refine-claude.md`'s Coordination Protocol, Team Structure, or Proposal Quality Gate checks the proposal against the *originating reporter's* independent judgment; nothing in `.claude/CLAUDE.md`'s registry documents this as caller-observable behavior.

**Design, settled by the user via AskUserQuestion**:
1. Gate timing: pre-write hard gate (Retrospective mode).
2. Mechanism: no spawning for either role — `spec-writer` and `/implement` each get a standing instruction to write a verdict unprompted whenever they review a `/refine-claude` proposal batch; `/refine-claude`'s side is a passive existence check only.
3. Scope: Retrospective mode only.
4. Format: formal cycle-directory artifact (`NN-<role-slug>-proposal-verdict.md`).

### Proposal 5 — `/refine-claude` Constraints (head-of-instructions, final revision)

```
File: D:\gm-tool\.claude\CLAUDE.md
Type: REPLACE
Section: ## commands — /refine-claude
Old: at session start, also offers any unresolved `.claude/retro-log.md` entries as optional additional Retrospective input alongside the user's own input — non-blocking if declined
New: at session start, also offers any unresolved `.claude/retro-log.md` entries as optional additional Retrospective input alongside the user's own input — non-blocking if declined; in Retrospective mode, never writes an approved batch until a verdict artifact exists in that batch's cycle directory from each role whose brief or artifact was present in this cycle's input (spec-writer, `/implement`, or both) — this excludes a Retrospective-mode session whose input was pasted text with no cycle-directory artifact to verdict against; the check is passive, looking only for artifacts already written unprompted by those roles, never spawning or fetching either; user approval of the batch does not itself clear this gate
```

### Proposal 6 — `spec-writer` Output (head-of-instructions)

```
File: D:\gm-tool\.claude\CLAUDE.md
Type: REPLACE
Section: ## commands — spec-writer
Old: written to the cycle directory as the handoff artifact for a future /refine-claude session, instead of a spec
New: written to the cycle directory as the handoff artifact for a future /refine-claude session, instead of a spec; separately, when reviewing a `/refine-claude` proposal batch in Retrospective mode, writes a verdict artifact to that batch's cycle directory unprompted — without being spawned for the purpose — stating whether the batch's proposals address the friction spec-writer itself originally experienced, satisfying the Retrospective-mode pre-write gate named in `/refine-claude`'s Constraints
```

### Proposal 7 — `/implement` Output (head-of-instructions)

```
File: D:\gm-tool\.claude\CLAUDE.md
Type: REPLACE
Section: ## commands — /implement
Old: since the user must dispose of each one before the session proceeds and no entry may be omitted or merged;
New: since the user must dispose of each one before the session proceeds and no entry may be omitted or merged; separately, when reviewing a `/refine-claude` proposal batch in Retrospective mode, writes a verdict artifact to that batch's cycle directory unprompted — no spawn or invocation triggers this, it is standing behavior for a live `/implement` session — stating whether the batch's proposals address the friction `/implement` itself originally experienced, satisfying the Retrospective-mode pre-write gate named in `/refine-claude`'s Constraints;
```

**`.claude/CLAUDE.md` size (Proposals 1–7 combined)**: baseline 18,159 chars; total delta +1,710 → projects to **19,869 chars**, well under both the 32,000 (root) and 45,000 (scoped) ceilings — clears comfortably regardless of which applies to this file.

### Proposal 8 — `spec-writer.md` Retrospective analysis mode (head-of-agents)

```
File: D:\gm-tool\.claude\agents\spec-writer.md
Type: REPLACE
Section: Retrospective analysis mode
Old: After producing the verdict artifact, stop. Do not continue into authoring mode.
New: After producing the verdict artifact, stop. Do not continue into authoring mode. **Proposal-verdict trigger** — When the input is or includes a `/refine-claude` proposals file (`NN-refine-claude-proposals.md`) proposing a fix for a friction spec-writer previously reported, was named in, or verdicted: this is a distinct trigger from the retrospective-finding trigger above and does not re-enter classification steps 1–6. Without being asked, read the proposal's `Old:`/`New:` text for the relevant item(s) and state whether it addresses the friction as spec-writer understands it — yes, no, or partially, naming the specific residual gap if partially — then write this verdict to the cycle directory as `NN-spec-writer-proposal-verdict.md` (next available sequence number in that directory), self-contained per the same discipline as the verdict artifact above. This fires whenever spec-writer reviews such a file, in any session, for any reason — it is not conditional on being asked to render a verdict on it.
```

**Size**: base 23,288 → projected **24,220** / 26,000 ceiling (93.2%) — clears.

### Proposal 9 — `implement.md` Ambiguity section (head-of-agents)

```
File: D:\gm-tool\.claude\commands\implement.md
Type: REPLACE
Section: Ambiguity
Old: When the user provides content that falls outside implementation scope — proposed rule changes, CLAUDE.md feedback, or meta-level process suggestions — assess its soundness and give feedback. Do not treat it as an instruction to execute.
New: When the user provides content that falls outside implementation scope — proposed rule changes, CLAUDE.md feedback, or meta-level process suggestions — assess its soundness and give feedback. Do not treat it as an instruction to execute. When that content is specifically a `/refine-claude` proposals file (`NN-refine-claude-proposals.md`) proposing a fix for this session's own friction brief or spec quality brief, assessing it is not optional or feedback-on-request — without being asked, state whether the proposal addresses the friction as this session experienced it and write that verdict to the cycle directory as `NN-implement-proposal-verdict.md` (next available sequence number), self-contained per Handoff artifact discipline's principle. This fires only while this implementation session is still open — a session already ended per Manual fix mode's exit condition cannot review or verdict a proposals file produced afterward, since no live instance persists to do so; that is a known limitation of this mechanism, not something this rule closes.
```

### Proposal 10 — `implement.md` Handoff artifact discipline (head-of-agents)

```
File: D:\gm-tool\.claude\commands\implement.md
Type: REPLACE
Section: Handoff artifact discipline
Old: Each artifact must be self-contained per root CLAUDE.md's handoff-artifact self-containment principle (Epistemological Discipline) — state facts and reasoning directly, never in a form that requires the producing conversation to interpret. None of these four artifacts is ever submitted to `/refine-claude` by this command — produce each per the delivery rule below and stop; invoking `/refine-claude` is the user's decision, never this command's.
New: Each artifact must be self-contained per root CLAUDE.md's handoff-artifact self-containment principle (Epistemological Discipline) — state facts and reasoning directly, never in a form that requires the producing conversation to interpret. None of these four artifacts is ever submitted to `/refine-claude` by this command — produce each per the delivery rule below and stop; invoking `/refine-claude` is the user's decision, never this command's. For the friction brief and spec quality brief specifically, a future spec-writer retrospective-mode session is the recommended default path to `/refine-claude`, though routing them there directly remains available at the user's discretion; this command takes no position beyond producing the artifacts and stopping, consistent with never auto-chaining into `/refine-claude`.
```

**`implement.md` size (Proposals 9+10 combined)**: baseline 21,056; delta +1,197 → projects to **22,253** / 26,000 (85.6%) — clears.

### Proposal 11 — `refine-claude.md` Coordination Protocol (head-of-agents, trimmed to fit ceiling)

```
File: D:\gm-tool\.claude\commands\refine-claude.md
Type: REPLACE
Section: Coordination Protocol
Old: Any round in which the coordinator relays one teammate's stated position to the other for reconsideration (e.g., Phase 1's root-cause agreement loop, Phase 2's overlap/contradiction resolution loop) risks trading argument for evidence. Track each agent's stated position per round. A crossing — agent A ends the round holding agent B's prior-round position and agent B ends the round holding agent A's prior-round position, with neither restatement carrying a citation not already present in the prior round — means no new information was exchanged, regardless of how the restatement reads. On a crossing, do not relay a further round of pure argument-exchange: independently establish the disputed fact yourself (Read the artifact, grep the codebase, run the relevant check) and share the result with both agents before either may restate a verdict. A verdict reversal is valid only when it carries a citation naming the new evidence that caused it — an uncited restatement, including one that merely echoes the other agent's argument, does not qualify and must be rejected back to the agent for resubmission.
New: Any round in which the coordinator relays one teammate's stated position to the other for reconsideration (e.g., Phase 1's root-cause agreement loop, Phase 2's overlap/contradiction resolution loop) risks trading argument for evidence. Track each agent's stated position per round. A crossing — agent A ends the round holding agent B's prior-round position and agent B ends the round holding agent A's prior-round position, with neither restatement carrying a citation not already present in the prior round — means no new information was exchanged, regardless of how the restatement reads. On a crossing, do not relay a further round of pure argument-exchange: independently establish the disputed fact yourself (Read the artifact, grep the codebase, run the relevant check) and share the result with both agents before either may restate a verdict. A verdict reversal is valid only when it carries a citation naming the new evidence that caused it — an uncited restatement, including one that merely echoes the other agent's argument, does not qualify and must be rejected back to the agent for resubmission. **Pre-write verdict gate (Retrospective mode only).** When this session's input arrived via a cycle directory containing an `/implement` friction brief, spec quality brief, or spec-writer artifact, do not write the proposals file or reach Output to User until a matching verdict artifact exists in that directory for each such input present: glob for `*-implement-proposal-verdict.md` and/or `*-spec-writer-proposal-verdict.md`, matching only the roles whose artifact was present — by role-slug and artifact-slug suffix, not a predicted sequence number, since `/refine-claude` doesn't control the `NN` prefix the producing role assigns. If a required verdict artifact is missing, halt and tell the user which one is still needed and from which role. This gate excludes Review task and Consolidation mode, and a Retrospective-mode session whose input was pasted text with no cycle-directory artifact to verdict against.
```

**Size**: base 24,957 → delta +919 → projected **25,876** / 26,000 (99.5%) — clears, 124 chars headroom. This edit was revised once already to fit under the ceiling (original draft projected to 26,136, over by 136 chars); head-of-agents compressed redundant phrasing while preserving every firing condition, exclusion, and the glob-matching rationale.

## Known residual limitation (flagged by head-of-agents, not closed by this batch)

An implementer verdict can only be produced while an `/implement` session is still open in Manual fix mode. If the user ends that session before running `/refine-claude`, there is no live instance left to satisfy the gate for the `/implement` half — the gate will correctly halt and report the missing verdict, but there is no clean way to produce one after the fact (a fresh `/implement` invocation requires a spec path as Input, not a proposals file). This is a known gap in the "no spawning" design the user chose, not something in scope to fix here.
