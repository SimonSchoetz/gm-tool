use std::fs;
use std::path::{Path, PathBuf};

use super::{IMAGES_DIR, app_data_dir, image_path};

/// Saves an image file from the source path to the app's data directory.
///
/// # Arguments
/// * `app_handle` - Tauri app handle for accessing app directories
/// * `source_path` - Path to the source image file
/// * `id` - Unique identifier for the image (nanoid)
/// * `extension` - File extension (jpg, jpeg, png, webp, gif)
///
/// # Returns
/// * `Ok(u64)` with file size in bytes on success
/// * `Err(String)` with error message on failure
#[tauri::command]
pub async fn save_image(
    app_handle: tauri::AppHandle,
    source_path: String,
    id: String,
    extension: String,
) -> Result<u64, String> {
    save_in(&app_data_dir(&app_handle)?, &source_path, &id, &extension)
}

fn save_in(
    app_data_dir: &Path,
    source_path: &str,
    id: &str,
    extension: &str,
) -> Result<u64, String> {
    // Validates the id and the extension before anything is created
    let destination_path = image_path(app_data_dir, id, extension)?;

    // Create images directory if it doesn't exist
    fs::create_dir_all(app_data_dir.join(IMAGES_DIR))
        .map_err(|e| format!("Failed to create images directory: {}", e))?;

    // source_path is deliberately unvalidated: no peer message routes to this command, and a compromised webview — the only caller — already holds sql:allow-execute and sql:allow-select, so constraining the path grants nothing it cannot already do. A real constraint needs a capability token tying the path to a dialog the user actually opened.
    let source = PathBuf::from(source_path);
    if !source.exists() {
        return Err(format!("Source file does not exist: {}", source_path));
    }

    let metadata =
        fs::metadata(&source).map_err(|e| format!("Failed to get file metadata: {}", e))?;
    let file_size = metadata.len();

    // Copy file
    fs::copy(&source, &destination_path).map_err(|e| format!("Failed to copy file: {}", e))?;

    Ok(file_size)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::database_backup::test_dir::TestDir;

    #[test]
    fn copies_the_file_into_the_images_folder_and_returns_its_size() {
        let dir = TestDir::new("images-save");
        let source = dir.path().join("picked.png");
        fs::write(&source, [1u8, 2, 3, 4, 5, 6, 7]).unwrap();

        let size = save_in(dir.path(), source.to_str().unwrap(), "abc", "png");

        assert_eq!(size, Ok(7));
        assert_eq!(
            fs::read(dir.path().join(IMAGES_DIR).join("abc.png")).unwrap(),
            vec![1u8, 2, 3, 4, 5, 6, 7]
        );
        assert!(source.exists());
    }

    #[test]
    fn returns_the_size_of_an_empty_file_as_zero() {
        let dir = TestDir::new("images-save-empty");
        let source = dir.path().join("empty.png");
        fs::write(&source, b"").unwrap();

        assert_eq!(
            save_in(dir.path(), source.to_str().unwrap(), "abc", "png"),
            Ok(0)
        );
    }

    #[test]
    fn names_a_source_file_that_does_not_exist() {
        let dir = TestDir::new("images-save-missing");
        let source = dir.path().join("nope.png");

        assert_eq!(
            save_in(dir.path(), source.to_str().unwrap(), "abc", "png"),
            Err(format!(
                "Source file does not exist: {}",
                source.to_str().unwrap()
            ))
        );
    }

    #[test]
    fn rejects_an_invalid_id_or_extension_before_creating_the_images_folder() {
        let dir = TestDir::new("images-save-invalid");
        let source = dir.path().join("picked.png");
        fs::write(&source, b"x").unwrap();
        let source = source.to_str().unwrap();

        assert_eq!(
            save_in(dir.path(), source, "../abc", "png"),
            Err("Invalid image id: ../abc".to_string())
        );
        assert_eq!(
            save_in(dir.path(), source, "abc", "exe"),
            Err("Invalid file extension: exe".to_string())
        );
        assert!(!dir.path().join(IMAGES_DIR).exists());
    }
}
