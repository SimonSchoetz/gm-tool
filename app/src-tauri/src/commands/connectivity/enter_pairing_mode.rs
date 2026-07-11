use tauri::State;

use crate::connectivity::{self, ConnectivityState};

#[tauri::command]
pub async fn enter_pairing_mode(state: State<'_, ConnectivityState>) -> Result<String, String> {
    connectivity::enter_pairing_mode(state.inner()).await
}
