use tauri::State;

use crate::connectivity::{self, ConnectivityState};

#[tauri::command]
pub async fn submit_pairing_code(
    state: State<'_, ConnectivityState>,
    endpoint_id: String,
    code: String,
) -> Result<(), String> {
    connectivity::submit_pairing_code(state.inner(), &endpoint_id, code).await
}
