mod commands;

use commands::{
    PendingInstallState, check_update, delete_image, download_update, get_image_url,
    install_and_relaunch, save_image,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(PendingInstallState::new(None))
        .invoke_handler(tauri::generate_handler![
            check_update,
            delete_image,
            download_update,
            get_image_url,
            install_and_relaunch,
            save_image,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
