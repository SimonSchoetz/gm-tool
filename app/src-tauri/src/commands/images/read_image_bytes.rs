use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use std::fs;
use std::path::Path;

use super::{app_data_dir, image_path};

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
    read_in(&app_data_dir(&app_handle)?, &id, &extension)
}

fn read_in(app_data_dir: &Path, id: &str, extension: &str) -> Result<String, String> {
    let image_path = image_path(app_data_dir, id, extension)?;

    let bytes = fs::read(&image_path).map_err(|e| format!("Failed to read file: {}", e))?;

    Ok(BASE64_STANDARD.encode(bytes))
}

#[cfg(test)]
mod tests {
    use super::super::IMAGES_DIR;
    use super::*;
    use crate::commands::database_backup::test_dir::TestDir;

    #[test]
    fn returns_the_stored_bytes_base64_encoded() {
        let dir = TestDir::new("images-read");
        let images = dir.path().join(IMAGES_DIR);
        fs::create_dir(&images).unwrap();
        fs::write(images.join("abc.png"), [0u8, 1, 2, 250, 255]).unwrap();

        assert_eq!(
            read_in(dir.path(), "abc", "png"),
            Ok("AAEC+v8=".to_string())
        );
    }

    #[test]
    fn returns_an_empty_string_for_an_empty_file() {
        let dir = TestDir::new("images-read-empty");
        let images = dir.path().join(IMAGES_DIR);
        fs::create_dir(&images).unwrap();
        fs::write(images.join("abc.png"), b"").unwrap();

        assert_eq!(read_in(dir.path(), "abc", "png"), Ok(String::new()));
    }

    #[test]
    fn fails_when_the_file_is_not_stored() {
        let dir = TestDir::new("images-read-missing");

        assert!(
            read_in(dir.path(), "abc", "png")
                .unwrap_err()
                .starts_with("Failed to read file: ")
        );
    }

    #[test]
    fn rejects_an_invalid_id_or_extension_with_the_error_naming_it() {
        let dir = TestDir::new("images-read-invalid");

        assert_eq!(
            read_in(dir.path(), "", "png"),
            Err("Invalid image id: ".to_string())
        );
        assert_eq!(
            read_in(dir.path(), "abc", "tiff"),
            Err("Invalid file extension: tiff".to_string())
        );
    }
}
