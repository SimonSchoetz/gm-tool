use tauri::{AppHandle, State};

use crate::connectivity::{self, ConnectivityState, TrustedPeer};

#[tauri::command]
pub async fn init_connectivity(
    app_handle: AppHandle,
    state: State<'_, ConnectivityState>,
    own_name: Option<String>,
    trusted_peers: Vec<TrustedPeer>,
) -> Result<String, String> {
    let result =
        connectivity::init(app_handle, state.inner().clone(), own_name, trusted_peers).await;
    // Diagnostic: init failures are silent by design in the UI (degraded mode), so the dev console is the only place they surface.
    match &result {
        Ok(id) => eprintln!("[connectivity] init ok, own id: {id}"),
        Err(error) => eprintln!("[connectivity] init FAILED: {error}"),
    }
    result
}
