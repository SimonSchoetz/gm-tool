use tauri::State;

use crate::connectivity::{self, ConnectivityState};

#[tauri::command]
pub async fn get_connected_peers(
    state: State<'_, ConnectivityState>,
) -> Result<Vec<String>, String> {
    connectivity::connected_peers(state.inner()).await
}
