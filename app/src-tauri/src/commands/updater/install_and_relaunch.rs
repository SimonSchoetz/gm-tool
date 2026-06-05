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
