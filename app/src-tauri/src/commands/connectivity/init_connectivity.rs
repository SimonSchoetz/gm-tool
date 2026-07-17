use tauri::{AppHandle, State};

use crate::connectivity::{self, ConnectivityState, TrustedPeer};

#[tauri::command]
pub async fn init_connectivity(
    app_handle: AppHandle,
    state: State<'_, ConnectivityState>,
    own_name: Option<String>,
    trusted_peers: Vec<TrustedPeer>,
) -> Result<String, String> {
    connectivity::init(app_handle, state.inner().clone(), own_name, trusted_peers).await
}
