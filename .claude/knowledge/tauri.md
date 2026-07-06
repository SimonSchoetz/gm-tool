# Tauri

## Tauri does not support server-based SSR frameworks in production

**Verified at:** @tauri-apps/cli ^2.11.4 (v2 docs)
**Citation:** [A_1: https://v2.tauri.app/start/frontend/nextjs/]

Tauri explicitly states "Tauri doesn't support server-based solutions." Frameworks like Next.js must be configured with `output: 'export'` (static export/SSG) so the frontend is a static asset bundle the webview can load — there is no bundled Node server at runtime, only the Rust binary and the OS-native webview.

## Tauri uses the OS-native webview per platform, dynamically linked at runtime

**Verified at:** @tauri-apps/cli ^2.11.4 (v2 docs)
**Citation:** [A_2: https://v2.tauri.app/concept/process-model/]

Windows uses Microsoft Edge WebView2 (Chromium-based), macOS uses WKWebView (WebKit-based), Linux uses WebKitGTK (WebKit-based). These are dynamically linked to the OS-provided implementation rather than bundled into the app binary, which keeps app size small but means rendering engine version and behavior differ per platform and can drift as the OS updates.

## wry (Tauri's webview library) has no option to bundle/pin a fixed browser engine across platforms

**Verified at:** wry GitHub repo, as of 2026-07 (no version tag captured)
**Citation:** [A_3: https://github.com/tauri-apps/wry]

The `os-webview` feature flag is the default and only supported mode; the flag's own description notes it "was added in preparation of other ports like cef and servo," indicating a bundled-engine (CEF) mode was considered but is not implemented. There is no built-in mechanism to pin webview versions across Windows/macOS/Linux — each OS controls its own engine updates independently.
