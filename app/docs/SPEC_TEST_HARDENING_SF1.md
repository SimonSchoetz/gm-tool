# SF1 — Pairing trust, attempt limit and connection teardown

A device becomes trusted only by submitting the correct code to this device, or by accepting a code this device submitted and is still waiting on, and three wrong codes in total end the pairing session. Forgetting a device closes its live connection and reports it disconnected, and closing the pairing dialog ends every candidate connection. The pairing checks and the rule that picks between two simultaneous connections become pure functions with unit tests — the first `#[cfg(test)]` modules under `app/src-tauri/src/`.

## Files affected

- Modified: `app/src-tauri/src/connectivity/mod.rs` — `is_preferred_direction` added next to `ConnectionRole`, with a `#[cfg(test)]` module.
- Modified: `app/src-tauri/src/connectivity/pairing.rs` — session-wide failure counter; `PairingCandidate` gains `connection_id`; two pure decision functions and their `#[cfg(test)]` module; the frame loop calls them; a candidate entry is replaced only by the preferred connection; the task no longer keeps its own `frame_sender`; the comments at lines 25 and 239 rewritten and the `MANUAL-VERIFY` comment at line 319 deleted.
- Modified: `app/src-tauri/src/connectivity/connections.rs` — `run_main_connection` uses `is_preferred_direction`, moves its sender into the map, identifies its entry by `Connection::stable_id()`, waits for the peer to close after its channel closes, and emits the disconnect event unless superseded; `remove_peer`'s comment rewritten.

`commands/connectivity/*.rs` delegate unchanged, and the connectivity module's `pub use` lines in `mod.rs` (:13-16) are unchanged: every new item is `pub(crate)`.

## Rust backend

### Preferred direction (`mod.rs`)

Add below `ConnectionRole` (mod.rs:91-95):

```rust
pub(crate) fn is_preferred_direction(
    role: ConnectionRole,
    own: Option<EndpointId>,
    remote: EndpointId,
) -> bool
```

It returns the expression `run_main_connection` computes today (connections.rs:203-209): `own < remote` for a `Dialer`, `remote < own` for an `Acceptor`, and `false` when `own` is `None`. Doc comment: the preferred connection between two devices is the one dialed by the smaller endpoint id, which both devices compute identically; a missing own id means connectivity is shutting down, so no connection is preferred — the explanation the inline match's comment gives today (connections.rs:207), which goes with the match. `run_main_connection` replaces its inline `match` with a call to it; the surrounding comment (:193-198) stays.

### Session-wide attempt limit (`pairing.rs`)

- `PairingSession.code_failures` changes from `HashMap<EndpointId, u8>` to `u8`: the number of wrong codes submitted in this session by any device. It is initialized to `0` in `enter_pairing_mode` (pairing.rs:73) and never reset; it ends with the session. Replace the comment above the field (pairing.rs:25) with one stating that the count is session-wide because endpoint ids are free to generate, so a per-device count would not bound guesses, and that it ends with the session, whose code rotates when the dialog is reopened.
- `MAX_CODE_FAILURES` stays `3`.

### `PairingCandidate` knows its connection (`pairing.rs`)

Add `pub(crate) connection_id: usize` to `PairingCandidate` — the `Connection::stable_id()` of the connection that registered the candidate.

### Pure decision functions (`pairing.rs`)

Add, below `PairingFrame`, two `pub(crate)` outcome enums and two `pub(crate)` functions. Neither is `async`, neither takes a lock, and neither sends a frame or emits an event — the caller does all I/O after the function returns.

```rust
pub(crate) enum CodeSubmitOutcome {
    Accepted,
    Rejected,
    LimitReached,
}

pub(crate) fn evaluate_code_submit(
    session: &mut PairingSession,
    trusted: &mut HashSet<EndpointId>,
    remote: EndpointId,
    code: &str,
) -> CodeSubmitOutcome

pub(crate) enum CodeVerdictOutcome {
    Ignored,
    Accepted(Sender<bool>),
    Rejected(Sender<bool>),
}

pub(crate) fn evaluate_code_verdict(
    session: &mut PairingSession,
    trusted: &mut HashSet<EndpointId>,
    remote: EndpointId,
    accepted: bool,
) -> CodeVerdictOutcome
```

`evaluate_code_submit`, in this order:

1. When `session.code_failures >= MAX_CODE_FAILURES`: remove `remote` from `session.candidates` and `session.probing`, return `LimitReached`. The code is not compared.
2. When `code == session.code`: remove `remote` from `session.candidates` and `session.probing`, insert it into `trusted`, return `Accepted`.
3. Otherwise increment `session.code_failures`; when it has reached `MAX_CODE_FAILURES`, remove `remote` from `session.candidates` and `session.probing` and return `LimitReached`; else return `Rejected`.

`evaluate_code_verdict`:

1. When `remote` is not in `session.candidates`, return `Ignored`.
2. Take the candidate's `pending_verdict`. When it is `None`, or its sender `is_closed()` (the submitter stopped waiting: `submit_pairing_code` timed out after `VERDICT_TIMEOUT` and dropped its receiver, pairing.rs:131-136), return `Ignored`: the candidate stays listed and nobody is trusted; clearing the stale sender out of `pending_verdict` is the only change.
3. When `accepted`: remove `remote` from `session.candidates` and `session.probing`, insert it into `trusted`, return `Accepted(sender)`.
4. Otherwise return `Rejected(sender)`.

### Frame loop (`run_pairing_connection`, `pairing.rs`)

In the three arms below, lock the state, reborrow the guard as `let data = &mut *guard;` so `data.pairing`, `data.trusted` and `data.endpoint` are borrowed as disjoint fields, and break the loop when `data.pairing` is `None` (as today). Drop the guard before any `.await` or `app.emit`.

- `PairingHello { name, .. }` (pairing.rs:272-290): after taking `sender_to_register` and finding the session, when `session.candidates` already holds `remote` and `is_preferred_direction(role, data.endpoint.as_ref().map(|endpoint| endpoint.id()), remote)` is `false`, drop the sender and break the loop: the other device keeps the preferred connection as its candidate too (root KAD "A connection task ends when its map entry goes"). Otherwise insert the candidate as today with `connection_id: connection.stable_id()` — replacing an existing entry ends that entry's task, whose teardown then finds a different `connection_id` and emits nothing — and emit `EVENT_PAIRING_CANDIDATE` as today.
- `CodeSubmit { code }`: call `evaluate_code_submit(session, &mut data.trusted, remote, &code)`, then:
  - `Accepted` — `send_verdict(true)`, set `sent_accept_verdict = true`, emit `EVENT_PAIRING_SUCCEEDED` with `candidate_name`, set `succeeded = true`, break — today's success path (pairing.rs:309-317).
  - `Rejected` — `send_verdict(false)` and continue.
  - `LimitReached` — `send_verdict(false)`, emit `EVENT_PAIRING_FAILED` with reason `"attempt limit reached"`, break.
  - Delete the `MANUAL-VERIFY` comment at pairing.rs:319; the unit tests below cover its scenario.
- `CodeVerdict { accepted }`: call `evaluate_code_verdict(session, &mut data.trusted, remote, accepted)`, then:
  - `Ignored` — continue.
  - `Accepted(sender)` — `let _ = sender.try_send(true);`, emit `EVENT_PAIRING_SUCCEEDED`, set `succeeded = true`, break.
  - `Rejected(sender)` — `let _ = sender.try_send(false);` and continue.

### Pairing task holds no sender of its own (`run_pairing_connection`, `pairing.rs`)

- Create the channel as today (pairing.rs:238) and move `frame_sender` into `sender_to_register` without cloning. Rewrite the comment at pairing.rs:239: once the hello registers the candidate, the session's candidate entry holds the only sender, so dropping the session or replacing the entry closes the channel and ends this task.
- Teardown (pairing.rs:381-393): `owns_entry` is `candidate.connection_id == connection.stable_id()` instead of `same_channel`.
- `exit_pairing_mode`'s comment at pairing.rs:98 is accurate after this change and is kept.

### Main connection task holds no sender of its own (`run_main_connection`, `connections.rs`)

- Keep `let (sender, mut receiver) = channel::<String>(32);` (connections.rs:191) and add `let connection_id = connection.stable_id();` after it. Above the channel line, add a comment: the map entry must hold the only sender, because `remove_peer` ends this task by removing the entry, and the task recognizes its own entry by `connection_id` rather than by keeping a sender — a clone kept here would leave a forgotten peer connected, and no test would notice. In the two branches that insert an `ActiveConnection` (:221-242), move `sender` into the entry instead of cloning it; the early-return branch (:216-220) drops it with the function.
- Declare `let mut channel_closed = false;` before `if let Ok((mut send_stream, mut recv_stream)) = streams {` (:260). In the loop's `None` arm (:272) set it to `true` before `break`.
- After that `if let` block's closing brace (:294) and before `connection.close(...)` (:296): when `channel_closed` is true, `let _ = tokio::time::timeout(Duration::from_secs(5), connection.closed()).await;`. Its comment states the mechanism: the entry was removed after every queued frame (such as an `unpair` envelope sent just before `remove_trusted_peer`) was written; the streams have just been dropped, which finishes the send stream, so the peer reads end-of-stream and closes; waiting for that close keeps a local close from discarding the last frame in flight — the same bounded wait the pairing verifier uses. `Duration` is already imported (connections.rs:4).
- Replace the identity check (:298-311) with the entry's connection id:
  - entry present and `current.connection.stable_id() == connection_id` → remove it and emit `EVENT_PEER_DISCONNECTED` (as today);
  - entry absent → emit `EVENT_PEER_DISCONNECTED` (`remove_peer` removed it);
  - entry present with a different connection id → do nothing: a newer connection superseded this one and the peer stays connected.
- `remove_peer` (:110-117): rewrite the comment at :114 — removing the entry drops the only sender, so the connection task writes any queued frames, finishes its stream, waits briefly for the peer to close, closes the connection and reports the peer disconnected.

### Unit tests

Plain `#[test]` functions, which can create and use tokio channels with no runtime (`.claude/knowledge/tokio.md` — "A tokio bounded channel works without a runtime for creation, `try_send` and `is_closed`, and `is_closed()` turns true once the receiver is dropped"). Endpoint ids come from `iroh::SecretKey::from_bytes(&[n; 32]).public()` with distinct `n` (`.claude/knowledge/iroh.md` — "`iroh::SecretKey::from_bytes(&[u8; 32]).public()` builds a deterministic `EndpointId` without networking"). Outcomes carry `Sender<bool>`, which implements neither `PartialEq` nor `Eq`, so they are asserted with `assert!(matches!(outcome, CodeVerdictOutcome::Accepted(_)))`.

`#[cfg(test)] mod tests` at the bottom of `mod.rs`:

| Test | Defect it catches |
| --- | --- |
| for a connection dialed by device A, A (as `Dialer`) and B (as `Acceptor`) get the same answer, for both orderings of the two ids | the two devices disagreeing, so each keeps a different connection and closes the other's |
| of the connection A dialed and the connection B dialed, exactly one is preferred | both or neither kept, so duplicate connections survive or both close |
| `own` of `None` returns `false` | a shutting-down endpoint keeping a new connection |

`#[cfg(test)] mod tests` at the bottom of `pairing.rs`, with a helper that builds a `PairingSession` with code `"123456"` and registers candidates with a fresh `channel::<PairingFrame>(1)` sender and `connection_id: 0`, inserting each registered candidate's id into `session.probing` as well, as the live flow does (pairing.rs:181), so a path that forgets to remove it fails; tests that need a live verdict keep the verdict receiver bound:

| Test | Defect it catches |
| --- | --- |
| an accept verdict from a candidate this device never submitted a code to returns `Ignored` and leaves `trusted` empty and the candidate listed | a verdict trusting the peer without a pending submission |
| an accept verdict whose waiter has dropped its receiver returns `Ignored`, trusts nobody, keeps the candidate listed and leaves its `pending_verdict` `None` | a late accept after the submit timed out still trusting the peer, or the candidate dropped from the session while the frontend still lists it |
| an accept verdict for a pending submission returns `Accepted`, inserts the remote into `trusted` and removes the candidate | the requested path no longer creating trust |
| a reject verdict for a pending submission returns `Rejected`, trusts nobody and clears `pending_verdict` | a rejection treated as acceptance, or the pending sender left set |
| the correct code returns `Accepted`, inserts the remote into `trusted` and removes it from `candidates` and `probing` | the success path losing the trust insert or leaving the candidate listed |
| two wrong codes return `Rejected` and a third returns `LimitReached` and removes that candidate | an off-by-one in the limit, or the limit never triggering |
| after three wrong codes from one device, the correct code from a second device returns `LimitReached` and trusts nobody | the counter being per device again, or the comparison running before the limit check |
| wrong codes from three different devices lock the session for a fourth | failures from different devices not adding up |

## Hand-off items for the human tester

These need two devices on one LAN, which an agent session cannot drive. The same run also covers the Rust dependency update that landed on `main` without a two-device check.

- Pair two devices; confirm both list each other and sync an edit.
- Open the pairing dialog on both devices at the same moment: each lists the other as a candidate, and the list stays stable for a minute.
- On one device, forget the other while both are connected: the forgotten device disappears from the connected list on both, and the other device removes the pairing within a few seconds (it received the `unpair` message).
- Open the pairing dialog on both devices, then close it on one: the other device's candidate list drops that device.
- Open the dialog on both devices. On device A, pick device B and enter a wrong code; A's dialog then shows only its error panel, so close and reopen A's dialog, pick B again and enter another wrong code, keeping B's dialog open throughout. After the third wrong code, B's dialog shows the "attempt limit reached" error. Close and reopen B's dialog: a new code is shown and pairing with it succeeds.
