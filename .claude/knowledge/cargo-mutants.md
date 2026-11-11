# cargo-mutants

## `cargo mutants` exits 0 when every mutant is caught, 2 when some are missed, 3 on a timeout, 4 when the unmutated baseline fails, 5 when a diff does not match the tree, 6 on an invalid diff

**Verified at:** cargo-mutants 27.1.0
**Citation:** [architect_1: `https://mutants.rs/exit-codes.html`]

## cargo-mutants' `exit_code` returns the timeout code (3) whenever a mutant timed out, ahead of the missed code (2), so 2 means some mutants were missed and none timed out

**Verified at:** cargo-mutants 27.1.0
**Citation:** [implement_1: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/cargo-mutants-27.1.0/src/outcome.rs:110`]

`exit_code` checks a failed baseline first, then `self.timeout > 0`, then `self.missed > 0`; no run with both a timed-out and a missed mutant was observed.

## `cargo mutants --in-diff <file>` tests only the mutants that overlap a changed line, which for a changed line inside a function includes that function's whole-body replacements

**Verified at:** cargo-mutants 27.1.0
**Citation:** [architect_1: `https://mutants.rs/in-diff.html`], [implement_1: ran `cargo mutants --in-diff <diff> --list` in `app/src-tauri/` for a one-hunk diff changing line 107 of `src/connectivity/mod.rs`, whose `is_preferred_direction` spans lines 100-111 — observed 5 mutants, 2 on line 106 (`replace is_preferred_direction -> bool with true` and `with false`) and 3 on line 107]

The diff's paths were relative to the package directory (`src/connectivity/mod.rs`) and were accepted.

## `cargo mutants --in-diff <file>` refuses a diff whose new side differs from the source file, printing "Diff content doesn't match source file"

**Verified at:** cargo-mutants 27.1.0
**Citation:** [implement_1: ran `cargo mutants --in-diff <diff> --list` in `app/src-tauri/` with a diff adding a trailing space to line 107 of `src/connectivity/mod.rs` while the file lacked that space — observed that message, no mutant listed and an ERROR line]

The diff must therefore be taken against the working tree that cargo-mutants copies.

## `cargo mutants` reads `.cargo/mutants.toml` from the package directory, and `exclude_globs` and `exclude_re` there drop mutants from the run

**Verified at:** cargo-mutants 27.1.0
**Citation:** [architect_1: `https://mutants.rs/skip_files.html`, `https://mutants.rs/filter_mutants.html`], [implement_1: ran `cargo mutants --list` in `app/src-tauri/` without and then with `app/src-tauri/.cargo/mutants.toml` — observed mutants of `src/commands/connectivity/*.rs`, `src/connectivity/connections.rs` and `src/connectivity/identity.rs` listed without it and none of them with it, and the mutants of the eight `pairing.rs` functions `exclude_re` names gone]

`exclude_globs` entries with a path separator match from the package directory (`src/commands/connectivity/**`); `exclude_re` is matched against a mutant's full name, `<file>:<line>:<column>: <change>`.

## `cargo mutants --list --json` in `app/src-tauri/` lists no mutant in `vendor/` or `tests/`

**Verified at:** cargo-mutants 27.1.0
**Citation:** [implement_1: ran `cargo mutants --list --json` in `app/src-tauri/` — observed every mutant's `file` under `src/`]

The vendored `iroh-mdns-address-lookup` crate (`app/src-tauri/vendor/`) and the integration test `app/src-tauri/tests/tauri_config.rs` are therefore not mutated there.

## `cargo mutants` run from `app/src-tauri/` writes its report to `app/src-tauri/mutants.out/`

**Verified at:** cargo-mutants 27.1.0
**Citation:** [implement_1: ran `cargo mutants --in-diff <diff>` in `app/src-tauri/` — observed `app/src-tauri/mutants.out/` holding `outcomes.json`, `missed.txt`, `caught.txt` and `mutants.json`]

## `cargo mutants --list --json` prints an array of mutants with `file`, `name` (`<file>:<line>:<column>: <change>`), `span` and `function`

**Verified at:** cargo-mutants 27.1.0
**Citation:** [implement_1: ran `cargo mutants --list --json` in `app/src-tauri/` — observed an entry with `file` `src/connectivity/mod.rs`, `name` `src/connectivity/mod.rs:106:5: replace is_preferred_direction -> bool with true`, `span.start` `{line: 106, column: 5}` and `function.function_name` `is_preferred_direction`, besides `diff`, `genre`, `package` and `replacement`]

## `mutants.out/outcomes.json` holds an `outcomes[]` entry for the baseline run and one for each tested mutant, each with `scenario` and `summary`

**Verified at:** cargo-mutants 27.1.0
**Citation:** [implement_1: ran `cargo mutants --in-diff <diff>` in `app/src-tauri/` and read `mutants.out/outcomes.json` — observed 6 `outcomes[]` entries for 5 mutants, the first `{scenario: "Baseline", summary: "Success"}`, the others `{scenario: {Mutant: {name, file, function, span, replacement, genre}}, summary: "CaughtMutant" | "MissedMutant"}`, and the totals `total_mutants`, `missed`, `caught`, `timeout`, `unviable`]

A mutant entry's `summary` also carries `log_path`, `diff_path` and `phase_results`.

## A timed-out mutant's `summary` in `mutants.out/outcomes.json` is `Timeout`, and `outcomes.json` is rewritten after every mutant, so it holds every tested mutant at exit 3

**Verified at:** cargo-mutants 27.1.0
**Citation:** [implement_1: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/cargo-mutants-27.1.0/src/outcome.rs:262-291`], [implement_2: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/cargo-mutants-27.1.0/src/outcome.rs:330-338`], [implement_3: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/cargo-mutants-27.1.0/src/output.rs:197-225`]

`summary()` checks an unviable build first, then a timeout, then caught and missed (`outcome.rs:262-291`), and `SummaryOutcome` derives `Serialize`, so its unit variants are written by name (`outcome.rs:330-338`). `add_scenario_outcome` calls `write_lab_outcome`, which rewrites `outcomes.json`, for each scenario, and appends a timed-out mutant's name to `timeout.txt` (`output.rs:197-225`).

## `cargo mutants --timeout <seconds>` takes a float and sets the test timeout in place of the one derived from the baseline test run, which is the baseline duration times `--timeout-multiplier` (default 5), at least `--minimum-test-timeout`

**Verified at:** cargo-mutants 27.1.0
**Citation:** [implement_4: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/cargo-mutants-27.1.0/src/main.rs:313-319`], [implement_5: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/cargo-mutants-27.1.0/src/options.rs:385-386`], [implement_6: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/cargo-mutants-27.1.0/src/timeouts.rs:56-68`]

The flag is `timeout: Option<f64>` and `--timeout-multiplier` is declared `conflicts_with = "timeout"` (`main.rs:313-319`); options map it to `test_timeout` (`options.rs:385-386`), and `test_timeout` returns it when set, else the larger of the minimum test timeout and the baseline test duration times the multiplier, `unwrap_or(5.0)` (`timeouts.rs:56-68`).
