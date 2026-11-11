use std::fs;
use std::path::Path;

use super::{app_data_dir, image_path, validate_image_request};

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
    validate_image_request(&id, &extension)?;
    delete_in(&app_data_dir(&app_handle)?, &id, &extension)
}

fn delete_in(app_data_dir: &Path, id: &str, extension: &str) -> Result<(), String> {
    let image_path = image_path(app_data_dir, id, extension)?;

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

#[cfg(test)]
mod tests {
    use super::super::IMAGES_DIR;
    use super::*;
    use crate::commands::database_backup::test_dir::TestDir;

    #[test]
    fn removes_the_stored_file_and_leaves_the_others() {
        let dir = TestDir::new("images-delete");
        let images = dir.path().join(IMAGES_DIR);
        fs::create_dir(&images).unwrap();
        fs::write(images.join("abc.png"), b"x").unwrap();
        fs::write(images.join("abd.png"), b"y").unwrap();

        assert_eq!(delete_in(dir.path(), "abc", "png"), Ok(()));

        assert!(!images.join("abc.png").exists());
        assert!(images.join("abd.png").exists());
    }

    #[test]
    fn succeeds_when_the_file_is_already_gone() {
        let dir = TestDir::new("images-delete-gone");

        assert_eq!(delete_in(dir.path(), "abc", "png"), Ok(()));
    }

    #[test]
    fn fails_when_the_file_cannot_be_removed_for_a_reason_other_than_being_absent() {
        let dir = TestDir::new("images-delete-unremovable");
        // A folder where the file belongs: remove_file fails on it, and not with NotFound.
        fs::create_dir_all(dir.path().join(IMAGES_DIR).join("abc.png")).unwrap();

        assert!(
            delete_in(dir.path(), "abc", "png")
                .unwrap_err()
                .starts_with("Failed to delete file: ")
        );
    }

    #[test]
    fn rejects_an_invalid_id_or_extension_and_deletes_nothing() {
        let dir = TestDir::new("images-delete-invalid");
        // The files the invalid requests would reach: `images/../x.png` and `images/abc.exe`.
        fs::write(dir.path().join("x.png"), b"x").unwrap();
        let images = dir.path().join(IMAGES_DIR);
        fs::create_dir(&images).unwrap();
        fs::write(images.join("abc.exe"), b"x").unwrap();

        assert_eq!(
            delete_in(dir.path(), "../x", "png"),
            Err("Invalid image id: ../x".to_string())
        );
        assert_eq!(
            delete_in(dir.path(), "abc", "exe"),
            Err("Invalid file extension: exe".to_string())
        );
        assert!(dir.path().join("x.png").exists());
        assert!(images.join("abc.exe").exists());
    }
}
