use std::path::Path;

use super::{app_data_dir, image_path, validate_image_request};

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
    validate_image_request(&id, &extension)?;
    url_in(&app_data_dir(&app_handle)?, &id, &extension)
}

fn url_in(app_data_dir: &Path, id: &str, extension: &str) -> Result<String, String> {
    let image_path = image_path(app_data_dir, id, extension)?;

    // Check if file exists
    if !image_path.exists() {
        return Err(format!("Image file not found: {}.{}", id, extension));
    }

    // Returns the raw path rather than a URL: the frontend passes it through convertFileSrc, which is what produces the asset-protocol URL an <img> tag can load.
    Ok(image_path.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::super::IMAGES_DIR;
    use super::*;
    use crate::commands::database_backup::test_dir::TestDir;
    use std::fs;

    #[test]
    fn returns_the_path_of_the_stored_file() {
        let dir = TestDir::new("images-url");
        let images = dir.path().join(IMAGES_DIR);
        fs::create_dir(&images).unwrap();
        fs::write(images.join("abc.webp"), b"x").unwrap();

        assert_eq!(
            url_in(dir.path(), "abc", "webp"),
            Ok(images.join("abc.webp").to_string_lossy().to_string())
        );
    }

    #[test]
    fn names_the_file_when_it_is_not_stored() {
        let dir = TestDir::new("images-url-missing");

        assert_eq!(
            url_in(dir.path(), "abc", "png"),
            Err("Image file not found: abc.png".to_string())
        );
    }

    #[test]
    fn rejects_an_invalid_id_or_extension_without_returning_a_path() {
        let dir = TestDir::new("images-url-invalid");
        // The files the invalid requests would reach: `images/../x.png` and `images/abc.exe`.
        fs::write(dir.path().join("x.png"), b"x").unwrap();
        let images = dir.path().join(IMAGES_DIR);
        fs::create_dir(&images).unwrap();
        fs::write(images.join("abc.exe"), b"x").unwrap();

        assert_eq!(
            url_in(dir.path(), "../x", "png"),
            Err("Invalid image id: ../x".to_string())
        );
        assert_eq!(
            url_in(dir.path(), "abc", "exe"),
            Err("Invalid file extension: exe".to_string())
        );
        assert_eq!(fs::read(dir.path().join("x.png")).unwrap(), b"x");
        assert_eq!(fs::read(images.join("abc.exe")).unwrap(), b"x");
    }
}
