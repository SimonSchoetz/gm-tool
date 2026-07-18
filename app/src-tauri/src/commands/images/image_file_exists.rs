use tauri::Manager;

use super::VALID_EXTENSIONS;

/// Checks whether a stored image file exists in the app's data directory.
///
/// # Arguments
/// * `app_handle` - Tauri app handle for accessing app directories
/// * `id` - Unique identifier for the image
/// * `extension` - File extension (jpg, jpeg, png, webp, gif)
///
/// # Returns
/// * `Ok(bool)` indicating whether the file exists
/// * `Err(String)` with error message on failure
#[tauri::command]
pub async fn image_file_exists(
    app_handle: tauri::AppHandle,
    id: String,
    extension: String,
) -> Result<bool, String> {
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

    Ok(image_path.exists())
}
