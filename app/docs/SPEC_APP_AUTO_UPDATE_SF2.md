# SF2: Tauri Updater Commands

Adds `tauri-plugin-updater` to the Rust layer, wires the plugin into the app, and implements
`check_update` and `install_update` as Tauri commands following the existing `commands/images/`
pattern.

## Files Affected

```
New:
  app/src-tauri/src/commands/updater/mod.rs
  app/src-tauri/src/commands/updater/check_update.rs
  app/src-tauri/src/commands/updater/install_update.rs

Modified:
  app/src-tauri/Cargo.toml
  app/src-tauri/src/commands/mod.rs
  app/src-tauri/src/lib.rs
  app/src-tauri/capabilities/default.json
  app/src-tauri/tauri.conf.json
```

## Rust Layer

### `app/src-tauri/Cargo.toml`

Add to `[dependencies]`:

```toml
tauri-plugin-updater = "2"
```

### `app/src-tauri/src/commands/updater/check_update.rs`

Calls the updater plugin's `check()` method. Returns `Ok(Some(version_string))` when an update is
available, `Ok(None)` when up to date. The implementing instance must verify the exact
`tauri_plugin_updater` API (trait name, method signatures) from the installed crate — training
knowledge of the API surface is not sufficient.

```rust
use tauri_plugin_updater::UpdaterExt;

#[tauri::command]
pub async fn check_update(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    match updater.check().await.map_err(|e| e.to_string())? {
        Some(update) => Ok(Some(update.version.clone())),
        None => Ok(None),
    }
}
```

### `app/src-tauri/src/commands/updater/install_update.rs`

Re-checks for an update and downloads + installs it. The Tauri updater triggers an app restart
automatically after a successful install. Returns `Ok(())` whether or not an update was found —
the frontend controls when this is called (only after a check confirms an update exists).

The implementing instance must verify `download_and_install` signature from the installed crate.
The progress callbacks below use the minimal no-op form — adjust if the API differs.

```rust
use tauri_plugin_updater::UpdaterExt;

#[tauri::command]
pub async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
        update
            .download_and_install(|_, _| {}, || {})
            .await
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
```

### `app/src-tauri/src/commands/updater/mod.rs`

```rust
mod check_update;
mod install_update;

pub use check_update::check_update;
pub use install_update::install_update;
```

### `app/src-tauri/src/commands/mod.rs`

Add the `updater` module and re-export its commands alongside the existing `images` exports.

```rust
pub mod images;
pub mod updater;

pub use images::{delete_image, get_image_url, save_image};
pub use updater::{check_update, install_update};
```

### `app/src-tauri/src/lib.rs`

Register the updater plugin and the two new commands. The plugin must be registered before
`invoke_handler`.

```rust
mod commands;

use commands::{delete_image, get_image_url, save_image, check_update, install_update};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            save_image,
            get_image_url,
            delete_image,
            check_update,
            install_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
```

The `greet` command remains registered as-is.

### `app/src-tauri/capabilities/default.json`

Add the updater permission. The implementing instance must verify the exact permission identifier
from the `tauri-plugin-updater` documentation — the value below is the conventional form for
Tauri v2 plugins.

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "dialog:default",
    "dialog:allow-open",
    "opener:default",
    "sql:default",
    "sql:allow-load",
    "sql:allow-execute",
    "sql:allow-select",
    "sql:allow-close",
    "updater:default"
  ]
}
```

### `app/src-tauri/tauri.conf.json`

Add the `plugins.updater` block. Replace `REPLACE_WITH_PUBLIC_KEY` with the actual public key
once the signing keypair is generated (see SF5). Replace `REPLACE_WITH_GITHUB_USERNAME` and
`REPLACE_WITH_REPO_NAME` with the real values.

The endpoint URL format shown is for GitHub Releases with a `latest.json` update manifest
produced by `tauri-action`. The implementing instance must verify this URL format against the
`tauri-plugin-updater` and `tauri-action` documentation before finalising.

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "GM Tool",
  "version": "0.1.0",
  "identifier": "com.gm-tool",
  "build": {
    "beforeDevCommand": "npm run web",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build:frontend",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "GM Tool",
        "width": 1920,
        "height": 1080
      }
    ],
    "security": {
      "csp": null,
      "assetProtocol": {
        "enable": true,
        "scope": ["**"]
      }
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  },
  "plugins": {
    "updater": {
      "pubkey": "REPLACE_WITH_PUBLIC_KEY",
      "endpoints": [
        "https://github.com/REPLACE_WITH_GITHUB_USERNAME/REPLACE_WITH_REPO_NAME/releases/latest/download/latest.json"
      ]
    }
  }
}
```
