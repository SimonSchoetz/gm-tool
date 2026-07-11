use tauri::State;

use crate::connectivity::{self, ConnectivityState};

#[tauri::command]
pub async fn remove_trusted_peer(
    state: State<'_, ConnectivityState>,
    endpoint_id: String,
) -> Result<(), String> {
    connectivity::remove_peer(state.inner(), &endpoint_id).await
}
