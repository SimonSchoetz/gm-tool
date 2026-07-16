use tauri::State;

use crate::connectivity::{self, ConnectivityState};

#[tauri::command]
pub async fn request_pairing_code(
    state: State<'_, ConnectivityState>,
    endpoint_id: String,
) -> Result<(), String> {
    connectivity::request_pairing_code(state.inner(), &endpoint_id).await
}
