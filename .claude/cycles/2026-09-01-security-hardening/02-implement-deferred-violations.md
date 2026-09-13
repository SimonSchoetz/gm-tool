# Deferred violations brief — security hardening implementation

Produced by an `/implement` session on branch `docs/security-audit-sync-channel`, implementing `app/docs/SPEC_SECURITY_HARDENING.md`. Each entry below requires an explicit user disposition — fix now, accept as tracked debt, or route to `/refine-claude`. Listing an entry does not close it.

The review loop ran one cycle and exited on an architect no-violations verdict, so there is no cycle 2 or cycle 3. No spec file on this branch contains a `[DEFERRED-VIOLATION:` marker — the scan for that prefix across all seven `app/docs/SPEC_SECURITY_HARDENING*.md` files returned no matches — so every entry below is architect-sourced from cycle 1.

---

## Entry 1 — Manually wrapped code comments in touched Rust files

**Source:** architect cycle 1 (raised by code-reviewer as its Violation 1, classified by architect as out of scope for the architectural review loop).

**The violation.** Root CLAUDE.md — Coding style: "Never introduce manual line breaks within a single logical unit — a code comment anywhere in the codebase ... Each is one continuous line." `app/src-tauri/src/connectivity/pairing.rs:405-406` carried one sentence split across two comment lines.

**Why the architect marked it out of scope.** The architectural review loop raises structure, layer-boundary, and ownership findings; comment formatting is an implementation-detail convention outside that remit.

**Disposition already taken — this entry is closed unless the user disagrees.** Fixed in commit `7c3ad78c`, not deferred. Root CLAUDE.md's "Fix violations in files you touch" binds the implementer independently of what the architectural loop scopes in, so the architect's exclusion did not discharge the obligation. Three instances were unwrapped: the `pairing.rs` comment; a two-line prose comment at `app/src-tauri/src/commands/images/get_image_url.rs:45-46`, rewritten as one line stating why the command returns a raw path rather than a URL; and an adjacency this session's own SF2 edit created at `app/src-tauri/src/commands/images/save_image.rs:48-49`, where the new accepted-risk comment landed directly beneath a pre-existing `// Check if source file exists and get metadata` line and formed one contiguous block from two unrelated statements — the pre-existing line was removed. `cargo clippy -- -D warnings` and `cargo fmt --check` both pass after the change.

---

## Entry 2 — Redundant comments restating the following statement, across seven Rust image command files

**Source:** found by this session while scanning every touched file for the Entry 1 violation class; not raised by the code-reviewer or the architect.

**The violation.** Root CLAUDE.md — Coding style: "Use descriptive names instead of comments," whose own example marks a comment that restates the adjacent operation as the bad case. All seven files under `app/src-tauri/src/commands/images/` carry single-line comments that restate the statement immediately below them: `// Get app data directory` above the `app_data_dir()` call, `// Construct image path` above the `join(...)` call, `// Validate extension` above the `VALID_EXTENSIONS.contains` check, `// Copy file` above `fs::copy`, `// Attempt to delete the file` above `fs::remove_file`, and others of the same shape.

**Why it is out of scope for this branch.** Two reasons, both structural rather than preference. First, root CLAUDE.md's "Fix violations in files you touch" carries an explicit carve-out: "The exception is a violation so large it would dominate and obscure the task commit; fix that in a dedicated preceding `chore(<branch>):` commit before the touching SF begins." Removing these across seven files produces a diff larger than the security change itself, which is the case that carve-out describes. Second, the carve-out's remedy requires a commit *preceding* the touching sub-feature, and SF2 — the sub-feature that touched these files — is already committed as `f358b74e`, so the prescribed path is no longer available on this branch without rewriting history.

**Disposition required.** Fix now in a follow-up `chore(security-audit-sync-channel):` commit, accept as tracked debt, or route to `/refine-claude` on the grounds that the carve-out has no stated remedy for a violation discovered *after* the touching commit already landed.

---

## Entry 3 — SQL-interpolation trust-boundary rationale duplicated across two files rather than promoted to a CLAUDE.md rule

**Source:** architect cycle 1 (raised by code-reviewer as its Violation 2, classified by architect as out of scope for the architectural review loop).

**The violation.** Root CLAUDE.md — Coding style requires routing explanatory knowledge to its narrowest correct scope and states: "A comment that would need to be duplicated in more than one file is not a comment — it is a missing CLAUDE.md rule." Three comments now carry near-identical rationale for why a table name is interpolated directly into SQL and what makes that safe: `app/db/mention-search.ts` at the `searchByName` interpolation site, the same file at the `getById` interpolation site, and `app/db/_sync/apply-upsert.ts` in `executeUpsert` — the last of which explicitly ends "(mirrors mention-search.ts)", so the duplication was recognised at authoring time. Two of the three were written or rewritten by this session per SF1.

**Why the architect marked it out of scope.** The architect verified that the *guard logic* is not duplicated — each site calls its own correct gate (`isEntityType` in `mention-search.ts`, `SYNCED_TABLE_NAMES.includes` in `apply-upsert.ts`), which are deliberately different lists for deliberately different questions. Only the explanatory prose repeats, making this a comment-routing convention finding rather than a structure, layer, or ownership finding.

**Disposition required.** The rule's own remedy is a CLAUDE.md entry — the candidate being `app/db/CLAUDE.md`, stating that SQL identifier interpolation is never parameterizable and therefore always requires a fixed-allowlist guard at the interpolation site. Root CLAUDE.md bars every role including this one from editing a CLAUDE.md file directly, so this cannot be resolved on the branch: route to `/refine-claude`, or accept the duplicated comments as tracked debt.

---

## Entry 4 — `base64` dependency missing its required purpose comment

**Source:** architect cycle 1 (raised by code-reviewer as its Concern 5, classified by architect as out of scope — pre-existing and non-architectural).

**The violation.** `app/src-tauri/CLAUDE.md` — Dependencies requires every dependency in `app/src-tauri/Cargo.toml` to carry an inline `# <purpose>` comment, and that section already names this specific omission as a known miss. The `base64` entry has no such comment.

**Why it is out of scope for this branch.** Confirmed pre-existing: no commit on this branch modifies `Cargo.toml`, so "fix violations in files you touch" does not reach it. The connection to this branch is only that two files it modified — `read_image_bytes.rs` and `save_image_bytes.rs` — consume the crate.

**Disposition required.** Fix now as a one-line `chore(security-audit-sync-channel):` commit, or accept as tracked debt. Not a `/refine-claude` item: the rule already exists and is already written down; only the code is out of compliance.
