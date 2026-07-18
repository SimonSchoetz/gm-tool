use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use std::fs;
use tauri::Manager;

/// Writes base64-encoded image bytes to the app's data directory, overwriting any existing file.
///
/// # Arguments
/// * `app_handle` - Tauri app handle for accessing app directories
/// * `id` - Unique identifier for the image
/// * `extension` - File extension (jpg, jpeg, png, webp, gif)
/// * `data_base64` - Base64-encoded file contents
///
/// # Returns
/// * `Ok(())` on success
/// * `Err(String)` with error message on failure
#[tauri::command]
pub async fn save_image_bytes(
    app_handle: tauri::AppHandle,
    id: String,
    extension: String,
    data_base64: String,
) -> Result<(), String> {
    let valid_extensions = ["jpg", "jpeg", "png", "webp", "gif"];
    if !valid_extensions.contains(&extension.as_str()) {
        return Err(format!("Invalid file extension: {}", extension));
    }

    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let images_dir = app_data_dir.join("images");
    fs::create_dir_all(&images_dir)
        .map_err(|e| format!("Failed to create images directory: {}", e))?;

    let destination_path = images_dir.join(format!("{}.{}", id, extension));

    let bytes = BASE64_STANDARD
        .decode(data_base64)
        .map_err(|e| format!("Failed to decode base64 image data: {}", e))?;

    fs::write(&destination_path, bytes).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}
