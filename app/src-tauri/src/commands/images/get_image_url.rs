use tauri::Manager;

/// Gets a URL for an image that can be used in frontend <img> tags.
///
/// # Arguments
/// * `app_handle` - Tauri app handle for accessing app directories
/// * `id` - Unique identifier for the image
/// * `extension` - File extension (jpg, jpeg, png, webp, gif)
///
/// # Returns
/// * `Ok(String)` with the converted URL on success
/// * `Err(String)` with error message on failure
#[tauri::command]
pub async fn get_image_url(
    app_handle: tauri::AppHandle,
    id: String,
    extension: String,
) -> Result<String, String> {
    // Get app data directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    // Construct image path
    let image_path = app_data_dir
        .join("images")
        .join(format!("{}.{}", id, extension));

    // Check if file exists
    if !image_path.exists() {
        return Err(format!("Image file not found: {}.{}", id, extension));
    }

    // Convert path to a URL that can be used in the frontend
    // Tauri uses the convertFileSrc API on the frontend, so we just return the path
    Ok(image_path.to_string_lossy().to_string())
}
