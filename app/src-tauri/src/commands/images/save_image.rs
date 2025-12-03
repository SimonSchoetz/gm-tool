use std::fs;
use std::path::PathBuf;
use tauri::Manager;

/// Saves an image file from the source path to the app's data directory.
///
/// # Arguments
/// * `app_handle` - Tauri app handle for accessing app directories
/// * `source_path` - Path to the source image file
/// * `id` - Unique identifier for the image (nanoid)
/// * `extension` - File extension (jpg, jpeg, png, webp, gif)
///
/// # Returns
/// * `Ok(())` on success
/// * `Err(String)` with error message on failure
#[tauri::command]
pub async fn save_image(
    app_handle: tauri::AppHandle,
    source_path: String,
    id: String,
    extension: String,
) -> Result<(), String> {
    // Validate extension
    let valid_extensions = ["jpg", "jpeg", "png", "webp", "gif"];
    if !valid_extensions.contains(&extension.as_str()) {
        return Err(format!("Invalid file extension: {}", extension));
    }

    // Get app data directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    // Create images directory if it doesn't exist
    let images_dir = app_data_dir.join("images");
    fs::create_dir_all(&images_dir)
        .map_err(|e| format!("Failed to create images directory: {}", e))?;

    // Construct destination path
    let destination_path = images_dir.join(format!("{}.{}", id, extension));

    // Check if source file exists
    let source = PathBuf::from(&source_path);
    if !source.exists() {
        return Err(format!("Source file does not exist: {}", source_path));
    }

    // Copy file
    fs::copy(&source, &destination_path)
        .map_err(|e| format!("Failed to copy file: {}", e))?;

    Ok(())
}
