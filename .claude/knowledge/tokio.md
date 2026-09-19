# tokio

## A tokio mpsc receiver returns `None` only after every sender is dropped and its buffer is drained

**Verified at:** tokio 1.53.1 (Cargo.lock)
**Citation:** [spec-writer_45: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tokio-1.53.1/src/sync/mpsc/bounded.rs:185-190 — "returns `None` if the channel has been closed and there are no remaining messages in the channel's buffer … The channel is closed when all senders have been dropped, or when [`close`] is called"]

A task that keeps one clone of a `Sender` for itself never sees `recv()` return `None`, however many other clones are dropped. Messages sent before the last sender is dropped are still received before the `None`, so a frame queued just before its channel is closed is not lost.

## A tokio bounded channel works without a runtime for creation, `try_send` and `is_closed`, and `is_closed()` turns true once the receiver is dropped

**Verified at:** tokio 1.53.1, run 2026-09-19
**Citation:** [spec-writer_46: ran `cargo test --offline` on a scratch crate depending on tokio =1.53.1 (feature `sync`) — observed a plain `#[test]` creating `channel::<bool>(1)`, `try_send(true)` returning `Ok`, `is_closed()` false, then true after dropping the receiver, and `try_send` returning `Err`]

Synchronous unit tests can build channels and hold senders in structs without `#[tokio::test]`. A sender whose receiver has gone reports `is_closed()`, which distinguishes a live waiter from an abandoned one.
