# Cargo

## `cargo check` and `cargo clippy` build only library and binary targets by default, so neither integration tests under `tests/` nor `#[cfg(test)]` unit-test modules are compiled by them

**Verified at:** cargo 1.98.0, run 2026-09-19
**Citation:** [review-decision_7: ran `cargo help check` — "When no target selection options are given, cargo check will check all binary and library targets of the selected packages"; ran `cargo clippy --help` — "See all options with cargo check --help", and `--fix` "implies --no-deps and --all-targets"] [spec-writer_53: ran `cargo clippy -- -D warnings` on a scratch copy of app/src-tauri with an `assert!(v.len() == 0)` added to a `#[cfg(test)]` module — observed exit 0; `cargo clippy --all-targets -- -D warnings` on the same copy — observed "error: length comparison to zero" and "could not compile `gm-tool` (lib test)"]

The library target is checked without `cfg(test)`, so a unit-test module inside `src/` is skipped as well. A test target is checked only with `--tests`, `--all-targets`, or by `cargo test`, which compiles and runs it with rustc, not clippy. A check suite made of `cargo clippy` and `cargo fmt --check` alone never lints a `tests/*.rs` file or a `#[cfg(test)]` module.
