# Friction brief — security hardening implementation

Produced by an `/implement` session on branch `docs/security-audit-sync-channel`, implementing `app/docs/SPEC_SECURITY_HARDENING.md` (six sub-features: mention-search injection guard, image id path-traversal guard, pairing failure counter, defense-in-depth, Content Security Policy, audit retirement).

## Implementation friction

### 1. SF5's mandated runtime verification cannot be performed by the implementing agent

**What happened.** SF5 (Content Security Policy) states in its Verification section that both verification passes are "required before this sub-feature is committed": pass 1 launches `pnpm run dev` and pass 2 launches a `pnpm run build` bundle, and each requires observing six behaviors "with the webview devtools console open and watching for `Content Security Policy` violation reports" — boot with no violation, IBM Plex Sans rendering rather than a fallback, an image displaying through the asset protocol, `@` mention results returning, the pairing dialog showing a 6-digit code, and the updater check completing without a console error.

**Phase.** Implementation phase, SF5, at the point of committing.

**Why it blocked.** A Tauri application renders in a native OS webview window. The browser tooling available to the implementing agent drives a separate in-app browser and cannot attach to that webview, read its console, or observe CSP violation reports. No amount of automation available in this harness satisfies the spec's stated precondition. What *was* verifiable: `tauri build` deserializes `tauri.conf.json` at compile time, so a successful release build proves the `csp` and `devCsp` object shapes are accepted and that Tauri's compile-time hash/nonce rewriting did not fail. It proves nothing about any of the six runtime behaviors.

**How it was resolved.** Surfaced to the user as a blocking question with three options (user verifies then agent commits / commit now and verify during manual fix mode / defer SF5 entirely). The user chose to commit now and treat the six checks as a manual verification item. SF5 is committed as `ece5963c`.

**Source of the friction.** Not an agent-definition gap and not a missing CLAUDE.md rule. The spec authored a verification requirement in the imperative ("Both passes are required before this sub-feature is committed") without stating who performs it, in a harness where the implementing agent provably cannot. The gap is that a spec's verification step has no way to declare that a human, not the implementer, is the actor — so an imperative reads as an implementer obligation by default.

### 2. Branch type no longer matches the work the branch now carries

**What happened.** The session began on branch `docs/security-audit-sync-channel`, created for the audit that produced the findings. The spec being implemented is a security *fix*, not documentation. `/implement`'s pre-implementation phase creates a new branch only when the current branch is `main`, so implementation continued on the existing branch, and every commit scope mirrors it: `fix(security-audit-sync-channel): ...`.

**Phase.** Pre-implementation phase.

**Why it is friction rather than a violation.** Root CLAUDE.md permits a commit type other than the branch type when the content unambiguously falls in that category, so `fix(...)` on a `docs/`-typed branch is compliant. But the scope word — `security-audit-sync-channel` — now labels seven commits that implement fixes rather than perform an audit, and the branch's own type prefix says `docs` while five of its eight commits change Rust and TypeScript source.

**How it was resolved.** Continued on the branch per `/implement`'s explicit rule, and stated the reasoning to the user before the first commit rather than switching silently.

**Source.** A gap in `/implement`'s pre-implementation phase: it handles "you are on `main`, derive a branch" but has no case for "you are on a non-`main` branch whose type no longer describes the work about to land on it."

### 3. A code-reviewer citation was fabricated

**What happened.** The cycle-1 code-reviewer justified its first violation by citing `root CLAUDE.md — Behavior Rules` as containing the text "Pre-existing violations are violations — age is not a downgrade factor." The architect verified against the file and found that root CLAUDE.md has no "Behavior Rules" section and that the quoted phrase appears nowhere in it; "Behavior Rules" is a section in the code-reviewer's own agent definition, which it conflated with the convention file.

**Phase.** Review loop, cycle 1.

**Why it matters even though the finding survived.** The underlying violation (a manually wrapped code comment) was real and was fixed, so the branch outcome is unaffected. The concern is that a review verdict presented a fabricated quotation as a rule citation, and only an independent verification pass caught it. Root CLAUDE.md's Epistemological Discipline requires a citation to name a verified source; a review finding whose stated authority does not exist would, absent the architect check, propagate into a fix commit justified by a rule nobody wrote.

**How it was resolved.** No branch action. The architect's citation check is recorded here as the catch.

### 4. Decision made under ambiguity: fixing a violation the architect scoped out

**The question.** The cycle-1 reviewer flagged a manually wrapped comment at `app/src-tauri/src/connectivity/pairing.rs:405-406`, in a file this session modified for SF3. The architect classified it as out of scope for the architectural review loop (a comment-formatting convention, not a structure/layer/ownership finding) and returned a no-violations verdict, which exited the loop.

**What was chosen.** The comment was unwrapped anyway, together with two further instances found by scanning every file this session touched: a two-line prose comment at `app/src-tauri/src/commands/images/get_image_url.rs:45-46`, and an adjacency this session's own SF2 edit created at `app/src-tauri/src/commands/images/save_image.rs:48-49`, where a newly inserted accepted-risk comment landed directly beneath a pre-existing `// Check if source file exists and get metadata` line, forming a single visually contiguous block from two unrelated statements. Committed separately as `7c3ad78c`, a `chore(...)` commit.

**Why, and why it was not surfaced as a question.** Root CLAUDE.md's "Fix violations in files you touch" binds every write role independently of what any review loop scopes in: "When any write-role Claude instance reads a file to edit it, fix every CLAUDE.md violation found in that file — not just those related to the current task." The architect's scoping governs what the architectural loop raises, not what the implementer owes. `/implement`'s own Ambiguity invariant names cleanup as explicitly non-ambiguous ("Cleanup and dead code removal are not ambiguous — act on them"), so asking would have been the wrong move.

**What was deliberately *not* done, and is a live question for the user.** The same scan surfaced a much larger, purely pre-existing pattern across all seven Rust image command files: single-line comments that restate the immediately following statement — `// Get app data directory`, `// Construct image path`, `// Validate extension`, `// Copy file`, `// Attempt to delete the file`. Root CLAUDE.md's "Use descriptive names instead of comments" targets exactly this. Removing them across seven files would produce a diff larger than the security change itself, which is the case root CLAUDE.md's own carve-out anticipates ("The exception is a violation so large it would dominate and obscure the task commit; fix that in a dedicated preceding `chore(<branch>):` commit"). Since that carve-out requires a *preceding* commit and the touching sub-features are already committed, the clean path no longer exists on this branch. It is listed in the deferred violations brief for disposition rather than resolved unilaterally.

### 5. The post-loop manual-verification scan cannot see this branch's manual-verification item

**What happened.** `/implement`'s post-loop advisory scans include grepping "the spec file(s) for this branch for the literal marker `[MANUAL-VERIFY]`". That grep returns nothing across all seven spec files. Meanwhile SF3 instructed a marker of a different shape — an unbracketed `// MANUAL-VERIFY:` comment placed in Rust source rather than in the spec — which was implemented at `app/src-tauri/src/connectivity/pairing.rs`, directly above the `let failures = { ... }` block, reading: "from a second device, submit three wrong codes, let the connection close, then reconnect and submit a fourth. The fourth must be rejected immediately without granting a fresh three attempts."

**Phase.** Post-loop advisory scans.

**Why it is a real gap and not a naming quibble.** The scan exists so an untested interaction cannot exit the session unannounced. Here a genuine untested interaction exists, the spec deliberately marked it, and the scan reported clean — because the marker's literal form and its location both differ from what the scan matches. A session that trusted the scan's empty result would have closed with the pairing-reconnect behavior silently unverified. It is reported to the user in this session only because the item was noticed while reading SF3, not because any scan found it.

**Source.** A mismatch between two instruction files: the marker shape and location `/implement`'s scan searches for, and the marker shape and location a spec-writer actually emits. Either the scan must also match the unbracketed form in source files, or spec-writer must be required to place the bracketed literal in the spec file whenever it places a marker in source.

## Instruction gaps

Both were surfaced by the cycle-1 code-reviewer, tagged `[INSTRUCTION GAP]` by it, and confirmed as instruction gaps rather than violations by the architect. Neither blocked the branch.

1. **No CSP or security-header convention exists.** The reviewer questioned `style-src 'unsafe-inline'`, present in both the `csp` and `devCsp` blocks this branch added to `app/src-tauri/tauri.conf.json`, as measurably narrowing what the hardening buys against style-based injection. No CLAUDE.md file states any position on Content Security Policy posture, so there was no rule to check the choice against. Context for whoever writes such a convention: the spec's stated rationale is that Tauri's compile-time nonce injection covers only `<style>` elements present in the built `index.html`, so a style element a library injects at runtime would be blocked, and that the directive load-bearing for the database-compromise chain the policy exists to break is `script-src`, which carries no `'unsafe-inline'`.

2. **No Rust unit-testing convention exists.** `app/src-tauri/CLAUDE.md`'s Testing section reads `TODO: Add testing patterns when implemented`, so the Rust gate for this repository is `cargo clippy -- -D warnings` plus `cargo fmt --check` and nothing else. This branch added `is_valid_image_id` to `app/src-tauri/src/commands/images/mod.rs` — the trust-boundary function all six image commands now depend on for path-traversal rejection — with zero test coverage, and no convention was violated by doing so. A character-class predicate over a string is the easiest possible thing to unit test, which makes it a useful concrete case for whoever writes that section.

## Concerns

Every item here was raised during the review loop and left unfixed on this branch. None blocked loop exit.

1. **The `0600` device-key tightening never retrofits an existing key file.** `load_or_create_secret_key` in `app/src-tauri/src/connectivity/identity.rs` returns early through its `key_path.exists()` branch, so `fs::set_permissions` runs only on the creation path. Any device that already has a `device.key` written by a pre-hardening version keeps whatever mode the original `fs::write` plus process umask produced, permanently. The reviewer framed this as an unacknowledged gap; the architect ruled it a deliberate documented decision, since the spec states "re-permissioning files the app did not just create is out of scope and would need its own migration decision." Recorded as a concern because the practical consequence stands regardless of which framing is right: on Unix, existing installs get no benefit from this change.

2. **The new registry schema-shape test may be tautological.** `app/db/_sync/__tests__/registry.test.ts` gained `should expose a schema whose shape matches the column list for every table`, asserting `Object.keys(table.zodSchema.shape)` equals `table.columns`. Both sides derive from the same expression inside the `syncedTable` helper in `app/db/_sync/registry.ts`, so the assertion cannot fail for any entry built through the helper. It can only fail for an entry hand-written as an object literal that bypasses the helper — which is precisely the regression the spec says it exists to catch. Whether that makes it worthwhile or dead weight is a judgement call left open; the test is committed as the spec specified it.

3. **`extension` is validated at the message edge for neither payload, while `imageId` now is.** `app/domain/sync/messages.ts` applies `IMAGE_ID_REGEX` to `imageId` on both `file-request` and `file-chunk`, but leaves `extension` as a bare `z.string()`. Both fields feed the same joined filesystem path in Rust. The architect ruled the asymmetry a stated DRY trade-off rather than an inconsistency, since the spec's reason is that copying the five-member `VALID_EXTENSIONS` list into Zod "would create a second copy that drifts the moment a format is added." Not a security hole — Rust enforces the allowlist on every one of the six commands after this branch.

4. **`base64` in `app/src-tauri/Cargo.toml` carries no purpose comment.** `app/src-tauri/CLAUDE.md`'s Dependencies section requires an inline `# <purpose>` comment on every dependency, and names this exact omission as already known. Two files this branch modified (`read_image_bytes.rs`, `save_image_bytes.rs`) consume the crate. Confirmed pre-existing: no commit on this branch touches `Cargo.toml`, so "fix violations in files you touch" does not reach it.
