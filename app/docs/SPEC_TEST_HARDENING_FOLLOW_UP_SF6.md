# Sub-feature 6: Declared Node version for the db tests

The db tests run SQL through `app/db/__tests__/support/sqlite-test-database.ts`, which imports `node:sqlite`. `app/package.json` gains an `engines.node` range naming the Node versions on which that module loads without a flag, so the requirement is written down where tooling reads it.

## Files affected

`Modified:`

- `app/package.json` — adds `engines.node`

`Deleted:` none

`New:` none

`Moved:` none

`Draft:`

- `.claude/knowledge/node.md` — an unreviewed draft, already in the working tree: one entry added ("`node:sqlite` needs no `--experimental-sqlite` flag from Node v22.13.0 on the 22.x line and from v23.4.0 on later lines"), written while this spec was verified. Review it and commit it with this sub-feature.

## Layered breakdown

### Tooling (no application layer)

#### `app/package.json`

- Add `"engines": { "node": "^22.13.0 || >=23.4.0" }` directly after the `"packageManager"` entry (line 8), formatted as Prettier formats the file.
- Why this range: root Key Architectural Decisions — The Node range is the set that loads `node:sqlite` without a flag. The verified fact is recorded in `.claude/knowledge/node.md`.
- No `.nvmrc` or `.node-version` file.
- No dependency changes, so `app/pnpm-lock.yaml` is not regenerated. Its `importers` block holds no `engines` entry [spec-writer_26: grep engines in the importers block of app/pnpm-lock.yaml — not found, as of 529b24dd].
- The release workflow installs the current LTS Node (`runtime: node@lts` in `.github/workflows/release.yml`). Any LTS line from 24 on is inside the range.

No test: the field is declarative, and the db tests themselves exercise `node:sqlite` on every run.

## Checks

From `app/`: `npx prettier --check .`, then the rest of the `every check` rows of root `CLAUDE.md` — Tool Use Discipline.
