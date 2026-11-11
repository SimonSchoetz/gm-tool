use std::path::Path;

use super::{app_data_dir, image_path};

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
pub async fn check_image_file_exists(
    app_handle: tauri::AppHandle,
    id: String,
    extension: String,
) -> Result<bool, String> {
    exists_in(&app_data_dir(&app_handle)?, &id, &extension)
}

fn exists_in(app_data_dir: &Path, id: &str, extension: &str) -> Result<bool, String> {
    Ok(image_path(app_data_dir, id, extension)?.exists())
}

#[cfg(test)]
mod tests {
    use super::super::IMAGES_DIR;
    use super::*;
    use crate::commands::database_backup::test_dir::TestDir;
    use std::fs;

    #[test]
    fn reports_whether_the_file_of_the_id_and_extension_is_stored() {
        let dir = TestDir::new("images-exists");
        fs::create_dir(dir.path().join(IMAGES_DIR)).unwrap();
        fs::write(dir.path().join(IMAGES_DIR).join("abc.png"), b"x").unwrap();

        assert_eq!(exists_in(dir.path(), "abc", "png"), Ok(true));
        assert_eq!(exists_in(dir.path(), "abc", "jpg"), Ok(false));
        assert_eq!(exists_in(dir.path(), "other", "png"), Ok(false));
    }

    #[test]
    fn rejects_an_invalid_id_or_extension_with_the_error_naming_it() {
        let dir = TestDir::new("images-exists-invalid");

        assert_eq!(
            exists_in(dir.path(), "../abc", "png"),
            Err("Invalid image id: ../abc".to_string())
        );
        assert_eq!(
            exists_in(dir.path(), "abc", "exe"),
            Err("Invalid file extension: exe".to_string())
        );
    }
}
