# CLAUDE.md - Rust Backend (Tauri)

This file provides guidance for working with the Rust backend code in the GM-Tool Tauri application.

## Structure

```
src-tauri/src/
├── main.rs           # Entry point
├── lib.rs            # Main library with app setup
└── commands/         # Tauri commands organized by feature
    ├── mod.rs        # Command module exports
    └── images/       # Image-related commands
        ├── mod.rs
        ├── save_image.rs
        ├── get_image_url.rs
        └── delete_image.rs
```

## Code Organization

### Commands Structure

- **One file per command** - Each Tauri command lives in its own file
- **Grouped by feature** - Related commands are grouped in subdirectories (e.g., `images/`)
- **Module files** - Each directory has a `mod.rs` that re-exports its commands
- **Flat exports** - The top-level `commands/mod.rs` re-exports all commands for easy registration

### Adding New Commands

1. **Create a new file** in the appropriate subdirectory:
   ```rust
   // src-tauri/src/commands/images/my_command.rs
   use tauri::Manager;

   #[tauri::command]
   pub async fn my_command(app_handle: tauri::AppHandle) -> Result<(), String> {
       // Implementation
       Ok(())
   }
   ```

2. **Add to module file**:
   ```rust
   // src-tauri/src/commands/images/mod.rs
   mod my_command;
   pub use my_command::my_command;
   ```

3. **Export from commands**:
   ```rust
   // src-tauri/src/commands/mod.rs
   pub use images::my_command;
   ```

4. **Register in lib.rs**:
   ```rust
   .invoke_handler(tauri::generate_handler![
       commands::my_command,
       // ... other commands
   ])
   ```

## Coding Conventions

### Error Handling

- Use `Result<T, String>` for command return types
- Return descriptive error messages
- Use `.map_err()` to convert errors to strings

### Documentation

- Add doc comments to all public functions
- Use `///` for documentation
- Document:
  - Purpose of the command
  - Arguments with types
  - Return values
  - Error cases

### Naming

- Use snake_case for functions and variables
- Use descriptive names that match the frontend API
- Command names should be action-oriented (e.g., `save_image`, `delete_image`)

## Common Patterns

### Accessing App Data Directory

```rust
let app_data_dir = app_handle
    .path()
    .app_data_dir()
    .map_err(|e| format!("Failed to get app data directory: {}", e))?;
```

### File Operations

```rust
use std::fs;

// Create directory
fs::create_dir_all(&path)
    .map_err(|e| format!("Failed to create directory: {}", e))?;

// Copy file
fs::copy(&source, &destination)
    .map_err(|e| format!("Failed to copy file: {}", e))?;

// Delete file (with graceful handling)
match fs::remove_file(&path) {
    Ok(()) => Ok(()),
    Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
    Err(e) => Err(format!("Failed to delete file: {}", e)),
}
```

### Path Construction

```rust
use std::path::PathBuf;

let path = app_data_dir
    .join("subdirectory")
    .join(format!("{}.{}", id, extension));
```

## Image Commands

### save_image

Copies an image file from user's filesystem to app data directory.

**Arguments:**
- `source_path: String` - Path to the source file
- `id: String` - Unique identifier (nanoid)
- `extension: String` - File extension (validated)

**Location:** `images/{id}.{extension}` in app data directory

### get_image_url

Gets a URL that can be used in frontend `<img>` tags.

**Arguments:**
- `id: String` - Image identifier
- `extension: String` - File extension

**Returns:** Asset protocol URL

### delete_image

Deletes an image file from the filesystem.

**Arguments:**
- `id: String` - Image identifier
- `extension: String` - File extension

**Behavior:** Returns success even if file doesn't exist (already gone)

## Testing

TODO: Add testing patterns when implemented

## Dependencies

Current dependencies in `Cargo.toml`:
- `tauri` - Core framework
- `tauri-plugin-dialog` - File dialogs
- `tauri-plugin-opener` - Opening files/URLs
- `tauri-plugin-sql` - SQLite support

## Best Practices

- **Always validate input** - Check file extensions, paths, etc.
- **Graceful error handling** - Return descriptive errors, don't panic
- **Use Tauri's path APIs** - Don't construct paths manually
- **Async where appropriate** - Use `async fn` for I/O operations
- **Security first** - Validate all user input, use safe path operations
