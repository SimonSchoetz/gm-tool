# Cargo

## `cargo check` and `cargo clippy` build only library and binary targets by default, so integration tests under `tests/` are never compiled by them

**Verified at:** cargo 1.98.0, run 2026-09-19
**Citation:** [review-decision_7: ran `cargo help check` — "When no target selection options are given, cargo check will check all binary and library targets of the selected packages"; ran `cargo clippy --help` — "See all options with cargo check --help", and `--fix` "implies --no-deps and --all-targets"]

A test target is checked only with `--tests`, `--all-targets`, or by `cargo test`, which compiles and runs it. A check suite made of `cargo clippy` and `cargo fmt --check` alone never compiles a `tests/*.rs` file.
