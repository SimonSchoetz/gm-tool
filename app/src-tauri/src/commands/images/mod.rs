// Image-related commands
mod check_image_file_exists;
mod delete_image;
mod get_image_url;
mod read_image_bytes;
mod save_image;
mod save_image_bytes;

// Re-export the command functions
pub use check_image_file_exists::check_image_file_exists;
pub use delete_image::delete_image;
pub use get_image_url::get_image_url;
pub use read_image_bytes::read_image_bytes;
pub use save_image::save_image;
pub use save_image_bytes::save_image_bytes;

use std::path::{Path, PathBuf};
use tauri::Manager;

pub(crate) const VALID_EXTENSIONS: [&str; 5] = ["jpg", "jpeg", "png", "webp", "gif"];

/// The folder of the app data directory that holds the stored image files.
pub(crate) const IMAGES_DIR: &str = "images";

/// Image ids come from nanoid over the URL-safe alphabet. Restricting to that character class keeps a peer- or webview-supplied id from carrying a path separator, a `..` sequence, or a NUL into the joined file path — `PathBuf::join` does not resolve any of them, the OS does, at open time.
pub(crate) fn is_valid_image_id(id: &str) -> bool {
    !id.is_empty()
        && id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

/// The app data directory every image command resolves its file under.
pub(crate) fn app_data_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {e}"))
}

/// The error that names the id or the extension an image file name cannot carry. Each command runs it before it resolves the app data directory, so a bad request is refused first.
pub(crate) fn validate_image_request(id: &str, extension: &str) -> Result<(), String> {
    if !is_valid_image_id(id) {
        return Err(format!("Invalid image id: {id}"));
    }

    if !VALID_EXTENSIONS.contains(&extension) {
        return Err(format!("Invalid file extension: {extension}"));
    }

    Ok(())
}

/// The path of the stored image file `<id>.<extension>` under `app_data_dir`, or the error `validate_image_request` gives.
pub(crate) fn image_path(
    app_data_dir: &Path,
    id: &str,
    extension: &str,
) -> Result<PathBuf, String> {
    validate_image_request(id, extension)?;

    Ok(app_data_dir
        .join(IMAGES_DIR)
        .join(format!("{id}.{extension}")))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_ids_of_letters_digits_hyphens_and_underscores() {
        for id in ["abc", "A1", "a-b_c", "V1StGXR8_Z5jdHi6B-myT", "0"] {
            assert!(is_valid_image_id(id), "{id} should be valid");
        }
    }

    #[test]
    fn rejects_an_empty_id_and_every_character_that_could_reach_outside_the_folder() {
        for id in [
            "", ".", "..", "a/b", "a\\b", "a b", "a.b", "a\0b", "é", "a:b",
        ] {
            assert!(!is_valid_image_id(id), "{id:?} should be invalid");
        }
    }

    #[test]
    fn builds_the_path_of_an_image_under_the_images_folder() {
        for extension in VALID_EXTENSIONS {
            assert_eq!(
                image_path(Path::new("/data"), "abc-1", extension).unwrap(),
                Path::new("/data")
                    .join("images")
                    .join(format!("abc-1.{extension}")),
            );
        }
    }

    #[test]
    fn names_an_invalid_id_or_extension_instead_of_building_a_path() {
        assert_eq!(
            image_path(Path::new("/data"), "../x", "png").unwrap_err(),
            "Invalid image id: ../x"
        );
        assert_eq!(
            image_path(Path::new("/data"), "abc", "exe").unwrap_err(),
            "Invalid file extension: exe"
        );
        assert_eq!(
            image_path(Path::new("/data"), "abc", "").unwrap_err(),
            "Invalid file extension: "
        );
    }
}
