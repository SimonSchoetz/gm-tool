# Refine-Claude Proposals — Migration Atomicity Fix Retrospective

Cycle: 2026-08-27-migration-atomicity-fix
Mode: Retrospective (pasted-text input — architect verdict + implemented fix summary, no cycle-directory pre-gate artifact)

## Session Input (as supplied to both teammates)

Post-implementation retrospective input: architect verdict on a migration-runner bug fix just implemented in app/db/_migrations/. Finding requiring a CLAUDE.md correction:

app/db/CLAUDE.md's Migrations section currently states: "ALTER TABLE ... ADD COLUMN has no IF NOT EXISTS form and SQLite provides no SQL-side guard for it — the _migrations ledger's one-time-execution guarantee is the sole and sufficient idempotency mechanism for this shape. Do not add a defensive column-existence check around an ADD COLUMN migration."

This is factually wrong. Verified via direct source read of tauri-plugin-sql 2.4.0 (src/wrapper.rs) and sqlx-core/sqlx-sqlite 0.8.6: each db.execute() call from JS checks out an arbitrary connection from a 10-connection sqlx pool with no session pinning across calls, and there is no config surface to change this. The migration runner's BEGIN/COMMIT/ROLLBACK wrapper was therefore never actually atomic. Concrete proof: the 1786002768594_add_pinned_order migration's 7 sequential ALTER TABLE ADD COLUMN statements each committed individually and durably, but the migration's final ledger INSERT never landed — every subsequent app launch re-ran up() from statement 1 and crashed with "duplicate column name".

The implemented fix (already applied, committed separately as `fix(migration-atomicity)`): removed the BEGIN/COMMIT/ROLLBACK wrapper entirely from runMigrations(); added app/db/util/ensure-column.ts; rewrote add_pinned_order.ts to use it; fixed a second latent bug (INSERT OR IGNORE keyed on a fresh id instead of the real table_name domain key in seed_table_config.ts / add_encounters.ts); added a migration creating a real UNIQUE index on table_config.table_name with a defensive dedup pass.

## Phase 1 — Diagnosis (agreed after 2 mediation rounds)

**head-of-instructions:**
- F1 — `db/CLAUDE.md`'s Migrations section states a disproven invariant guarantee about tauri-plugin-sql/sqlx cross-statement atomicity. RAIL. CHANGE.
- F2 — No new general CLAUDE.md rule needed. NO CHANGE. Already covered by root/app CLAUDE.md's Epistemological Discipline (invariant-claim-scope clause) and head-of-instructions' own role's Verification-gate step. This was a compliance failure of existing rules, not a coverage gap.

**head-of-agents:**
- F1 — `architect.md`'s process has no step gating verification of an external system's behavioral/concurrency guarantee before it's treated as an established premise inside a verdict. Structural. CHANGE. Reframed during mediation from "this incident's root cause" to a prospective structural finding — no verified provenance exists that an architect verdict actually produced the original wrong sentence, and head-of-agents explicitly withdrew that causal framing on challenge.

**Mediation outcome:** No contradiction. hoi's F2 (no new *CLAUDE.md* rule) and hoa's F1 (a new *architect.md process step*) answer different questions about different files/pipeline points — hoi's cited "Verification gate" is head-of-instructions' own role step (gates drafting CLAUDE.md text), not architect's; hoa confirmed by direct re-read that architect.md has no equivalent step (gating verdict formation, upstream of any CLAUDE.md drafting). Both proposals proceed.

## Phase 2 — Proposals (initial)

Initial Phase 2 drafts (before the architect review round below) proposed: hoi — the Migrations-section correction without the ON CONFLICT/WHERE NOT EXISTS rationale sentence; hoa — only a step 4 bullet, with the trigger scoped to "the decision under review." Both were revised; see Architect Review Round below for what changed and why. Only final versions are recorded in full here.

## Architect Review Round

Per the user's request, the original architect (same session/transcript that produced the migration-atomicity finding this whole retrospective is about) reviewed both Phase 2 proposals before user approval — it has direct standing from having done the original source verification.

**On Proposal 1 (head-of-instructions):** Initially flagged an apparent mismatch — the proposal cites `1780099200000_seed_table_config.ts` as using `WHERE NOT EXISTS`, but architect's own original refactoring brief had specified `ON CONFLICT(table_name) DO NOTHING` for that file instead. Coordinator verified against the actual implemented code (not the brief) and found the file already uses `WHERE NOT EXISTS`, with an inline comment explaining why. On independent re-verification (fetching SQLite's own UPSERT docs, and re-reading `sqlx-sqlite`'s parameter-binding source to confirm the query's reused `$2` placeholder binds correctly), architect confirmed: the implementation is correct, and **its own original brief had a sequencing bug** — it specified `ON CONFLICT(table_name)` for two migrations that both run *before* the new unique-index migration creates that constraint, which would break on a fresh install. Architect suggested one addition: state *why* `ON CONFLICT` doesn't work here, not just prescribe the alternative, so a future author doesn't "simplify" it back once the unique index is visible in the schema. head-of-instructions added one sentence, generalized as a structural condition (not scoped to just the two named migrations).

**On Proposal 2 (head-of-agents):** Architect confirmed the step 4 bullet's placement, trigger shape, and integration with the existing three conditionals were correct, and that it would have caught exactly the verification it had to do by hand. But flagged a real scoping gap: the bullet only gates the decision under review (step 4) — the actual risk in architect's own task materialized while evaluating a *candidate alternative* (`max_connections(1)`) in step 5, a point the step-4 gate structurally cannot reach since alternatives don't exist yet when step 4 runs. head-of-agents accepted this and added a second, parallel bullet directly in step 5 (rather than a forward-reference from step 4, to match the existing no-forward-reference pattern of every other conditional in the file).

Two additional verified facts surfaced during this round (architect had no Write permission; persisted by the coordinator): SQLite's `ON CONFLICT` target must be an already-existing constraint at prepare time; sqlx-sqlite binds a reused `$N` placeholder by parameter number, not occurrence order. Both appended to `.claude/knowledge/sqlite.md`.

## Phase 2 — Proposals (final, post-architect-review)

### head-of-instructions — `app/db/CLAUDE.md`, Migrations section

```
Type: REPLACE
Old: All migrations must be idempotent: use `CREATE TABLE IF NOT EXISTS` for new tables; for column-level changes, use `DROP TABLE IF EXISTS` on any temp table before creating it. `ALTER TABLE ... ADD COLUMN` has no `IF NOT EXISTS` form and SQLite provides no SQL-side guard for it — the `_migrations` ledger's one-time-execution guarantee is the sole and sufficient idempotency mechanism for this shape. Do not add a defensive column-existence check around an `ADD COLUMN` migration.
New: All migrations must be idempotent — not only against being re-run after the ledger already recorded them, but against being resumed after a partial failure mid-`up()`, since no cross-statement atomicity is achievable through `tauri-plugin-sql`'s `execute()`/`select()` API at all. Each call checks out an arbitrary connection from a 10-connection pool with no session pinning across calls and no config surface to change this, so a raw-SQL `BEGIN`/`COMMIT` wrapper spanning multiple `execute()` calls guarantees nothing — a statement that already committed stays committed if a later statement in the same migration fails, and a connection left mid-transaction by a raw `BEGIN` returns to the pool with no automatic rollback, since sqlx's own rollback-on-drop only covers transactions opened via its `Connection::begin()` API, never raw SQL text sent through `execute()`. The `_migrations` ledger guarantees a completed migration's `up()` never re-runs; it guarantees nothing about a migration that fails partway through, so it is never sufficient idempotency on its own for any statement shape — every statement in `up()` must be independently safe to re-issue: `CREATE TABLE IF NOT EXISTS` / `CREATE TRIGGER IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` for creation statements (see `1786186021664_add_encounters.ts`, `1784365870026_add_sync_infrastructure.ts`); `INSERT ... SELECT ... WHERE NOT EXISTS`, keyed on a real unique column and never on a freshly generated `id` (which differs per retry), for row inserts — prefer `ON CONFLICT DO NOTHING` against a real unique constraint when the table already carries one, but use `WHERE NOT EXISTS` instead whenever the insert must be idempotent before that constraint exists, since `ON CONFLICT` targets a constraint that must already be defined at the time the migration runs (see `1780099200000_seed_table_config.ts`, which necessarily predates the unique index `1787825905519_add_table_config_unique_index.ts` later adds); `ensureColumn` (`db/util/ensure-column.ts` — a `PRAGMA table_info` existence check before the `ALTER TABLE ... ADD COLUMN` call) for column additions, since `ADD COLUMN` has no `IF NOT EXISTS` form. For column-level changes involving a temp table, additionally use `DROP TABLE IF EXISTS` on the temp table before creating it.
```

Verified: `Old:` text matches `app/db/CLAUDE.md:135` exactly (coordinator re-check). Size: 16530 → 18352 UTF-16 code units (+1822), against a 45,000-character ceiling (40.8%) — no proximity concern.

**No-change list:** rest of Migrations section (naming convention, `_migrations` ownership paragraph, migration-file-duplication paragraph) — no factual defect, out of scope. Root/app CLAUDE.md — F2 NO CHANGE. Knowledge base files — already correct, no Write permission anyway. `architect.md` — hoa's domain.

### head-of-agents — `.claude/agents/architect.md`, steps 4 and 5

```
Type: REPLACE
Section: ## Your Process, step 4
Old: 4. Challenge it: what are the structural, scalability, or clarity costs of this approach? Are there contexts where it breaks down?
   If the decision under review involves removing or replacing existing code (not adding or restructuring): before moving to alternatives, explicitly state what the removed or replaced code was doing and what design intent it served. Then ask: does the proposed change preserve that intent, or does it regress it? A change that is type-safe and rule-compliant can still remove correct behavior — document this explicitly if it applies.
   If the feature introduces a new domain entity: before moving to alternatives, audit ambient infrastructure. Enumerate every system that handles all entities of this type — navigation, breadcrumbs, list screens, global providers, route config, seed/config data — then cross-reference `app/docs/_product/domain-scaffold.md` for any additional per-entity-type registration point it documents; treat the doc as a floor, not a substitute, since a new ambient system can land there before this list is updated to name it. Any such system not addressed by the input is a gap; surface it in Challenges and require it to be covered before the verdict is declared complete.
   If the design introduces two or more mirrored or symmetric roles (e.g. initiator/responder, sender/receiver): before moving to alternatives, verify that every disposition, mechanism, state-transition rule, or precision detail stated for one role is either stated for its counterpart or explicitly waived with a reason. A detail stated for only one side of a mirrored pair is a gap; surface it in Challenges and require it to be covered before the verdict is declared complete.
New: 4. Challenge it: what are the structural, scalability, or clarity costs of this approach? Are there contexts where it breaks down?
   If the decision under review involves removing or replacing existing code (not adding or restructuring): before moving to alternatives, explicitly state what the removed or replaced code was doing and what design intent it served. Then ask: does the proposed change preserve that intent, or does it regress it? A change that is type-safe and rule-compliant can still remove correct behavior — document this explicitly if it applies.
   If the feature introduces a new domain entity: before moving to alternatives, audit ambient infrastructure. Enumerate every system that handles all entities of this type — navigation, breadcrumbs, list screens, global providers, route config, seed/config data — then cross-reference `app/docs/_product/domain-scaffold.md` for any additional per-entity-type registration point it documents; treat the doc as a floor, not a substitute, since a new ambient system can land there before this list is updated to name it. Any such system not addressed by the input is a gap; surface it in Challenges and require it to be covered before the verdict is declared complete.
   If the design introduces two or more mirrored or symmetric roles (e.g. initiator/responder, sender/receiver): before moving to alternatives, verify that every disposition, mechanism, state-transition rule, or precision detail stated for one role is either stated for its counterpart or explicitly waived with a reason. A detail stated for only one side of a mirrored pair is a gap; surface it in Challenges and require it to be covered before the verdict is declared complete.
   If the decision's correctness depends on a behavioral or concurrency guarantee of an external system — atomicity, ordering, session or connection affinity, isolation, or any runtime guarantee not evident from the library's type signature alone: before moving to alternatives, verify that guarantee against source or official documentation, per `.claude/knowledge/<topic>.md`'s Step 0 protocol. An unverified guarantee the decision rests on is a gap; surface it in Challenges and require it to be resolved before the verdict is declared complete.
```

```
Type: REPLACE
Section: ## Your Process, step 5
Old: 5. Propose alternatives: at least one concrete alternative structure with explicit trade-offs
New: 5. Propose alternatives: at least one concrete alternative structure with explicit trade-offs
   If a proposed alternative's viability depends on a behavioral or concurrency guarantee of an external system — atomicity, ordering, session or connection affinity, isolation, or any runtime guarantee not evident from the library's type signature alone: before recommending or rejecting that alternative, verify the guarantee against source or official documentation, per `.claude/knowledge/<topic>.md`'s Step 0 protocol. An unverified guarantee an alternative's recommendation or rejection depends on is a gap; surface it in Challenges and require it to be resolved before the verdict is declared complete.
```

Verified: both `Old:` blocks match `.claude/agents/architect.md:30-34` exactly (coordinator re-check). New step 4 bullet's cited knowledge-base Step 0 protocol confirmed to exist at `architect.md:92`. Size: 12973 → 14132 UTF-16 code units (+1159), against a 26,000-character ceiling (54.4%) — no proximity concern.

**Scope:** architect.md-only. No changes to spec-writer.md, implement.md, write-specs.md — head-of-agents reasoned these correctly defer to architect's verdict by design; duplicating the verification requirement into them would be dilution, not a fix.

**No-change list:** architect.md Behavior Rules (existing knowledge-base citation bullet, untouched, cited by reference from both new bullets), Output Format/Verdict section (verification now happens upstream, before any verdict is drafted), steps 1-3, 6-7 (gap is specific to steps 4 and 5's premise-forming functions).

## Proposal Quality Gate — Coordinator Verification

- C1 Causal depth: both proposals address the identified root cause, not just the reported instance. Pass.
- C2 Concreteness: both `Old:` blocks verified byte-accurate against current file content (rechecked after each revision); all named artifacts (`ensure-column.ts`, cited migration files, architect.md's existing knowledge-base bullet) verified to exist. Pass.
- C3 Restatement completeness: hoi's F2 no-change verdict states the exact firing mechanism (Epistemological Discipline's invariant-claim clause + own role's step 7) with citations. Pass.
- C4 Application-code scope check: no new application-code follow-up identified (the migration code fix itself was already implemented and committed separately, outside this session's mandate). Nothing to track.
- C5 Size grounding: both teammates supplied fresh coordinator-measured counts before drafting, re-measured after each revision. Pass.
- C6 Batch self-consistency: no no-change verdict in this batch cites a file that is also a proposal target elsewhere in the batch. Not triggered.
- C7 Ceiling-raise validity: not triggered — neither proposal raises a ceiling.

## Independent Review Round (beyond the standard protocol)

Per explicit user request, the original architect reviewed both final proposals with direct standing from the source investigation. This is additive to, not a replacement for, the Proposal Quality Gate above — both passed the gate independently of this review round. Outcome: architect found its own original refactoring brief contained a sequencing bug (not the implementation, which had already self-corrected it), confirmed Proposal 1 accurate, and found one real, now-fixed scoping gap in Proposal 2 (step 4-only trigger, extended to step 5).
