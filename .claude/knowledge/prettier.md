# Prettier

## Prettier 3.9.9 `--check` on a file whose type it has no parser for exits 2 with "No parser could be inferred", and `--ignore-unknown` makes it exit 0 for that file

**Verified at:** prettier 3.9.9, installed in `app/`, run 2026-11-10
**Citation:** [implement_3: ran `npx prettier --check assets/app-logo.svg` from `app/` — observed `[error] No parser could be inferred for file "…/app/assets/app-logo.svg".` and exit code 2; ran `npx prettier --check --ignore-unknown assets/app-logo.svg` — observed `All matched files use Prettier code style!` and exit code 0]

A hook that passes staged paths to Prettier without an extension filter needs the flag, or an `.svg` under `app/assets/` fails the commit.
