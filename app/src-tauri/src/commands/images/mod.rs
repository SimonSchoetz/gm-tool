// Image-related commands
mod delete_image;
mod get_image_url;
mod image_file_exists;
mod read_image_bytes;
mod save_image;
mod save_image_bytes;

// Re-export the command functions
pub use delete_image::delete_image;
pub use get_image_url::get_image_url;
pub use image_file_exists::image_file_exists;
pub use read_image_bytes::read_image_bytes;
pub use save_image::save_image;
pub use save_image_bytes::save_image_bytes;

pub(crate) const VALID_EXTENSIONS: [&str; 5] = ["jpg", "jpeg", "png", "webp", "gif"];

/// Image ids come from nanoid over the URL-safe alphabet. Restricting to that character class keeps a peer- or webview-supplied id from carrying a path separator, a `..` sequence, or a NUL into the joined file path — `PathBuf::join` does not resolve any of them, the OS does, at open time.
pub(crate) fn is_valid_image_id(id: &str) -> bool {
    !id.is_empty()
        && id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}
