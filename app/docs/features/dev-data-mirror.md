# Dev data mirror

**Purpose.** `pnpm run dev` from `app/` replaces the Tauri dev app's database and images with a fresh copy of the installed release app's data before it launches, so the dev app lists the same adventures, entities, sessions and images as the release app holds, as web mode already does for the browser. The dev app keeps its own device identity and paired devices.

**Users.** The developer, who runs `pnpm run dev` and pairs the dev app only with test devices; the mirror is a development tool and never reaches a release build.

## How it works

Happy path:

1. `pnpm run dev` runs `node dev-data-server/runDevMirror.ts` and then `tauri dev --config src-tauri/tauri.dev.conf.json`, joined by `&&`. The entry reads the release identifier from `tauri.conf.json` and the dev identifier from `tauri.dev.conf.json`, so the release data is under `~/Library/Application Support/com.gm-tool/` and the dev data under `~/Library/Application Support/com.gm-tool.dev/`.
2. The mirror builds the copy in `.mirror-staging` inside the dev directory: the release database (a `-wal` file the release app left beside it is recovered in place) and the release `images/`. In the staged database it deletes the rows of the three preserved sets, then inserts the old dev database's rows of those sets for the columns both tables have.
3. It removes the old dev `gm_tool.db`, `gm_tool.db-wal`, `gm_tool.db-shm` and `images/`, moves the staged database and images in, removes the staging folder and prints one line naming the dev directory. `connectivity/` (the device key) and the `gm_tool.db.bak-*` backups are never touched.
4. `tauri dev` starts the dev app, which runs its pending migrations on the mirrored database as it does today. Edits made in the dev app are gone at the next `pnpm run dev`.

Failure:

- No installed app data, or a release directory that cannot be located (a machine that is not macOS): the entry prints a notice — naming `~/Library/Application Support/com.gm-tool/gm_tool.db`, or the macOS-only message — and exits 0, so the dev app starts on the data it already holds.
- Any other failure — a release database lacking one of the three preserved tables (the message names the table), a file that is not a database, the source and target directories being the same one: the entry prints the error and exits non-zero. The `&&` then keeps `tauri dev` from starting, and the old dev data is intact because nothing is swapped in before the copy is complete.

Where the user waits: before the dev app window opens, for the copy of the database and images.

## Data

- **Reads:** the release app's database and `images/` under `~/Library/Application Support/com.gm-tool/`, and the old dev database for the three preserved sets.
- **Writes:** the dev data directory only — its database and `images/` are replaced; a `-wal` file the release app left beside its database is recovered in place when the copy opens and closes it.
- **Never:** the release app's files are not changed (the `-wal` recovery excepted), and the dev `connectivity/` folder and `gm_tool.db.bak-*` files are not touched.

## Rules

| Rule | Why | Source |
| --- | --- | --- |
| The dev app's database and images are replaced by a fresh copy of the release app's data at every `pnpm run dev` start; its edits do not survive a restart | The same rule web mode follows, so the dev app always starts on current production data | proposed by Claude, accepted by Simon Schötz, 2026-10-20 |
| The mirror carries content only: the preserved set is exactly `paired_devices`, `_sync_peers` and the `_system` row `device`, and the dev app keeps its device identity and key file; every other table follows the release data, `_sync_changes` and `_sync_meta` included | The dev app connects to its peers, and a copy of the release identity next to a different network key, or a release sync cursor in place of the dev app's, could reach the real paired devices or skip a peer's changes | proposed by Claude, accepted by Simon Schötz, 2026-10-20, and Claude's call, 2026-10-20 |
| With no release data, or a release directory that cannot be located, the entry prints a notice and the dev app starts on its own data | The release data cannot be found, and the dev app is still usable | not recorded for the first case; Claude's call, 2026-10-20 for the second |
| The mirror is a pre-step of the `dev` script, never a Vite plugin hook, Tauri's `beforeDevCommand` or Rust code | Vite restarts and Tauri hot-restarts would re-mirror under a live dev app holding the database open | Claude's call, 2026-10-20 |
| A `-wal` file the release app leaves beside its database is recovered in place, and nothing else under the release directory changes | The same behaviour as web mode | Claude's call, 2026-10-20 |
| A second concurrent `pnpm run dev`, or a dev app left running, is not guarded: its files are swapped by the mirror | The workflow has one developer | Claude's call, 2026-10-20 |
| No code guard keeps the dev app from syncing to the real paired devices; the dev app is paired only with test devices | The accepted option: no guard | proposed by Claude, accepted by Simon Schötz, 2026-10-20 |
| `_sync_changes` and `_sync_meta` are mirrored with the content; whether a peer's cursor for the dev device goes stale is unverified | The architect's default, accepted | proposed by Claude, accepted by Simon Schötz, 2026-10-20 |
| A mirror failure aborts `pnpm run dev` with a non-zero exit and the old dev data intact, and a table missing from the release copy aborts naming the table; the `&&` joining the entry and `tauri dev` is the only link that stops the dev app from starting, and no test covers it | A failed mirror must never leave the developer on stale data unknowingly | proposed by Claude, accepted by Simon Schötz, 2026-10-20 |

## Open points

Whether a paired peer's sync cursor for the dev device goes stale when the dev app's `_sync_changes` and `_sync_meta` are replaced at each mirror is unverified.

## Where to look

- `app/dev-data-server/`: `devMirror` (the swap and the preserved sets), `runDevMirror` (the entry and its exit codes), `repositoryJson` (the identifier reader), `installedAppData` (the release copy functions).
- `app/package.json`: the `dev` script.
- Tests: `devMirror.test`, `runDevMirror.test`, `installedAppData.test`, with `appDatabase` as their shared fixture.
