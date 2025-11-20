# SPEC: Image Upload & Storage

## Purpose

Enable users to upload and store images for adventures (and potentially other entities) in the local Tauri app, with proper file management and database references.

## Architecture Overview

### Storage Strategy

**Local filesystem storage** using Tauri's app data directory:

- macOS: `~/Library/Application Support/com.gm-tool.app/images/`
- Windows: `C:\Users\<user>\AppData\Roaming\com.gm-tool.app\images/`
- Linux: `~/.config/gm-tool/images/`

**Database:** Dedicated `images` table with metadata, entities reference images by ID

### Data Flow

1. **User selects image** → Frontend file picker
2. **Frontend generates unique ID** → Uses existing `generateId()` util
3. **Frontend extracts extension** → From source file path
4. **Frontend invokes Rust command** → Passes source path, ID, and extension
5. **Rust copies file** → To app data directory as `{id}.{extension}`
6. **Frontend creates image record** → Insert into `images` table with metadata
7. **Frontend references image** → Store `image_id` in entity table (e.g., adventures)

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
-- Dedicated images table
CREATE TABLE images (
  id TEXT PRIMARY KEY,              -- nanoid (without extension)
  file_extension TEXT NOT NULL,     -- 'jpg', 'png', 'webp', 'gif'
  original_filename TEXT,           -- Optional: user's original filename
  file_size INTEGER,                -- Optional: bytes
  created_at INTEGER NOT NULL,      -- Unix timestamp
  updated_at INTEGER NOT NULL       -- Unix timestamp
);

-- Entity tables reference images
CREATE TABLE adventures (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_id TEXT REFERENCES images(id),  -- Foreign key to images table
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

**Filename on disk:** `{images.id}.{images.file_extension}`

**Example:** Image with id `V1StGXR8_Z5jdHi6B-myT` and extension `jpg` → stored as `V1StGXR8_Z5jdHi6B-myT.jpg`

### Schema Benefits

- **Metadata tracking** - Upload date, original filename, file size
- **Easier cleanup** - Query for orphaned images (no entity references)
- **Image reuse** - Same image can be used by multiple entities
- **Audit trail** - Track when each image was added
- **Flexibility** - Add image features without modifying entity tables
- **Separation of concerns** - Image lifecycle independent of entity lifecycle

### Query Examples

```sql
-- Get adventure with image
SELECT a.*, i.id as image_id, i.file_extension, i.created_at as image_created_at
FROM adventures a
LEFT JOIN images i ON a.image_id = i.id
WHERE a.id = ?

-- Find orphaned images (not referenced by any entity)
SELECT * FROM images
WHERE id NOT IN (
  SELECT DISTINCT image_id FROM adventures WHERE image_id IS NOT NULL
  -- Add UNION for other entity tables when they use images
)
```

## Rust Backend (Tauri Commands)

### Command: `save_image`

```rust
#[tauri::command]
async fn save_image(source_path: String, id: String, extension: String) -> Result<(), String>
```

**Responsibilities:**

- Validate file extension (allowed: jpg, jpeg, png, webp, gif)
- Ensure images directory exists
- Copy file from source to app_data/images/{id}.{extension}
- Return success/error

**Error handling:**

- Invalid extension → Error
- Source file not found → Error
- Copy failure → Error

### Command: `get_image_url`

```rust
#[tauri::command]
async fn get_image_url(id: String, extension: String) -> Result<String, String>
```

**Responsibilities:**

- Construct full path: app_data/images/{id}.{extension}
- Use Tauri's `convertFileSrc()` to make it frontend-accessible
- Return URL that can be used in `<img src={} />`

**Error handling:**

- File not found → Error

### Command: `delete_image`

```rust
#[tauri::command]
async fn delete_image(id: String, extension: String) -> Result<(), String>
```

**Responsibilities:**

- Delete file from filesystem
- Should be called when removing image from database

**Error handling:**

- File not found → Log warning but return success (already gone)

## Frontend Implementation

### TypeScript Utility

```typescript
// In src/util/ or dedicated image module

type SaveImageResult = {
  id: string;
  extension: string;
  originalFilename: string;
  fileSize: number;
};

export const saveImage = async (
  sourceFilePath: string
): Promise<SaveImageResult> => {
  // 1. Generate ID
  const id = generateId();

  // 2. Extract original filename
  const originalFilename = sourceFilePath.split('/').pop() || 'unknown';
  // probably needs Tauri's utilities like:
  // const originalFilename = await basename(sourceFilePath);

  // 3. Extract and validate extension
  const extension = sourceFilePath.split('.').pop()?.toLowerCase();
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  if (!extension || !allowed.includes(extension)) {
    throw new Error('Unsupported file type');
  }

  // 4. Get file size (optional, via Tauri fs API)
  const fileSize = 0; // TODO: Get actual file size

  // 5. Invoke Rust command to copy file
  await invoke('save_image', {
    sourcePath: sourceFilePath,
    id,
    extension,
  });

  // 6. Return data to insert into images table
  return {
    id,
    extension,
    originalFilename,
    fileSize,
  };
};

export const getImageUrl = async (
  id: string,
  extension: string
): Promise<string> => {
  return invoke<string>('get_image_url', { id, extension });
};

export const deleteImage = async (
  id: string,
  extension: string
): Promise<void> => {
  await invoke('delete_image', { id, extension });
};
```

### Database Operations

```typescript
// In db/image/ module (to be created)

type Image = {
  id: string;
  file_extension: string;
  original_filename: string | null;
  file_size: number | null;
  created_at: number;
  updated_at: number;
};

export const createImage = async (data: SaveImageResult): Promise<Image> => {
  const now = Date.now();
  const image: Image = {
    id: data.id,
    file_extension: data.extension,
    original_filename: data.originalFilename,
    file_size: data.fileSize,
    created_at: now,
    updated_at: now,
  };

  // Insert into database
  await db.run(
    `INSERT INTO images (id, file_extension, original_filename, file_size, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      image.id,
      image.file_extension,
      image.original_filename,
      image.file_size,
      image.created_at,
      image.updated_at,
    ]
  );

  return image;
};

export const getImage = async (id: string): Promise<Image | null> => {
  // Query from database
};

export const deleteImageRecord = async (id: string): Promise<void> => {
  // Delete from database
  // Also call deleteImage() utility to remove file
};
```

### React Component

```typescript
// ImageUpload component to be created
// Uses Tauri's dialog API for file picker
// Calls saveImage utility
// Creates image record in DB
// Emits image ID to parent for entity reference
```

### Complete Flow Example

```typescript
// In AdventureForm component
const handleImageUpload = async (sourceFilePath: string) => {
  // 1. Save file and get metadata
  const imageData = await saveImage(sourceFilePath);

  // 2. Create image record in DB
  const image = await createImage(imageData);

  // 3. Store image_id in adventure
  setFormData({ ...formData, image_id: image.id });

  // 4. Get URL for preview
  const url = await getImageUrl(image.id, image.file_extension);
  setPreviewUrl(url);
};
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
- [ ] Automated orphaned image cleanup task
- [ ] Bulk image upload
- [ ] Image cropping/editing
- [ ] Support for other entity types (NPCs, locations, items, etc.)
- [ ] Image dimensions stored in DB
- [ ] MIME type validation

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
