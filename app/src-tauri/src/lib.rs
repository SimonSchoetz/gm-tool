mod commands;
mod connectivity;

use commands::{
    PendingInstallState, check_update, delete_image, download_update, enter_pairing_mode,
    exit_pairing_mode, get_connected_peers, get_image_url, init_connectivity, install_and_relaunch,
    remove_trusted_peer, request_pairing_code, save_image, send_message, submit_pairing_code,
    update_own_name,
};
use connectivity::ConnectivityState;
use tauri::{Manager, RunEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(PendingInstallState::new(None))
        .manage(ConnectivityState::default())
        .invoke_handler(tauri::generate_handler![
            check_update,
            delete_image,
            download_update,
            enter_pairing_mode,
            exit_pairing_mode,
            get_connected_peers,
            get_image_url,
            init_connectivity,
            install_and_relaunch,
            remove_trusted_peer,
            request_pairing_code,
            save_image,
            send_message,
            submit_pairing_code,
            update_own_name,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if matches!(event, RunEvent::Exit) {
                let state = app_handle.state::<ConnectivityState>();
                tauri::async_runtime::block_on(connectivity::shutdown(&state));
            }
        });
}
