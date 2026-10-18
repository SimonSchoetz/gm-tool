# Cargo

## `cargo check` and `cargo clippy` build only library and binary targets by default, so neither integration tests under `tests/` nor `#[cfg(test)]` unit-test modules are compiled by them

**Verified at:** cargo 1.98.0, run 2026-09-19
**Citation:** [review-decision_7: ran `cargo help check` — "When no target selection options are given, cargo check will check all binary and library targets of the selected packages"; ran `cargo clippy --help` — "See all options with cargo check --help", and `--fix` "implies --no-deps and --all-targets"] [spec-writer_53: ran `cargo clippy -- -D warnings` on a scratch copy of app/src-tauri with an `assert!(v.len() == 0)` added to a `#[cfg(test)]` module — observed exit 0; `cargo clippy --all-targets -- -D warnings` on the same copy — observed "error: length comparison to zero" and "could not compile `gm-tool` (lib test)"]

The library target is checked without `cfg(test)`, so a unit-test module inside `src/` is skipped as well. A test target is checked only with `--tests`, `--all-targets`, or by `cargo test`, which compiles and runs it with rustc, not clippy. A check suite made of `cargo clippy` and `cargo fmt --check` alone never lints a `tests/*.rs` file or a `#[cfg(test)]` module.

## In the default Cargo home, a crate source sits at `~/.cargo/registry/src/<index-directory>/<crate>-<version>/`, not directly under `src/`

**Verified at:** cargo 1.98.0, run 2026-10-18
**Citation:** [refine-claude_3: ran `ls -d ~/.cargo/registry/src/*/tap-1.0.1 ~/.cargo/registry/src/tap-1.0.1` — observed `/Users/simonschoetz/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tap-1.0.1` listed and `/Users/simonschoetz/.cargo/registry/src/tap-1.0.1: No such file or directory`]

To read a crate's source, glob `~/.cargo/registry/src/*/<crate>-<version>/` with the version taken from `Cargo.lock`.
