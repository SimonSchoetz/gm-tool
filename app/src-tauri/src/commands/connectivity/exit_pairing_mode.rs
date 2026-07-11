use tauri::State;

use crate::connectivity::{self, ConnectivityState};

#[tauri::command]
pub async fn exit_pairing_mode(state: State<'_, ConnectivityState>) -> Result<(), String> {
    connectivity::exit_pairing_mode(state.inner()).await
}
