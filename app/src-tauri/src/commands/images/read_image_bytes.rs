use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use std::fs;
use tauri::Manager;

use super::VALID_EXTENSIONS;

/// Reads a stored image file and returns its contents as a base64-encoded string.
///
/// # Arguments
/// * `app_handle` - Tauri app handle for accessing app directories
/// * `id` - Unique identifier for the image
/// * `extension` - File extension (jpg, jpeg, png, webp, gif)
///
/// # Returns
/// * `Ok(String)` with the base64-encoded file contents on success
/// * `Err(String)` with error message when the file does not exist or cannot be read
#[tauri::command]
pub async fn read_image_bytes(
    app_handle: tauri::AppHandle,
    id: String,
    extension: String,
) -> Result<String, String> {
    if !VALID_EXTENSIONS.contains(&extension.as_str()) {
        return Err(format!("Invalid file extension: {}", extension));
    }

    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let image_path = app_data_dir
        .join("images")
        .join(format!("{}.{}", id, extension));

    let bytes = fs::read(&image_path).map_err(|e| format!("Failed to read file: {}", e))?;

    Ok(BASE64_STANDARD.encode(bytes))
}
