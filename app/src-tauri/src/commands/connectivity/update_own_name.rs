use tauri::State;

use crate::connectivity::{self, ConnectivityState};

#[tauri::command]
pub async fn update_own_name(
    state: State<'_, ConnectivityState>,
    name: Option<String>,
) -> Result<(), String> {
    connectivity::set_own_name(state.inner(), name).await
}
