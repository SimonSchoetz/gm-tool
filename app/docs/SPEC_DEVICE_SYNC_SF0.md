# SF0: Isolated Dev Data Profile

`npm run dev` currently runs under the same app identifier as the installed app, sharing its SQLite database, images directory, and connectivity device key. This SF gives dev builds a separate identifier so every OS-resolved storage path separates in one declaration — and the dev instance becomes a distinct, pairable device for testing the rest of this spec. Runs first: all sync testing during SF1–SF6 should happen against the isolated profile.

## Files Affected

Modified:

- `app/package.json` — the `dev` script becomes `"tauri dev --config src-tauri/tauri.dev.conf.json"`

New:

- `app/src-tauri/tauri.dev.conf.json`

`package-lock.json` is untouched — no dependency changes.

## `tauri.dev.conf.json`

The overlay is deep-merged over `tauri.conf.json` per JSON Merge Patch [S_13 in .claude/knowledge/tauri.md], so it contains only the overridden fields:

```json
{
  "identifier": "com.gm-tool.dev",
  "productName": "GM-Tool Dev"
}
```

Base values being overridden: `identifier: "com.gm-tool"`, `productName: "GM-Tool"` [S_14: app/src-tauri/tauri.conf.json:3-5]. The identifier override is what isolates the data (config dir, app data dir — DB, images, `connectivity/device.key` — and webview storage all derive from it); the `productName` override is for window-level distinguishability when dev and installed instances run side by side.

## Behavior Consequences (root spec KAD "Dev builds run as a separate device")

- First dev run after this lands starts with an empty database; migrations run fresh. The previously shared database remains with the installed app untouched.
- The dev instance generates its own device secret key on first run — a new EndpointId, a genuinely distinct device on the LAN. Pairing the dev instance with an installed instance is the intended end-to-end test rig for SF1–SF6.
- `npm run web` (Vite-only, no Tauri) is unaffected — it has no Tauri-resolved storage at all.

## Checks

No TypeScript or Rust source changes — tsc/eslint/prettier are unaffected; the Rust suite is not triggered (no `src-tauri/*.rs` touched; a config JSON is not a Rust source change). Verification is behavioral: `npm run dev` must boot with an empty DB and a window titled "GM-Tool Dev".

## Cross-SF Wiring

No exported symbols. SF1–SF6 depend on this SF only operationally (test isolation), not at compile time.
