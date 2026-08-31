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

## Every tauri-plugin-sql call routes through window.__TAURI_INTERNALS__, so no SQL works in a plain Vite browser session

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
**Citation:** [spec-writer_1: WebFetch of https://schema.tauri.app/config/2 — `csp` is `{"anyOf": [{"$ref": "#/definitions/Csp"}, {"type": "null"}]}` with description "The Content Security Policy that will be injected on all HTML files on the built application. If [`dev_csp`](#SecurityConfig.devCsp) is not specified, this value is also injected on dev."; the `Csp` definition accepts either "The entire CSP policy in a single text string" or "An object mapping a directive with its sources values as a list of strings"; spec-writer_2: WebFetch of https://v2.tauri.app/security/csp/ — "Local scripts are hashed, styles and external scripts are referenced using a cryptographic nonce"]

Tauri rewrites the configured policy at compile time, appending hashes for local scripts and a nonce for styles and external scripts present in the built `index.html`. That rewriting covers only what is in the bundle at build time — a `<style>` or `<script>` element a library injects at runtime carries no nonce, and the dev server's own inline output is not hashed at all, which is what `devCsp` exists for. `csp: null` disables the header entirely.

## The Tauri asset protocol requires `asset:` and `http://asset.localhost` in `img-src`, and IPC requires `ipc:` in `connect-src`, once a CSP is set

**Verified at:** tauri 2 (v2 docs, fetched 2026-08-31)
**Citation:** [spec-writer_3: WebFetch of https://v2.tauri.app/security/csp/ — documented example policy contains `"default-src": "'self' customprotocol: asset:"` and `"img-src": "'self' asset: http://asset.localhost blob: data:"`, with `ipc:` shown in the `connect-src` directive]

A URL produced by `convertFileSrc()` resolves to the `asset:` scheme on macOS/Linux and to `http://asset.localhost` on Windows, so both origins must appear in whichever directive loads the resource. Setting any CSP without these silently breaks every image served through the asset protocol.

## Tauri's `assetProtocol.scope` takes either a glob array or an allow/deny object, and its path strings support base-directory variables such as `$APPDATA`

**Verified at:** tauri 2 (schema at `https://schema.tauri.app/config/2` + v2 config reference, fetched 2026-08-31)
**Citation:** [spec-writer_4: WebFetch of https://schema.tauri.app/config/2 — `assetProtocol.scope` is `{"description": "The access scope for the asset protocol.", "default": [], "allOf": [{"$ref": "#/definitions/FsScope"}]}`, and `FsScope` accepts a list ("A list of paths that are allowed by this scope") or an object with `allow`, `deny` ("This gets precedence over the allow list"), and `requireLiteralLeadingDot`; spec-writer_5: WebFetch of https://v2.tauri.app/reference/config/ — FsScope is "a list of glob patterns that restrict the API access from the webview. Each pattern can start with a variable that resolves to a system base directory", the recognized variables including `$APPDATA`, `$APPLOCALDATA`, `$APPCONFIG`, `$APPCACHE`, `$APPLOG`, `$RESOURCE`, `$HOME`, `$DATA`, `$LOCALDATA`, `$TEMP`]

`$APPDATA` resolves to the same directory Rust's `app_handle.path().app_data_dir()` returns, so a file written under `app_data_dir().join("images")` is matched by the scope pattern `$APPDATA/images/*`. A scope of `["**"]` grants the webview read access to the entire filesystem through the asset protocol.
