# SPEC: Image Upload & Storage

## Purpose

Enable users to upload and store images for adventures (and potentially other entities) in the local Tauri app, with proper file management and database references.

## Architecture Overview

### Storage Strategy

**Local filesystem storage** using Tauri's app data directory:

- macOS: `~/Library/Application Support/com.gm-tool.app/images/`
- Windows: `C:\Users\<user>\AppData\Roaming\com.gm-tool.app\images/`
- Linux: `~/.config/gm-tool/images/`

**Database:** Store only the filename (not full path)

### Data Flow

1. **User selects image** → Frontend file picker
2. **Frontend generates unique filename** → Uses existing `generateId()` util + extension
3. **Frontend invokes Rust command** → Passes source path & target filename
4. **Rust copies file** → To app data directory with new filename
5. **Frontend stores filename in DB** → SQLite reference only

## File Naming Convention

**Format:** `{nanoid}.{extension}`

**Example:** `V1StGXR8_Z5jdHi6B-myT.jpg`

**Rationale:**

- Uses existing `generateId()` utility (nanoid) for consistency
- 21 characters, URL-safe (`A-Za-z0-9_-`)
- Collision-resistant
- No special characters - filesystem safe
- Extension preserved for proper mime-type handling

## Database Schema

```sql
-- Example for adventures table
ALTER TABLE adventures ADD COLUMN image_filename TEXT;

-- Stores: "V1StGXR8_Z5jdHi6B-myT.jpg"
-- NOT full path, just filename
```

## Rust Backend (Tauri Commands)

### Command: `save_image`

```rust
#[tauri::command]
async fn save_image(source_path: String, target_filename: String) -> Result<String, String>
```

**Responsibilities:**

- Validate file extension (allowed: jpg, jpeg, png, webp, gif)
- Ensure images directory exists
- Copy file from source to app_data/images/{target_filename}
- Return filename on success

**Error handling:**

- Invalid extension → Error
- Source file not found → Error
- Copy failure → Error

### Command: `get_image_path`

```rust
#[tauri::command]
async fn get_image_path(filename: String) -> Result<String, String>
```

**Responsibilities:**

- Convert filename to full local path
- Use Tauri's `convertFileSrc()` to make it frontend-accessible
- Return URL that can be used in `<img src={} />`

**Error handling:**

- File not found → Error

### Optional: `delete_image`

```rust
#[tauri::command]
async fn delete_image(filename: String) -> Result<(), String>
```

For cleanup when entities are deleted.

## Frontend Implementation

### TypeScript Utility

```typescript
// In src/util/ or dedicated image module

type SaveImageResult = {
  filename: string;
  url: string;
};

export const saveImage = async (
  sourceFilePath: string
): Promise<SaveImageResult> => {
  // 1. Generate ID
  const id = generateId();

  // 2. Extract and validate extension
  const extension = sourceFilePath.split('.').pop()?.toLowerCase();
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  if (!extension || !allowed.includes(extension)) {
    throw new Error('Unsupported file type');
  }

  // 3. Create target filename
  const targetFilename = `${id}.${extension}`;

  // 4. Invoke Rust command
  const filename = await invoke<string>('save_image', {
    sourcePath: sourceFilePath,
    targetFilename,
  });

  // 5. Get display URL
  const url = await invoke<string>('get_image_path', { filename });

  return { filename, url };
};

export const getImageUrl = async (filename: string): Promise<string> => {
  return invoke<string>('get_image_path', { filename });
};
```

### React Component

```typescript
// ImageUpload component to be created
// Uses Tauri's dialog API for file picker
// Calls saveImage utility
// Emits filename to parent for DB storage
```

## Validation & Security

**File type whitelist:**

- jpg, jpeg, png, webp, gif only
- Validate on both frontend and backend

**Path security:**

- Use Tauri's path resolver (no manual path construction)
- Validate filenames contain no path separators

**Size limits (optional future):**

- Consider max file size validation
- Consider image compression/optimization

## Future Enhancements

- [ ] Image compression before storage
- [ ] Thumbnail generation
- [ ] Orphaned image cleanup (images not referenced in DB)
- [ ] Bulk image upload
- [ ] Image cropping/editing
- [ ] Support for other entity types (NPCs, locations, etc.)

## Testing Considerations

**Rust:**

- Test file copying with various extensions
- Test invalid paths/extensions
- Test permissions issues

**Frontend:**

- Test file picker integration
- Test error states
- Test display of saved images

## Dependencies

**Frontend:**

- `@tauri-apps/api` (already installed)
- Existing `generateId` utility

**Backend (Rust):**

- `uuid` crate (if we add Rust-side ID generation later)
- Standard library `std::fs` for file operations
