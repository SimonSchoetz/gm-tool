// Command modules
pub mod images;

// Re-export all commands for easy registration
pub use images::{delete_image, get_image_url, save_image};
