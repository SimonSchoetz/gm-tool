use tauri::{AppHandle, State};

use crate::connectivity::{self, ConnectivityState};

#[tauri::command]
pub async fn enter_pairing_mode(
    app_handle: AppHandle,
    state: State<'_, ConnectivityState>,
) -> Result<String, String> {
    connectivity::enter_pairing_mode(&app_handle, state.inner()).await
}
