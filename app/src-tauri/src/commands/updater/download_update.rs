use serde::Serialize;
use tauri::{AppHandle, State, ipc::Channel};
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
