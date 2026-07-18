# Spec Writer — Pre-Emission Compliance Pass

Three general gates over the complete spec:

1. **Convention compliance (outward)**: every file placement, import, naming choice, and structural decision satisfies the applicable rule in the owning scoped CLAUDE.md. The scoped file is the authority — re-read the specific rule rather than recalling it. Any detail that cannot be reconciled with CLAUDE.md must be corrected before emitting; any detail interpretable more than one way must be resolved or surfaced as an explicit question.
2. **Toolchain validity**: every code example passes the active compiler flags and ESLint plugin rules per `app/CLAUDE.md`'s TypeScript Coding Style toolchain-validity rule. Enumerate every flag in `app/tsconfig.json` compilerOptions — do not stop at the `strict` bundle; for non-strict-bundle flags, read `.claude/knowledge/typescript.md` before writing code touching the construct the flag governs.
3. **Internal consistency (inward)**: every code example agrees with every principle, KAD, and rule stated elsewhere in the same spec. Gate 1 is outward-only; it does not catch contradictions between two parts of the same spec.

Then check each specific gate. Each row earned its place by slipping past the general gates once — a hit is a spec defect to fix before emitting; the Authority column names the full rule.

| Gate | Trigger | Check | Authority |
| --- | --- | --- | --- |
| Import trace | any relative import in the spec | anchor first: sibling-inside-grouping-folder rule vs. barrel rule; then trace each `../` from the importer's actual file, not a feature root | app/src/CLAUDE.md — Barrel Files |
| Method-call narrowing | guard calls `f()`, body calls `f()` again | store `const result = f()`; use it in guard and body — tsc narrows variables, not call expressions | app/CLAUDE.md — TypeScript Coding Style |
| Always-true predicate | predicate on a value whose type already guarantees the tested case | remove it and use the narrowed value — `no-unnecessary-condition` fires on compile-time-provable guards | app/eslint.config.js |
| Removal claims | input asserts a construct is unneeded | no active ESLint rule independently requires it; unconfirmable removals are flagged to the user | app/eslint.config.js |
| Bare HTML elements | `<input>`, `<button>`, or typed variants (`<input type="color">`) in examples | glob `app/src/components/` for name-match and semantic-match wrappers; read the wrapper's props before use | app/src/CLAUDE.md — UI primitive wrappers |
| Hook placement | any hook depending on a context provider | component renders below the provider — trace the tree, re-trace after moves | app/src/CLAUDE.md — providers/ |
| Helper extraction | multi-statement body repeated 2+ times across examples | extract to `ComponentName/helper/`, one file per function | app/src/CLAUDE.md — Component Library |
| Sub-component extraction | near-identical JSX repeated 2+ times with only data-level variance | extract to `ComponentName/components/` | app/src/CLAUDE.md — Component Library |
| Memoization | any `useCallback`/`useMemo` in examples | qualifying reason stated at the call site (effect dependency or `React.memo` prop) — otherwise remove | app/src/CLAUDE.md — State Management |
| Async ownership | any Frontend layer entry places subscription/listener/async logic (e.g. `listen()`) in a component | cross-reference other Frontend entries and existing hooks for the same concern — screens and components own no async logic themselves | app/src/CLAUDE.md — TanStack Query pattern |
| Parent-type import | sub-component imports a type from its parent module | relocate the type to a neutral file both import from | app/src/CLAUDE.md — Component Library |
| Reference validity | any file cited as a reference implementation, discovered or named by an upstream agent | re-verify against current CLAUDE.md conventions — a reference's prior correctness is not assumed | root CLAUDE.md — Validate before replicating |
| Exemption citations | spec cites a rule's allowance clause to omit a file or barrel | trace the exemption's stated precondition against the proposed structure — pattern-recognition of a similar prior case is not verification | the cited rule itself |
| KAD call notation | KAD text contains `fn(args)` notation | SF body declares the extracted construct and its file, or notes inlining with reason | internal consistency |
| KAD boundary deviations | SF choice could look like a boundary-rule violation | inline rationale note at the decision site naming the KAD heading | app/docs/CLAUDE.md — SF self-containment |
| Test-per-path | KAD names 2+ distinct code paths | one named test per path; decision text is authoritative for test names | app/docs/CLAUDE.md |
| Singleton-state scaffolding | 2+ tests call a function owning module-level singleton state | `vi.resetModules()` in `beforeEach` + dynamic imports per test — "scaffolding unchanged" or static imports is wrong | app/db/CLAUDE.md — Testing |
| Tunable-constant assertions | tests of geometry/layout helpers driven by constants under visual tuning | assert from the same imported constant the implementation uses — never a baked literal (literals stay correct for non-tunable outputs) | app/src/CLAUDE.md — Testing Policy |
| toHaveBeenCalledWith arity | any such assertion | one matcher argument per call-site argument, in position order; the call site must be named or derivable from the spec | spec-internal call site |
| Insertion anchors | "insert after X" instructions | anchor appears after every dependency of the inserted code | app/docs/CLAUDE.md — Insertion anchor validity |
| Existing-code claims | spec states a fact about an existing file's current syntax or structure (e.g. "already expression-bodied," "dep array is empty") | read the file in the current context window and confirm the claim before stating it — never state from pattern recognition or recall | root CLAUDE.md — Tool Use Discipline |
| Files-affected completeness | any file created, modified, moved, or read to derive a change in this sub-feature | confirm it appears under the sub-feature's Modified/New/Moved/Draft lists — including barrels, index files, and type files | Output section — Files affected |
| Foundation annotations | any `[FOUNDATION]` SF | complete inline file list ("Stage as unit:"), no delegation to another SF's list | app/docs/CLAUDE.md |
| Coupled-handler state table | 2+ handlers in one component where one reads state another writes, or 2+ mirrored roles (e.g. initiator/responder) with independent state machines | state-transition table: one row per handler or role — triggering event, state read, state mutated, no-op conditions; for mirrored roles, a rule stated for one role and not its counterpart must be flagged and either completed or explicitly waived with a reason; per-handler/role prose alone is a defect (an isolated handler or role with no cross-handler/cross-role coupling is exempt) | spec-internal |
