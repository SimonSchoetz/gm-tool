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
**Citation:** [refine-claude_2: app/node_modules/@tauri-apps/plugin-sql/dist-js/index.js:32 — `static async load(path)` calls `invoke('plugin:sql|load', ...)`, and lines 89/118/137 route execute/select/close through `invoke` likewise; refine-claude_3: app/node_modules/@tauri-apps/api/core.js:202 — `invoke` returns `window.__TAURI_INTERNALS__.invoke(cmd, args, options)`; refine-claude_4: app/package.json:13 — `"web": "vite"`, a plain Vite server with no Tauri IPC bridge injected]

`Database.load()` fails at the first call in any browser context Tauri did not create, because `window.__TAURI_INTERNALS__` is injected by the Tauri webview runtime and is undefined under bare `vite`. This is a property of the plugin's transport, not of any one screen — no DB-backed feature can be exercised through a browser-only dev server, only through `npm run dev` (`tauri dev`).

## wry (Tauri's webview library) has no option to bundle/pin a fixed browser engine across platforms

**Verified at:** wry GitHub repo, as of 2026-07 (no version tag captured)
**Citation:** [architect_3: https://github.com/tauri-apps/wry]

The `os-webview` feature flag is the default and only supported mode; the flag's own description notes it "was added in preparation of other ports like cef and servo," indicating a bundled-engine (CEF) mode was considered but is not implemented. There is no built-in mechanism to pin webview versions across Windows/macOS/Linux — each OS controls its own engine updates independently.

## A continuously-firing requestAnimationFrame loop in WKWebView costs constant CPU in both the app process and the WebContent process, even when nothing is drawn

**Verified at:** macOS 15.6 (Darwin 24.6.0), MacBookPro16,1, Tauri dev build, 2026-07-14
**Citation:** [implementer_3: ran top -l 7 -stats pid,command,cpu,power against the running GM-Tool dev app — observed ~7% CPU / ~9 power in gm-tool plus ~6% CPU / ~6.5 power in com.apple.WebKit.WebContent with an idle 60Hz rAF loop alive, and 0.0 / 0.0 for both after the loop was fully stopped; sample of the WebContent process showed the time in RemoteLayerTreeDrawingArea::updateRendering → ScriptedAnimationController::serviceRequestAnimationFrameCallbacks]

WKWebView's rendering-update cycle is driven from timers coordinating with the app (UI) process, so an idle rAF loop burns energy in two processes at once. Killing the loop — not reducing the work inside it — is what returns the app to zero idle cost.
