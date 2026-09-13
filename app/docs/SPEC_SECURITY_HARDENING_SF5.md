# SF5 — Content Security Policy

`app.security.csp` is `null`, so no Content Security Policy is injected. The webview holds `sql:allow-execute`, `sql:allow-select`, and `sql:allow-load`, which means any script execution inside the webview is unrestricted database access. There is no live cross-site-scripting path today — a scan of `app/src/` for `dangerouslySetInnerHTML`, `innerHTML`, and `$generateNodesFromDOM` finds no assignment of untrusted content, and no `new Worker`, `createObjectURL`, `new Function`, or `eval` call exists in `app/src/` or `app/services/`. A CSP is what stops a future one from becoming full database compromise.

This sub-feature commits alone, after every other sub-feature in this spec, and is the only one that must be verified against a running application before it lands.

## Files affected

`Modified:`

- `app/src-tauri/tauri.conf.json` — replace `"csp": null` with a policy object, and add a `devCsp` object alongside it

## Rust backend

### `app/src-tauri/tauri.conf.json`

Replace the `"csp": null` line inside `app.security` with:

```json
      "csp": {
        "default-src": "'self'",
        "script-src": "'self'",
        "style-src": "'self' 'unsafe-inline'",
        "font-src": "'self'",
        "img-src": "'self' asset: http://asset.localhost blob: data:",
        "connect-src": "'self' ipc: http://ipc.localhost",
        "object-src": "'none'",
        "frame-src": "'none'",
        "base-uri": "'self'",
        "form-action": "'none'"
      },
      "devCsp": {
        "default-src": "'self'",
        "script-src": "'self' 'unsafe-inline'",
        "style-src": "'self' 'unsafe-inline'",
        "font-src": "'self'",
        "img-src": "'self' asset: http://asset.localhost blob: data:",
        "connect-src": "'self' ipc: http://ipc.localhost ws://localhost:1420 http://localhost:1420",
        "object-src": "'none'",
        "frame-src": "'none'",
        "base-uri": "'self'",
        "form-action": "'none'"
      },
```

The `assetProtocol` block below it is unchanged by this sub-feature — SF4 already narrowed its `scope`.

### Why each directive carries what it carries

`csp` accepts either a single policy string or an object mapping each directive to its sources; the object form is used here because it diffs cleanly per directive. Tauri rewrites the configured policy at compile time, appending hashes for local scripts and a nonce for styles and external scripts present in the built `index.html`.

`img-src` names both `asset:` and `http://asset.localhost` because a URL produced by `convertFileSrc()` — which `getImageUrl` in `app/services/imageService.ts` returns — resolves to the `asset:` scheme on macOS and Linux and to `http://asset.localhost` on Windows. Omitting either breaks images on one family of platforms only, which is the failure this project is most likely to ship without noticing, since development happens on Windows. `blob:` and `data:` follow the documented Tauri example and cost nothing here.

`connect-src` names `ipc:` and `http://ipc.localhost` for the same per-platform reason: every `invoke` call, and therefore every `plugin-sql` query and every Tauri command in this app, travels over that origin. A CSP that omits it disables the entire application rather than degrading it.

`style-src` carries `'unsafe-inline'`. Tauri's compile-time nonce injection covers only `<style>` elements present in the built `index.html`; a style element injected at runtime by a library carries no nonce and would be blocked. The directive that matters for the database-compromise chain this policy exists to break is `script-src`, which does not carry `'unsafe-inline'`.

`devCsp` differs from `csp` in exactly two directives. `script-src` gains `'unsafe-inline'` because the Vite dev server injects the React Refresh preamble as an inline script that Tauri cannot hash — the frontend is served from `http://localhost:1420` rather than from the bundle. `connect-src` gains `ws://localhost:1420` for the HMR socket and `http://localhost:1420` for module and asset requests. Both relaxations exist only under `tauri dev`; the shipped binary uses `csp`. `pnpm run dev` passes `--config src-tauri/tauri.dev.conf.json`, which overrides only `identifier` and `productName` and therefore inherits both policies from this file unchanged.

`object-src`, `frame-src`, and `form-action` are set to `'none'` because the application uses no plugins, no iframes, and no HTML form submission; each is a sink that would otherwise inherit `default-src`.

## Verification

Both passes are required before this sub-feature is committed. `pnpm run web` verifies nothing here — every database-backed screen fails at `Database.load()` in a browser Tauri did not create, because `window.__TAURI_INTERNALS__` is injected only by the Tauri webview.

**Pass 1 — `pnpm run dev`, which exercises `devCsp`.** Confirm, with the webview devtools console open and watching for `Content Security Policy` violation reports:

1. The app boots to a rendered screen with no violation reported.
2. Body text renders in IBM Plex Sans rather than a fallback — the `@fontsource` webfonts are bundled and same-origin, so a `font-src` failure shows up as a visible typeface change.
3. An entity that has an image displays that image — this is the asset protocol, and SF4's narrowed `scope` is exercised by the same check.
4. Typing `@` into a text editor returns mention results — this is IPC plus `plugin-sql`, and a `connect-src` failure kills it.
5. The pairing dialog opens and displays a 6-digit code — this is a Tauri command round trip plus a Rust-to-frontend event.
6. The updater check completes without a console error.

**Pass 2 — `pnpm run build` followed by launching the produced bundle, which exercises `csp`.** Repeat checks 1 through 6 against the built application. This pass is not optional and not substitutable by pass 1: `csp` and `devCsp` are different policies, `csp` is the one that ships, and the compile-time hash-and-nonce rewriting Tauri performs applies to the built `index.html` only, so it is exercised for the first time here.

If any check fails, widen the single directive the console violation names and re-run both passes. Do not widen `script-src` in `csp` to `'unsafe-inline'` to resolve a failure — that directive is the entire point of this sub-feature, and a violation reported against it means a script source needs identifying, not permitting.
