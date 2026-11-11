use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use std::fs;
use std::path::Path;

use super::{IMAGES_DIR, app_data_dir, image_path};

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
    save_bytes_in(&app_data_dir(&app_handle)?, &id, &extension, data_base64)
}

fn save_bytes_in(
    app_data_dir: &Path,
    id: &str,
    extension: &str,
    data_base64: String,
) -> Result<(), String> {
    // Validates the id and the extension before anything is created
    let destination_path = image_path(app_data_dir, id, extension)?;

    fs::create_dir_all(app_data_dir.join(IMAGES_DIR))
        .map_err(|e| format!("Failed to create images directory: {}", e))?;

    let bytes = BASE64_STANDARD
        .decode(data_base64)
        .map_err(|e| format!("Failed to decode base64 image data: {}", e))?;

    fs::write(&destination_path, bytes).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::database_backup::test_dir::TestDir;

    #[test]
    fn writes_the_decoded_bytes_into_the_images_folder_and_overwrites_an_existing_file() {
        let dir = TestDir::new("images-save-bytes");

        assert_eq!(
            save_bytes_in(dir.path(), "abc", "png", "AAEC+v8=".to_string()),
            Ok(())
        );
        let stored = dir.path().join(IMAGES_DIR).join("abc.png");
        assert_eq!(fs::read(&stored).unwrap(), vec![0u8, 1, 2, 250, 255]);

        assert_eq!(
            save_bytes_in(dir.path(), "abc", "png", "AQ==".to_string()),
            Ok(())
        );
        assert_eq!(fs::read(&stored).unwrap(), vec![1u8]);
    }

    #[test]
    fn writes_an_empty_file_for_empty_data() {
        let dir = TestDir::new("images-save-bytes-empty");

        assert_eq!(
            save_bytes_in(dir.path(), "abc", "png", String::new()),
            Ok(())
        );
        assert!(
            fs::read(dir.path().join(IMAGES_DIR).join("abc.png"))
                .unwrap()
                .is_empty()
        );
    }

    #[test]
    fn rejects_data_that_is_not_base64_and_writes_nothing() {
        let dir = TestDir::new("images-save-bytes-bad");

        assert!(
            save_bytes_in(dir.path(), "abc", "png", "not base64!".to_string())
                .unwrap_err()
                .starts_with("Failed to decode base64 image data: ")
        );
        assert!(!dir.path().join(IMAGES_DIR).join("abc.png").exists());
    }

    #[test]
    fn rejects_an_invalid_id_or_extension_before_creating_the_images_folder() {
        let dir = TestDir::new("images-save-bytes-invalid");

        assert_eq!(
            save_bytes_in(dir.path(), "a b", "png", "AQ==".to_string()),
            Err("Invalid image id: a b".to_string())
        );
        assert_eq!(
            save_bytes_in(dir.path(), "abc", "svg", "AQ==".to_string()),
            Err("Invalid file extension: svg".to_string())
        );
        assert!(!dir.path().join(IMAGES_DIR).exists());
    }
}
