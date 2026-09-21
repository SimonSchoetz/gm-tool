# Sub-feature 2: One peer-close timeout and accurate pairing comments

The two 5-second waits for a peer to close its side of a connection share one named constant, and two pairing comments say what the code actually does. No behaviour changes.

## Files affected

`Modified:`

- `app/src-tauri/src/connectivity/mod.rs` — adds `PEER_CLOSE_TIMEOUT` and the `Duration` import it needs
- `app/src-tauri/src/connectivity/connections.rs` — the wait in `run_main_connection`'s teardown uses `PEER_CLOSE_TIMEOUT`
- `app/src-tauri/src/connectivity/pairing.rs` — the wait in `run_pairing_connection` uses `PEER_CLOSE_TIMEOUT`; two comments corrected

`Deleted:` none

`New:` none

`Moved:` none

`Draft:` none

## Layered breakdown

### Rust backend

#### `connectivity/mod.rs`

- Add `use std::time::Duration;` to the `std` imports (lines 5-6); `mod.rs` has no `Duration` import today.
- Add `pub(crate) const PEER_CLOSE_TIMEOUT: Duration = Duration::from_secs(5);` after the `EVENT_*` constants (after line 28), separated by one blank line, with no comment: the name states the purpose, and each call site's existing comment states why it waits (root Key Architectural Decisions — The peer-close wait is one crate constant).

#### `connectivity/connections.rs`

- Add `PEER_CLOSE_TIMEOUT` to the `use super::{…}` list (lines 17-21); let `cargo fmt` place it.
- Line 290: `tokio::time::timeout(Duration::from_secs(5), connection.closed())` becomes `tokio::time::timeout(PEER_CLOSE_TIMEOUT, connection.closed())`. The comment above it (line 288) stays unchanged; its closing words "the same bounded wait the pairing verifier uses" remain true.
- The `std::time::Duration` import stays; `CONNECTION_IDLE_TIMEOUT` uses it.

#### `connectivity/pairing.rs`

- Add `PEER_CLOSE_TIMEOUT` to the `use super::{…}` list (lines 11-17); let `cargo fmt` place it.
- Line 446, in `run_pairing_connection`: `tokio::time::timeout(Duration::from_secs(5), connection.closed())` becomes `tokio::time::timeout(PEER_CLOSE_TIMEOUT, connection.closed())`. The comment above it stays unchanged. The `std::time::Duration` import stays; `VERDICT_TIMEOUT` uses it.
- Line 64, the `///` doc of `evaluate_code_submit`: it says "Decides one code submitted to this device", but the function also changes the session and the trusted set. It increments `code_failures` on a wrong code, removes the candidate from `candidates` and `probing` on an accepted code or when the limit is reached, and inserts the peer into `trusted` on an accepted code. Rewrite the first sentence to say it decides one code submitted to this device and applies the outcome to the session and the trusted set, naming those three effects. Keep the second sentence (limit checked before the code is compared; a wrong code from any device counts toward the same limit) unchanged. One `///` line, no manual wrap. The function name stays. The doc of `evaluate_code_verdict` (line 97) already begins "Applies a peer's verdict" and stays unchanged.
- Line 307, the comment above `let mut sender_to_register = Some(frame_sender);` says the candidate entry "then holds the only sender". That is not true while `submit_pairing_code` runs: it clones `candidate.frame_sender` (line 190) and keeps the clone until its verdict wait ends. `request_pairing_code` also clones it (line 222), but only for its single `send`. Rewrite the comment as one line stating four things:
  - the sender moves into the session's candidate entry when the peer's hello arrives;
  - the entry is its only long-lived holder, since `request_pairing_code` and `submit_pairing_code` clone it only while they use it;
  - dropping the session or replacing the entry closes the channel and ends this task;
  - a clone held by `submit_pairing_code` ends at the same moment, because the entry also holds that call's pending verdict sender, whose drop makes `verdict_receiver.recv()` return `None`.

  Grounds for the last point: the entry stores the verdict sender at line 189. `tauri::async_runtime`'s `channel` is tokio's mpsc [spec-writer_47: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-2.11.5/src/async_runtime.rs:13-17 — as recorded in `.claude/knowledge/tauri.md`], and a tokio receiver returns `None` once every sender is dropped and its buffer is drained [spec-writer_45: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tokio-1.53.1/src/sync/mpsc/bounded.rs:185-190 — as recorded in `.claude/knowledge/tokio.md`]. Comment only.

No test changes: the constant and the comments change no behaviour, and `connectivity/` state and I/O is not unit-tested (`app/src-tauri/CLAUDE.md` — Testing).

## Checks

From `app/src-tauri/`: `cargo clippy --all-targets -- -D warnings`, `cargo fmt --check`, and `cargo test` as part of the full suite (root `CLAUDE.md` — Tool Use Discipline).
