// Image-related commands
mod delete_image;
mod get_image_url;
mod save_image;

// Re-export the command functions
pub use delete_image::delete_image;
pub use get_image_url::get_image_url;
pub use save_image::save_image;
