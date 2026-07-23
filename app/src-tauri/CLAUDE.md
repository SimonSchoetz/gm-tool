# CLAUDE.md - Rust Backend (Tauri)

This file provides guidance for working with the Rust backend code in the GM-Tool Tauri application.

## Structure

```text
src-tauri/src/
├── main.rs             # Entry point
├── lib.rs              # Main library with app setup
├── connectivity/        # Networking core — one file per concern
│   ├── mod.rs           # Shared state (ConnectivityState/ConnectivityData), event/payload types
│   ├── identity.rs       # Device secret-key persistence
│   ├── pairing.rs        # Pairing-mode session lifecycle
│   └── connections.rs    # Main-connection lifecycle
└── commands/           # Tauri commands, grouped by feature — one file per command; see per-feature sections below for the full current command list
    ├── mod.rs          # Re-exports every command for registration
    ├── images/
    ├── updater/
    └── connectivity/     # Thin wrappers delegating to `connectivity/` — see Connectivity Commands below
```

## Code Organization

### Commands Structure

- **One file per command** - Each Tauri command lives in its own file
- **Grouped by feature** - Related commands are grouped in subdirectories (e.g., `images/`)
- **Module files** - Each directory has a `mod.rs` that re-exports its commands
- **Flat exports** - The top-level `commands/mod.rs` re-exports all commands for easy registration
- **Connectivity is layered** — `commands/connectivity/` files are thin wrappers with no logic of their own; each delegates directly to the corresponding function in `connectivity/` (e.g. `commands::connectivity::send_message` calls `connectivity::send_envelope`). `connectivity/` owns all networking state and logic; `commands/connectivity/` only adapts it to the `#[tauri::command]` boundary.

### State Management

When a command needs to persist data for use by a subsequent command, use a shared app state type registered in `lib.rs` via `.manage()` and accessed in commands via `State<'_, T>`.

The canonical pattern is `Mutex<Option<PendingInstall>>` (defined in `commands/updater/pending_install.rs`): the first command acquires the lock and writes `Some(data)`; the second command takes the value out (`take()`) and returns `None` as the new state. Register the type alias as the managed state in `lib.rs`:

```rust
.manage(PendingInstallState::new(None))
```

Only the type alias (`PendingInstallState`) is re-exported from the module barrel — the inner struct (`PendingInstall`) stays private to the module.

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

- Use `///` for documentation
- Document only when the function's purpose isn't self-evident from its name and signature

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

## Updater Commands

The updater uses a two-phase flow: `download_update` fetches and stores the binary in `PendingInstallState`; `install_and_relaunch` consumes it and restarts the app. Both commands require `PendingInstallState` to be registered in `lib.rs` via `.manage(PendingInstallState::new(None))`.

### check_update

Checks whether a new version is available via `tauri-plugin-updater`.

**Arguments:** none

**Returns:** `Result<Option<String>, String>` — `Some(version_string)` if an update is available; `None` if already up to date; `Err(message)` on network or plugin failure.

### download_update

Downloads the update binary and stores it in `PendingInstallState` for a subsequent `install_and_relaunch` call.

**Arguments:**
- `on_event: Channel<DownloadEvent>` — IPC channel for streaming download progress to the frontend

**`DownloadEvent` variants** (serialized with `tag = "event", content = "data"`, camelCase):
- `Progress { chunkLength: number, contentLength: number | null }` — emitted once per downloaded chunk

**Returns:** `Result<(), String>` — `Ok(())` on success; `Err(message)` if no update is available or the download fails.

**Behavior:** Calls `updater.check()` internally — errors if no update is available rather than no-op.

### install_and_relaunch

Installs the previously downloaded update and restarts the application.

**Arguments:** none

**Returns:** `Result<(), String>` — errors with `"No downloaded update available"` if `download_update` was not called first; otherwise does not return (`app.restart()` is diverging).

**Behavior:** Takes the pending install out of state (leaving `None`), calls `update.install(bytes)`, then calls `app.restart()`. Calling this without a prior successful `download_update` is an error.

## Connectivity Commands

Connectivity commands adapt `connectivity/` (the networking core — see Structure above) to the `#[tauri::command]` boundary; each command is a thin delegation with no logic of its own. All connectivity commands take `state: State<'_, ConnectivityState>`, where `ConnectivityState = Arc<Mutex<ConnectivityData>>` is registered in `lib.rs` via `.manage(ConnectivityState::default())`.

### init_connectivity

Initializes the connectivity endpoint and restores trusted peers.

**Arguments:**
- `app_handle: AppHandle`
- `state: State<'_, ConnectivityState>`
- `own_name: Option<String>`
- `trusted_peers: Vec<TrustedPeer>` — each `{ endpointId: String, name: Option<String> }`; Rust only consumes `endpointId` (`name` persists TS-side only)

**Returns:** `Result<String, String>` — own endpoint id on success

**Behavior:** delegates to `connectivity::init`.

### enter_pairing_mode

Starts advertising this device for pairing and probes already-known peers retroactively (peers discovered before the session started are probed immediately rather than waiting for the next mDNS announcement).

**Arguments:**
- `app_handle: AppHandle`
- `state: State<'_, ConnectivityState>`

**Returns:** `Result<String, String>`

**Behavior:** delegates to `connectivity::enter_pairing_mode`.

### exit_pairing_mode

**Arguments:** `state: State<'_, ConnectivityState>`

**Returns:** `Result<(), String>`

**Behavior:** delegates to `connectivity::exit_pairing_mode`.

### submit_pairing_code

Submits a pairing code as the requesting side.

**Arguments:**
- `state: State<'_, ConnectivityState>`
- `endpoint_id: String`
- `code: String`

**Returns:** `Result<(), String>`

**Behavior:** delegates to `connectivity::submit_pairing_code`.

### request_pairing_code

Requests the other side generate and display a pairing code (a random 6-digit code via `rand::random_range`).

**Arguments:**
- `state: State<'_, ConnectivityState>`
- `endpoint_id: String`

**Returns:** `Result<(), String>`

**Behavior:** delegates to `connectivity::request_pairing_code`.

### send_message

**Arguments:**
- `state: State<'_, ConnectivityState>`
- `endpoint_id: String`
- `envelope: String` — opaque serialized payload; Rust does not interpret its contents

**Returns:** `Result<(), String>`

**Behavior:** delegates to `connectivity::send_envelope`.

### remove_trusted_peer

**Arguments:**
- `state: State<'_, ConnectivityState>`
- `endpoint_id: String`

**Returns:** `Result<(), String>`

**Behavior:** delegates to `connectivity::remove_peer`.

### get_connected_peers

**Arguments:** `state: State<'_, ConnectivityState>`

**Returns:** `Result<Vec<String>, String>` — connected peers' endpoint ids

**Behavior:** delegates to `connectivity::connected_peers`.

### update_own_name

**Arguments:**
- `state: State<'_, ConnectivityState>`
- `name: Option<String>`

**Returns:** `Result<(), String>`

**Behavior:** delegates to `connectivity::set_own_name`.

## Testing

TODO: Add testing patterns when implemented

## Dependencies

Every dependency's purpose is documented inline in `Cargo.toml` as a trailing `# <purpose>` comment on its own line — not duplicated here, since a hand-maintained copy of the list drifts the moment a dependency is added or removed without a matching CLAUDE.md edit (as happened twice: the original connectivity crates, and now `base64`). When adding a new dependency, add its purpose comment in the same commit. Read `Cargo.toml` directly for the current list.

