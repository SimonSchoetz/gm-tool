use tauri::State;

use crate::connectivity::{self, ConnectivityState};

#[tauri::command]
pub async fn send_message(
    state: State<'_, ConnectivityState>,
    endpoint_id: String,
    envelope: String,
) -> Result<(), String> {
    connectivity::send_envelope(state.inner(), &endpoint_id, envelope).await
}
