# Tauri

## The Tauri CLI --config flag deep-merges an extra JSON config over tauri.conf.json, and can override the app identifier

**Verified at:** tauri 2 (v2 docs, fetched 2026-07-18)
**Citation:** [spec-writer_13: https://v2.tauri.app/develop/configuration-files/]

`tauri dev` (and `build`/`bundle`) accepts `--config` with a JSON file or raw JSON string, merged over the resolved configuration per JSON Merge Patch (RFC 7396) — a deep merge. The docs' beta-distribution example overrides `identifier` this way (`"identifier": "com.myorg.myappbeta"`), giving the merged build fully separate OS app-data/config directories.

## Tauri does not support server-based SSR frameworks in production

**Verified at:** @tauri-apps/cli ^2.11.4 (v2 docs)
**Citation:** [architect_1: https://v2.tauri.app/start/frontend/nextjs/]

Tauri explicitly states "Tauri doesn't support server-based solutions." Frameworks like Next.js must be configured with `output: 'export'` (static export/SSG) so the frontend is a static asset bundle the webview can load — there is no bundled Node server at runtime, only the Rust binary and the OS-native webview.

## Tauri uses the OS-native webview per platform, dynamically linked at runtime

**Verified at:** @tauri-apps/cli ^2.11.4 (v2 docs)
**Citation:** [architect_2: https://v2.tauri.app/concept/process-model/]

Windows uses Microsoft Edge WebView2 (Chromium-based), macOS uses WKWebView (WebKit-based), Linux uses WebKitGTK (WebKit-based). These are dynamically linked to the OS-provided implementation rather than bundled into the app binary, which keeps app size small but means rendering engine version and behavior differ per platform and can drift as the OS updates.

## Tauri v2 Rust-to-frontend events use the Emitter trait; official docs show frontend listening without any capability entries

**Verified at:** tauri 2 (v2 docs, fetched 2026-07-10)
**Citation:** [spec-writer_4: https://v2.tauri.app/develop/calling-frontend/]

Rust emits via the `Emitter` trait on `AppHandle`/`WebviewWindow`: `emit(event_name, payload)` (global), `emit_to(webview_label, event_name, payload)`, `emit_filter(...)`. Frontend listens via `import { listen } from '@tauri-apps/api/event'`. The calling-frontend documentation shows this working with no capability/permission entries mentioned for event listening.

## Every tauri-plugin-sql call routes through `window.__TAURI_INTERNALS__`, so no SQL works in a plain Vite browser session

**Verified at:** @tauri-apps/plugin-sql ^2.4.0, @tauri-apps/api ^2.11.1, read 2026-08-06
**Citation:** [refine-claude_2: app/node_modules/@tauri-apps/plugin-sql/dist-js/index.js:32 — `static async load(path)` calls `invoke('plugin:sql|load', ...)`, and lines 89/118/137 route execute/select/close through `invoke` likewise; refine-claude_3: app/node_modules/@tauri-apps/api/core.js:202 — `invoke` returns `window.__TAURI_INTERNALS__.invoke(cmd, args, options)`; refine-claude_4: app/package.json:14 — `"web": "vite"`, a plain Vite server with no Tauri IPC bridge injected]

`Database.load()` fails at the first call in any browser context Tauri did not create, because `window.__TAURI_INTERNALS__` is injected by the Tauri webview runtime and is undefined under bare `vite`. This is a property of the plugin's transport, not of any one screen — no DB-backed feature can be exercised through a browser-only dev server, only through `pnpm dev` (`tauri dev`).

## wry (Tauri's webview library) has no option to bundle/pin a fixed browser engine across platforms

**Verified at:** wry GitHub repo, as of 2026-07 (no version tag captured)
**Citation:** [architect_3: https://github.com/tauri-apps/wry]

The `os-webview` feature flag is the default and only supported mode; the flag's own description notes it "was added in preparation of other ports like cef and servo," indicating a bundled-engine (CEF) mode was considered but is not implemented. There is no built-in mechanism to pin webview versions across Windows/macOS/Linux — each OS controls its own engine updates independently.

## `app.windows[].dragDropEnabled` (default `true`) intercepts native HTML5 drag-and-drop on Windows — must be `false` for a webpage's own `draggable`/`dragover`/`drop` handling to work

**Verified at:** tauri 2 (schema at `https://schema.tauri.app/config/2`, fetched 2026-08-13)

**Citation:** [implement_3: WebFetch of https://schema.tauri.app/config/2 — `dragDropEnabled` property, type boolean, description "Whether the drag and drop is enabled or not on the webview. By default it is enabled. Disabling it is required to use HTML5 drag and drop on the frontend on Windows."; empirically confirmed via a diagnostic build in this repo: a native `document`-level `dragstart` listener fired once with the correct target (a `draggable="true"` wrapper element), but a parallel `dragover` listener on `document` never fired a single time during a sustained drag gesture on Windows 11 — with `dragDropEnabled` unset (defaulting to `true`) in `app/src-tauri/tauri.conf.json`]

Any feature relying on native HTML5 `draggable`/`dragover`/`drop` DOM events (e.g. Lexical's `DraggableBlockPlugin_EXPERIMENTAL`, or a custom sortable list using native DnD instead of pointer events) is silently broken on Windows unless `app.windows[].dragDropEnabled: false` is set in `tauri.conf.json` — the OS-level webview drag-drop handler intercepts the gesture before it becomes web `dragover`/`drop` events, producing a `dragstart` with zero subsequent `dragover` events and a permanent "not-allowed" cursor. Setting `dragDropEnabled: false` disables Tauri's own file-drop-onto-window handling in exchange; before disabling, grep for `onDragDropEvent`/`getCurrentWebview().onDragDropEvent` (the Tauri API for native window-level file drop) to confirm nothing in the app depends on it.

## tauri-plugin-sql's SQLite pool defaults to 10 connections with no config surface to change it, so raw-SQL BEGIN/COMMIT across separate execute() calls is not atomic

**Verified at:** tauri-plugin-sql 2.4.0, sqlx-core 0.8.6, read 2026-08-27
**Citation:** [architect_1: ~/.cargo/registry/.../tauri-plugin-sql-2.4.0/src/wrapper.rs:68-91 — `DbPool::connect()` calls `sqlx::Pool::connect(conn_url)` with no `PoolOptions` override; architect_2: ~/.cargo/registry/.../sqlx-core-0.8.6/src/pool/options.rs:151 — default `max_connections: 10`; architect_3: wrapper.rs:37-64 — the only accessor exposing the raw `Pool<Sqlite>` (`pub fn sqlite()`) is commented out, dead code, so no custom Tauri command can reach the plugin's own pool either]

Each `Database.execute()`/`select()` call from JS is an independent Tauri IPC round trip that checks out an arbitrary connection from a 10-connection pool (`wrapper.rs`'s `execute()`/`select()` call `pool.execute(query)`/`pool.fetch_all(query)` directly, no session object). A `BEGIN` sent in one `execute()` call has no guaranteed effect on the connection a later call draws from — raw-SQL transaction wrapping across multiple `db.execute()` calls is not safe with this plugin, confirmed by the open upstream feature request github.com/tauri-apps/plugins-workspace/issues/886 ("Add support for transactions").

## tauri-plugin-sql's Builder::add_migrations() wires into sqlx's native Migrator (real per-migration atomicity, separate ledger table)

**Verified at:** tauri-plugin-sql 2.4.0, sqlx-sqlite 0.8.6, read 2026-08-27
**Citation:** [architect_4: ~/.cargo/registry/.../sqlx-sqlite-0.8.6/src/migrate.rs:136-162 — `apply()` uses a real `self.begin()`/`tx.commit()` transaction per migration, with automatic rollback on failure via `Transaction`'s `Drop`]

This is a genuinely atomic alternative to hand-rolled raw-SQL migrations, but requires each migration's SQL as a Rust `&'static str` (no access to JS-side helpers like `generateId()`/`generateDbTimestamps()` or JSON-stringified config objects), and tracks its own `_sqlx_migrations` ledger table separate from any app-defined migration ledger. A large structural cost relative to making JS-side migrations independently idempotent, unless a project specifically needs bulletproof DDL transactions.

## A continuously-firing requestAnimationFrame loop in WKWebView costs constant CPU in both the app process and the WebContent process, even when nothing is drawn

**Verified at:** macOS 15.6 (Darwin 24.6.0), MacBookPro16,1, Tauri dev build, 2026-07-14
**Citation:** [implementer_3: ran top -l 7 -stats pid,command,cpu,power against the running GM-Tool dev app — observed ~7% CPU / ~9 power in gm-tool plus ~6% CPU / ~6.5 power in com.apple.WebKit.WebContent with an idle 60Hz rAF loop alive, and 0.0 / 0.0 for both after the loop was fully stopped; sample of the WebContent process showed the time in RemoteLayerTreeDrawingArea::updateRendering → ScriptedAnimationController::serviceRequestAnimationFrameCallbacks]

WKWebView's rendering-update cycle is driven from timers coordinating with the app (UI) process, so an idle rAF loop burns energy in two processes at once. Killing the loop — not reducing the work inside it — is what returns the app to zero idle cost.

## `app.security.csp` accepts a policy string, a directive-map object, or null; `devCsp` overrides it for `tauri dev` only

**Verified at:** tauri 2 (schema at `https://schema.tauri.app/config/2` + v2 docs, fetched 2026-08-31)
**Citation:** [spec-writer_1: WebFetch of https://schema.tauri.app/config/2 — `csp` is `{"anyOf": [{"$ref": "#/definitions/Csp"}, {"type": "null"}]}` with description "The Content Security Policy that will be injected on all HTML files on the built application. If `dev_csp` is not specified, this value is also injected on dev."; the `Csp` definition accepts either "The entire CSP policy in a single text string" or "An object mapping a directive with its sources values as a list of strings"; spec-writer_2: WebFetch of https://v2.tauri.app/security/csp/ — "Local scripts are hashed, styles and external scripts are referenced using a cryptographic nonce"]

Tauri rewrites the configured policy at compile time, appending hashes for local scripts and a nonce for styles and external scripts present in the built `index.html`. That rewriting covers only what is in the bundle at build time — a `<style>` or `<script>` element a library injects at runtime carries no nonce, and the dev server's own inline output is not hashed at all, which is what `devCsp` exists for. `csp: null` disables the header entirely.

## The Tauri asset protocol requires `asset:` and `http://asset.localhost` in `img-src`, and IPC requires `ipc:` in `connect-src`, once a CSP is set

**Verified at:** tauri 2 (v2 docs, fetched 2026-08-31)
**Citation:** [spec-writer_3: WebFetch of https://v2.tauri.app/security/csp/ — documented example policy contains `"default-src": "'self' customprotocol: asset:"` and `"img-src": "'self' asset: http://asset.localhost blob: data:"`, with `ipc:` shown in the `connect-src` directive]

A URL produced by `convertFileSrc()` resolves to the `asset:` scheme on macOS/Linux and to `http://asset.localhost` on Windows, so both origins must appear in whichever directive loads the resource. Setting any CSP without these silently breaks every image served through the asset protocol.

## Tauri's `assetProtocol.scope` takes either a glob array or an allow/deny object, and its path strings support base-directory variables such as `$APPDATA`

**Verified at:** tauri 2 (schema at `https://schema.tauri.app/config/2` + v2 config reference, fetched 2026-08-31)
**Citation:** [spec-writer_4: WebFetch of https://schema.tauri.app/config/2 — `assetProtocol.scope` is `{"description": "The access scope for the asset protocol.", "default": [], "allOf": [{"$ref": "#/definitions/FsScope"}]}`, and `FsScope` accepts a list ("A list of paths that are allowed by this scope") or an object with `allow`, `deny` ("This gets precedence over the allow list"), and `requireLiteralLeadingDot`; spec-writer_5: WebFetch of https://v2.tauri.app/reference/config/ — FsScope is "a list of glob patterns that restrict the API access from the webview. Each pattern can start with a variable that resolves to a system base directory", the recognized variables including `$APPDATA`, `$APPLOCALDATA`, `$APPCONFIG`, `$APPCACHE`, `$APPLOG`, `$RESOURCE`, `$HOME`, `$DATA`, `$LOCALDATA`, `$TEMP`]

`$APPDATA` resolves to the same directory Rust's `app_handle.path().app_data_dir()` returns, so a file written under `app_data_dir().join("images")` is matched by the scope pattern `$APPDATA/images/*`. A scope of `["**"]` grants the webview read access to the entire filesystem through the asset protocol.

## `tauri::async_runtime`'s `channel`, `Sender` and `Receiver` are tokio's mpsc types

**Verified at:** tauri 2.11.5 (Cargo.lock)
**Citation:** [spec-writer_47: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-2.11.5/src/async_runtime.rs:13-17 — `pub use tokio::{ runtime::{…}, sync::{ mpsc::{channel, Receiver, Sender}, Mutex, RwLock, … } }`]

Channel semantics in Rust code that imports them from `tauri::async_runtime` are tokio's (see `.claude/knowledge/tokio.md`).

## tauri-plugin-sql decodes SQL `NULL` to JSON `null`

**Verified at:** tauri-plugin-sql 2.4.1 (Cargo.lock)
**Citation:** [spec-writer_48: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-plugin-sql-2.4.1/src/decode/sqlite.rs:11-14 — `pub(crate) fn to_json(v: SqliteValueRef) -> Result<JsonValue, Error> { if v.is_null() { return Ok(JsonValue::Null); }`]

A nullable column read through `select()` arrives in JavaScript as `null`, never `undefined` or a missing key, so every row from `SELECT *` carries every column.

## `@tauri-apps/plugin-sql`'s `execute` resolves `{ rowsAffected, lastInsertId? }` and `select<T>` resolves the rows

**Verified at:** @tauri-apps/plugin-sql 2.4.1
**Citation:** [harness-probe_2: app/node_modules/@tauri-apps/plugin-sql/dist-js/index.d.ts:1-13 — `QueryResult { rowsAffected: number; lastInsertId?: number }`] [harness-probe_6: same file:88 — `execute(query: string, bindValues?: unknown[]): Promise<QueryResult>`] [harness-probe_7: same file:107 — `select<T>(query: string, bindValues?: unknown[]): Promise<T>`]

A stand-in used in tests needs only `execute` and `select` with these shapes, plus `load`, to satisfy the app's database module.

## The Tauri CLI compares `tauri` against `@tauri-apps/api` and each `tauri-plugin-<n>` crate against `@tauri-apps/plugin-<n>`, and a differing major or minor makes `tauri build` fail while `tauri dev` only logs it

**Verified at:** @tauri-apps/cli 2.12.0, with 2.11.4 checked for the same gate — 2026-10-01
**Citation:** [research-tauri-js-2.12_1: the published `tauri-cli` crate source at 2.12.0, obtained from crates.io and read locally — `src/info/plugins.rs:34-41` — the `mismatched()` filter comparing major and minor only; `:145-168` — `check_mismatched_packages` returning `Err`; `:45-62` — the compared sets, crate names `tauri` plus `tauri-plugin-*` against npm names `@tauri-apps/api` plus `@tauri-apps/plugin-*`; `src/build.rs:157-164` — that `Err` treated as fatal unless `--ignore-version-mismatches` is passed] [research-tauri-js-2.12_3: tauri-cli 2.12.0 `src/dev.rs:142-147` — the same check on a spawned thread calling only `log::error!`, with no `--ignore-version-mismatches` option there] [research-tauri-js-2.12_4: tauri-cli 2.11.4 `src/info/plugins.rs:141,163` and `src/build.rs:150-151`, `src/dev.rs:143` — the same gate and error string, so it did not arrive in 2.12]

Because the filter compares only major and minor, a patch-level gap between a package and its crate passes the gate, and `@tauri-apps/cli` is not itself among the compared pairs. The `tauri info` command prints both sides of every pair, which surfaces a mismatch without running a build [dependency-update_16: ran `npx tauri info` from `app/` — observed a `Plugins` section pairing each `tauri-plugin-<n>` crate line with its `@tauri-apps/plugin-<n>` line, and a `Packages` section listing `tauri`, `tauri-build`, `wry`, `tao`, `@tauri-apps/api` and `@tauri-apps/cli`].

## tauri 2.12.0 drops Windows 7 support, raises its MSRV to Rust 1.90 and migrates to edition 2024

**Verified at:** tauri 2.12.0 changelog — fetched 2026-10-01
**Citation:** [research-rust-deps_6: <https://raw.githubusercontent.com/tauri-apps/tauri/dev/crates/tauri/CHANGELOG.md> — the 2.12.0 breaking-change list recording the Windows 7 drop per microsoft/windows-rs#3808 and the `windows` crate moving to 0.62, `webview2-com` to 0.39, `tray-icon` to 0.25 and `muda` to 0.20] [research-rust-deps_18: the same file — `**MSRV:** Set to Rust 1.90` and `**Edition 2024:** Codebase migrated to Rust Edition 2024`, with `Update MSRV to 1.90 to match tauri` also appearing in the tauri-plugin-sql 2.5.0, dialog 2.8.1, opener 2.7.0 and updater 2.13.1 changelogs]

The same release replaces the Windows webview and windowing crates, so a Windows build after it exercises substantially new code.

## tauri-plugin-updater 2.12.0 removed `allowDowngrades` from its `check` command as a breaking change and reads it from plugin configuration instead, defaulting to `false`

**Verified at:** tauri-plugin-updater 2.12.0 changelog — fetched 2026-10-01
**Citation:** [dependency-update_15: <https://raw.githubusercontent.com/tauri-apps/plugins-workspace/v2/plugins/updater/CHANGELOG.md> — the 2.12.0 entry marked a breaking change, stating that `allowDowngrades` was removed from the `check` command and is now read from plugin configuration, that previously any code running in the webview could pass `allowDowngrades: true` to `plugin:updater|check`, and that the flag is now an application-level setting defaulting to `false`] [research-rust-deps_9: the same entry read from `tauri-plugin-updater-2.13.1/CHANGELOG.md` in the local cargo registry]

What changed is the `plugin:updater|check` IPC command reachable from the webview. The configuration key's exact location within `tauri.conf.json` was not established.

## tauri-plugin-updater lists `system-proxy` among its default features in both 2.11.0 and 2.13.1

**Verified at:** tauri-plugin-updater 2.11.0 and 2.13.1 — 2026-10-01
**Citation:** [research-rust-deps_10: compared the `[features]` sections of `tauri-plugin-updater-2.11.0/Cargo.toml` and `-2.13.1/Cargo.toml` in the local cargo registry — observed `default = ["rustls-tls", "system-proxy", "zip"]` in both, alongside the 2.11.0 changelog entry `Added system-proxy (enabled by default) feature flag to control reqwest/system-proxy feature`]

The feature controls `reqwest`'s own `system-proxy` feature. The releases between those two were not read, so this says only that the default is the same at both ends.

## tauri-plugin-sql 2.5.0 opens a `sqlite:<file>` database at `<app config dir>/<file>`, creating the directory, and the database through sqlx, when either is missing

**Verified at:** tauri-plugin-sql 2.5.0 (Cargo.lock) — 2026-10-20
**Citation:** [migration-backup_1: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-plugin-sql-2.5.0/src/wrapper.rs:88-101 — `_app.path().app_config_dir()`, `create_dir_all(&app_path)`, `path_mapper(app_path, conn_url)`, then `Sqlite::create_database(conn_url)` when `Sqlite::database_exists` is false, then `Pool::connect(conn_url)`; :327-347 — `path_mapper` pushes the text after the `sqlite:` prefix onto the app config path; :11,21 — `MigrateDatabase`, `Pool` and `Sqlite` are imported from `sqlx`]

A Rust command that needs the database file's location resolves the same directory with `app_handle.path().app_config_dir()`, the call the plugin itself makes.

## Tauri 2.12.0's `app_config_dir()` is the `dirs` crate's `config_dir()` joined with the bundle identifier, which on macOS is `~/Library/Application Support/<identifier>`, unless the `app > appDirectoriesOverride` config overrides it

**Verified at:** tauri 2.12.0, dirs 7.0.0 (Cargo.lock) — 2026-10-20
**Citation:** [migration-backup_2: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-2.12.0/src/path/desktop.rs:237-245 — `app_config_dir` returns `dirs::config_dir()` joined with `self.0.config().identifier`, unless the `app > appDirectoriesOverride` config overrides it] [migration-backup_18: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-2.12.0/Cargo.toml:156-157 — `[dependencies.dirs]` `version = "7"`; `app/src-tauri/Cargo.lock` holds one `dirs` package, `version = "7.0.0"`] [migration-backup_3: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/dirs-7.0.0/src/mac.rs:7,10 — `config_dir()` is `app_support_dir()`, the home directory joined with `Library/Application Support`]

The identifier is the one in the configuration the build ran with, so a build whose `--config` overrides it (the entry beginning "The Tauri CLI --config flag") gets a directory of its own.

## A Tauri 2.12 crate's `cargo clippy --all-targets` and `cargo test` builds do not need the `build.frontendDist` directory to exist

**Verified at:** tauri 2.12.0, tauri-build 2.7.1 (Cargo.lock) — 2026-10-20
**Citation:** [release-check_9: on macOS arm64, in a fresh git worktree of this repository at commit `0c10f7f4`, whose `tauri.conf.json` sets `frontendDist` to `../dist`, with no `app/dist` and no `app/src-tauri/target`, ran `cargo clippy --all-targets -- -D warnings` and `cargo test` from `app/src-tauri/` — observed exit 0 from both, every test binary reporting `test result: ok`, and `ls app/dist` reporting `No such file or directory` afterwards]

Observed with the default dev profile and feature set; a `--release` build or other features were not tried.

## A `#[tauri::command]` argument is read from the IPC payload under its Rust name converted to lowerCamelCase, unless the attribute sets `rename_all = "snake_case"`, and only that top-level key is converted

**Verified at:** tauri 2.12.0, tauri-macros 2.7.1 (Cargo.lock) — 2026-10-20
**Citation:** [instruction-pass_1: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-macros-2.7.1/src/command/wrapper.rs:51 — `argument_case: ArgumentCase::Camel` as the default; :62-76 — `rename_all` accepts only `"snake_case"` or `"camelCase"`; :500-505 — `key = key.to_lower_camel_case()` under `ArgumentCase::Camel` and `key = key.to_snake_case()` under `ArgumentCase::Snake`] [instruction-pass_2: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-2.12.0/src/ipc/command.rs:74-80 — `CommandArg` for any `Deserialize` type calls `Self::deserialize(command)`; :109-114 — the value is `v.get(self.key)`, else the error `missing required key`; :84-93 and :174-179 — every other `deserialize_*`, `deserialize_struct` included, is passed to the retrieved `serde_json::Value`'s own deserializer; :146-157 — `deserialize_option` calls `visitor.visit_none()` when the key is absent]

Under the default, a snake_case key for a multi-word argument such as `database_file` is never matched: a required argument then fails with `missing required key`, and an `Option` argument silently receives `None`. The value under the key goes to `serde_json::Value`'s own deserializer, so the fields of a struct argument follow that struct's serde attributes, such as `#[serde(rename_all = "camelCase")]`, not the macro's conversion.

## `@tauri-apps/api` 2.12.0's `core`, `event` and `app` modules, `@tauri-apps/plugin-dialog` 2.8.0 and `@tauri-apps/plugin-opener` 2.7.0 import under Vitest's node environment with no `window` and no bridge

**Verified at:** @tauri-apps/api 2.12.0, @tauri-apps/plugin-dialog 2.8.0, @tauri-apps/plugin-opener 2.7.0, vitest 5.0.2, run 2026-10-20
**Citation:** [spec-writer_2: ran a scratch `// @vitest-environment node` test under `npx vitest run` from `app/` that dynamically imports `@tauri-apps/api/core`, `@tauri-apps/api/event`, `@tauri-apps/api/app`, `@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-opener` — observed every import resolving, with `invoke`, `listen`, `getVersion`, `open` and `openUrl` each typed `function`] [spec-writer_3: same run, a module importing from all five packages while `vi.mock('@tauri-apps/api/core', () => ({ invoke }))` was in force — observed it loading and its `invoke` wrapper resolving]

None of the five modules touches `window.__TAURI_INTERNALS__` while it loads, so a test that mocks only `@tauri-apps/api/core` can import a module that wraps all five without mocking the other four; the bridge is reached only when one of their functions is called.
