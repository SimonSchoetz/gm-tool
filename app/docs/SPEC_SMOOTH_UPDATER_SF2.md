# SF2: Rust Commands

Add `PendingInstall` app state, `download_update` command (with Channel-based progress), and `install_and_relaunch` command. Remove `install_update`.

## Files Affected

- `New:` `app/src-tauri/src/commands/updater/pending_install.rs`
- `New:` `app/src-tauri/src/commands/updater/download_update.rs`
- `New:` `app/src-tauri/src/commands/updater/install_and_relaunch.rs`
- `Modified:` `app/src-tauri/src/commands/updater/mod.rs` — declare new modules; remove `install_update` module and re-export; add re-exports for all new commands
- `Modified:` `app/src-tauri/src/commands/mod.rs` — remove `install_update` from re-exports; add `download_update` and `install_and_relaunch`
- `Deleted:` `app/src-tauri/src/commands/updater/install_update.rs`
- `Modified:` `app/src-tauri/src/lib.rs` — register `PendingInstall` state; replace `install_update` handler with `download_update` and `install_and_relaunch`

## Rust Layer

### `pending_install.rs`

```rust
use std::sync::Mutex;
use tauri_plugin_updater::Update;

pub struct PendingInstall {
    pub update: Update,
    pub bytes: Vec<u8>,
}

pub type PendingInstallState = Mutex<Option<PendingInstall>>;
```

### `download_update.rs`

```rust
use serde::Serialize;
use tauri::{ipc::Channel, AppHandle, State};
use tauri_plugin_updater::UpdaterExt;

use super::pending_install::{PendingInstall, PendingInstallState};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum DownloadEvent {
    Progress {
        chunk_length: usize,
        content_length: Option<u64>,
    },
}

#[tauri::command]
pub async fn download_update(
    app: AppHandle,
    state: State<'_, PendingInstallState>,
    on_event: Channel<DownloadEvent>,
) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    let update = updater
        .check()
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "No update available".to_string())?;

    let bytes = update
        .download(
            |chunk_length, content_length| {
                let _ = on_event.send(DownloadEvent::Progress {
                    chunk_length,
                    content_length,
                });
            },
            || {},
        )
        .await
        .map_err(|e| e.to_string())?;

    *state.lock().unwrap() = Some(PendingInstall { update, bytes });

    Ok(())
}
```

The `on_download_finish` callback (`|| {}`) is a no-op. The frontend detects download completion via Promise resolution — no `Finished` event is emitted.

### `install_and_relaunch.rs`

```rust
use tauri::{AppHandle, State};

use super::pending_install::PendingInstallState;

#[tauri::command]
pub async fn install_and_relaunch(
    app: AppHandle,
    state: State<'_, PendingInstallState>,
) -> Result<(), String> {
    let pending = state
        .lock()
        .unwrap()
        .take()
        .ok_or_else(|| "No downloaded update available".to_string())?;

    pending
        .update
        .install(pending.bytes)
        .map_err(|e| e.to_string())?;

    app.restart();
}
```

`app.restart()` has return type `!` (diverging) — the function never reaches a `return` after it. The `Result<(), String>` return type is satisfied because `!` coerces to any type.

### `commands/updater/mod.rs`

```rust
mod check_update;
mod download_update;
mod install_and_relaunch;
mod pending_install;

pub use check_update::check_update;
pub use download_update::download_update;
pub use install_and_relaunch::install_and_relaunch;
pub use pending_install::PendingInstallState;
```

`pending_install` is declared but only `PendingInstallState` is re-exported — `PendingInstall` and `DownloadEvent` are internal to the module.

### `commands/mod.rs`

```rust
pub mod images;
pub mod updater;

pub use images::{delete_image, get_image_url, save_image};
pub use updater::{check_update, download_update, install_and_relaunch, PendingInstallState};
```

### `lib.rs`

Replace `install_update` with `download_update` and `install_and_relaunch` in both the import list and the `generate_handler!` macro. Add `.manage(commands::PendingInstallState::default())` before `.invoke_handler(...)`.

```rust
mod commands;

use commands::{
    check_update, delete_image, download_update, get_image_url, install_and_relaunch, save_image,
    PendingInstallState,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(PendingInstallState::default())
        .invoke_handler(tauri::generate_handler![
            check_update,
            delete_image,
            download_update,
            get_image_url,
            install_and_relaunch,
            save_image,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

`PendingInstallState` is `Mutex<Option<PendingInstall>>`. `Mutex<Option<T>>` implements `Default` when `T: Default` — but `PendingInstall` does not implement `Default`. Use `PendingInstallState::new(None)` instead of `.default()`:

```rust
.manage(PendingInstallState::new(None))
```

Remove the `greet` command — it is dead code not consumed by any frontend caller. Verify with `grep -r "greet" app/src` before removing; if it returns no matches, remove both the `fn greet` definition from `lib.rs` and its entry in `generate_handler!`.
