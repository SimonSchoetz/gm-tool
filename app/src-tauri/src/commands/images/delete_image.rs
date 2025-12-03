use std::fs;
use tauri::Manager;

/// Deletes an image file from the app's data directory.
///
/// # Arguments
/// * `app_handle` - Tauri app handle for accessing app directories
/// * `id` - Unique identifier for the image
/// * `extension` - File extension (jpg, jpeg, png, webp, gif)
///
/// # Returns
/// * `Ok(())` on success (even if file doesn't exist - already gone)
/// * `Err(String)` with error message on critical failure
#[tauri::command]
pub async fn delete_image(
    app_handle: tauri::AppHandle,
    id: String,
    extension: String,
) -> Result<(), String> {
    // Get app data directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    // Construct image path
    let image_path = app_data_dir
        .join("images")
        .join(format!("{}.{}", id, extension));

    // Attempt to delete the file
    match fs::remove_file(&image_path) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            // File doesn't exist - that's fine, already gone
            Ok(())
        }
        Err(e) => Err(format!("Failed to delete file: {}", e)),
    }
}
