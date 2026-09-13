# SF3 — Pairing failure counter per endpoint

The pairing code is a 6-digit value drawn from the `rand` crate's CSPRNG and rotated per session, and three wrong submissions close the connection. The counter, however, lives on `PairingCandidate`, which is created fresh on each `PairingHello` and dropped with its connection. An attacker on the LAN during an open pairing window reconnects and gets three more guesses against a zeroed counter, indefinitely — three guesses per connection against a 6-digit space with unlimited connections is tractable. This sub-feature moves the counter to the session so it survives reconnects for as long as the pairing dialog stays open.

## Files affected

`Modified:`

- `app/src-tauri/src/connectivity/pairing.rs` — add `code_failures` to `PairingSession`, remove `failures` from `PairingCandidate`, rewrite the failure-counting block in the `CodeSubmit` arm

No other file is affected. `PairingSession` and `PairingCandidate` are both `pub(crate)` and both declared in this file; a scan of `app/src-tauri/src/` finds `PairingSession { ... }` constructed once, at the fresh-session branch of `enter_pairing_mode`, and `PairingCandidate { ... }` constructed once, in the `PairingHello` arm of `run_pairing_connection`, with `failures` read only inside the `CodeSubmit` arm of the same function.

## Rust backend

### `PairingSession`

Add a field below `probing`:

```rust
    // Keyed by endpoint id and never cleared on failure: the counter must outlive the connection it was incremented on, or an attacker resets the attempt limit by reconnecting. It dies with the session, which ends when the user closes the pairing dialog and the code rotates.
    pub(crate) code_failures: HashMap<EndpointId, u8>,
```

`HashMap` and `EndpointId` are both already imported at the top of the file.

In `enter_pairing_mode`, the single `PairingSession { ... }` literal gains `code_failures: HashMap::new(),`.

### `PairingCandidate`

Remove the field `pub(crate) failures: u8,` entirely, and remove the `failures: 0,` line from the `PairingCandidate { ... }` literal in the `PairingHello` arm. The field has no reader once the `CodeSubmit` arm below is rewritten; leaving it would fail `cargo clippy -- -D warnings` on `dead_code`, and root CLAUDE.md's re-derive-types-after-refactor rule requires its removal regardless.

### The `CodeSubmit` arm

Replace the failure-counting block — currently the `let failures = match session.candidates.get_mut(&remote) { ... };` expression, which resolves a missing candidate to `MAX_CODE_FAILURES` — with:

```rust
                            let failures = {
                                let count = session.code_failures.entry(remote).or_insert(0);
                                *count += 1;
                                *count
                            };
```

The `match` fallback disappears with it. It existed only to produce a terminal value when the candidate entry was gone; the session-level map has no such gap, since `entry(remote).or_insert(0)` creates the entry on first use and the entry is never removed.

The `if failures >= MAX_CODE_FAILURES { ... }` branch below is unchanged and still removes the candidate from `session.candidates` and `session.probing`, sends the rejecting verdict, emits `EVENT_PAIRING_FAILED`, and breaks the connection loop. Do not add a `code_failures` removal to that branch — the entry surviving the candidate's removal is the entire point of the change.

The successful-match branch above (`if code == session.code`) is unchanged and leaves `code_failures` untouched. The session is dropped whole on `exit_pairing_mode`, which takes the map with it.

The borrow sequence is valid as written: the inner block's mutable borrow of `session.code_failures` ends at the block's closing brace, before the `if failures >= MAX_CODE_FAILURES` branch takes its own mutable borrow of `session.candidates`.

### Manual verification

`app/src-tauri/CLAUDE.md`'s Testing section reads `TODO: Add testing patterns when implemented`, and the Rust gate for this repository is `cargo clippy -- -D warnings` plus `cargo fmt --check`, both run from `app/src-tauri/`. There is no Rust test harness to add a case to. Add this comment directly above the `let failures = { ... }` block:

```rust
                            // MANUAL-VERIFY: from a second device, submit three wrong codes, let the connection close, then reconnect and submit a fourth. The fourth must be rejected immediately without granting a fresh three attempts.
```

Single unwrapped line, stating the scenario in terms of the observable behavior rather than naming any document.
