# SF2 — Image id path-traversal guard

`imageId` arrives from a paired peer as an unconstrained string on both the `file-request` and `file-chunk` sync messages, is forwarded unmodified into the Tauri image commands, and is interpolated into a filesystem path by `images_dir.join(format!("{}.{}", id, extension))`. `PathBuf::join` does not resolve `..`; the OS resolves it at open time. An `imageId` of `../../../../Users/<name>/Pictures/private` therefore produces a read of, or a write to, that path. This sub-feature validates `id` in the Rust commands, which are the real trust boundary, and rejects a malformed id at the message edge as well.

## Files affected

`Modified:`

- `app/src-tauri/src/commands/images/mod.rs` — add the `is_valid_image_id` helper next to `VALID_EXTENSIONS`
- `app/src-tauri/src/commands/images/read_image_bytes.rs` — call the id guard
- `app/src-tauri/src/commands/images/save_image_bytes.rs` — call the id guard
- `app/src-tauri/src/commands/images/save_image.rs` — call the id guard; add the accepted-risk comment for `source_path`
- `app/src-tauri/src/commands/images/image_file_exists.rs` — call the id guard
- `app/src-tauri/src/commands/images/delete_image.rs` — call the id guard; add the missing `VALID_EXTENSIONS` check
- `app/src-tauri/src/commands/images/get_image_url.rs` — call the id guard; add the missing `VALID_EXTENSIONS` check
- `app/domain/sync/messages.ts` — add the `IMAGE_ID_REGEX` module constant and apply it to `imageId` on both file-transfer payloads
- `app/domain/sync/__tests__/messages.test.ts` — add two rejection tests for a malformed `imageId`

No barrel change. `app/domain/sync/index.ts` uses explicit named exports and re-exports `syncMessageSchema` and the five builder functions from `messages.ts`; `IMAGE_ID_REGEX` is module-private and must not be added to it, since the only consumer is the file that declares it.

## Rust backend

### `app/src-tauri/src/commands/images/mod.rs`

Add below the existing `VALID_EXTENSIONS` constant:

```rust
/// Image ids come from nanoid over the URL-safe alphabet. Restricting to that character class keeps a peer- or webview-supplied id from carrying a path separator, a `..` sequence, or a NUL into the joined file path — `PathBuf::join` does not resolve any of them, the OS does, at open time.
pub(crate) fn is_valid_image_id(id: &str) -> bool {
    !id.is_empty()
        && id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}
```

The body is written pre-wrapped because that is the shape `rustfmt` produces: the single-line form exceeds rustfmt's chain-width heuristic even though it fits inside `max_width`, and `cargo fmt --check` is a required gate here [spec-writer_18: ran `rustfmt --edition 2024 --emit stdout` against the single-line form — observed it reflowed to exactly the four-line shape above].

No length constraint, per the Key Architectural Decision "Image id validation is a character-class check with no length constraint". No `regex` crate is added: `app/src-tauri/Cargo.toml` declares no `regex` dependency, and a character-class scan needs none.

### The six command files

Each of the six commands gains the same guard, as the first statement in the function body:

```rust
    if !is_valid_image_id(&id) {
        return Err(format!("Invalid image id: {id}"));
    }
```

The inline-capture form `{id}` is used rather than `format!("...: {}", id)`, because that is the form `clippy::uninlined_format_args` prefers and `cargo clippy -- -D warnings` is a required gate whenever `src-tauri/` is touched. Placement is first in the body in every one of the six, ahead of the `VALID_EXTENSIONS` check where one exists, so id validation and extension validation appear in a consistent order across the whole directory.

Import changes, one per file:

- `read_image_bytes.rs`, `save_image_bytes.rs`, `save_image.rs`, `image_file_exists.rs` — change the existing `use super::VALID_EXTENSIONS;` to `use super::{VALID_EXTENSIONS, is_valid_image_id};`
- `delete_image.rs`, `get_image_url.rs` — neither file currently has a `use super::` line; add `use super::{VALID_EXTENSIONS, is_valid_image_id};` below the existing `use` statements

`delete_image.rs` and `get_image_url.rs` additionally gain the extension check the other four already carry, placed directly after the id guard:

```rust
    if !VALID_EXTENSIONS.contains(&extension.as_str()) {
        return Err(format!("Invalid file extension: {extension}"));
    }
```

Neither command is reachable from a peer message today — both are reachable from the webview — so this is consistency rather than a closed exploit chain. It matters because the extension is what bounds the constructed path to an image suffix, and a command missing that bound is a latent second traversal sink if a future message type ever routes to it.

`save_image.rs` additionally gains a comment on the line above `let source = PathBuf::from(&source_path);`:

```rust
    // source_path is deliberately unvalidated: no peer message routes to this command, and a compromised webview — the only caller — already holds sql:allow-execute and sql:allow-select, so constraining the path grants nothing it cannot already do. A real constraint needs a capability token tying the path to a dialog the user actually opened.
```

Single unwrapped line, and it names the capabilities rather than any document, so it stays resolvable once this spec is deleted.

### Rust checks

`cargo clippy -- -D warnings` and `cargo fmt --check`, both run from `app/src-tauri/`, are required for this sub-feature because `src-tauri/` is touched.

## Domain

### `app/domain/sync/messages.ts`

Add above `export const SYNC_PROTOCOL_VERSION = 1;`:

```ts
// Mirrors is_valid_image_id in src-tauri/src/commands/images/mod.rs. That Rust check is the trust boundary; this one rejects a malformed id at the message edge so it never reaches an invoke call. The duplication cannot be factored out across the runtime boundary — the same split already exists for ENDPOINT_ID_HEX_REGEX and decode_hex_key.
const IMAGE_ID_REGEX = /^[A-Za-z0-9_-]+$/;
```

The constant stays module-private. `ENDPOINT_ID_HEX_REGEX` is exported from `app/domain/devices/identity.ts` because three files under `app/db/` consume it; `IMAGE_ID_REGEX` has exactly one consumer, in the file that declares it, so exporting it would create an export with no importer.

Change the `file-request` payload from

```ts
payload: z.object({ imageId: z.string(), extension: z.string() }),
```

to

```ts
payload: z.object({
  imageId: z.string().regex(IMAGE_ID_REGEX),
  extension: z.string(),
}),
```

and the `imageId` line inside the `file-chunk` payload from `imageId: z.string(),` to `imageId: z.string().regex(IMAGE_ID_REGEX),`.

`extension` is left as `z.string()` on both: it is already allowlisted against `VALID_EXTENSIONS` in Rust on every command after this sub-feature, and duplicating that five-member list into the Zod schema would create a second copy that drifts the moment a format is added.

`buildFileRequestMessage` and `buildFileChunkMessage` need no change — they construct messages from locally-generated ids and are not parsed through the schema on the send path.

## Tests

### `app/domain/sync/__tests__/messages.test.ts`

The file's existing tests assert against `syncMessageSchema.safeParse(...)` and check `result.success`. Follow that shape.

Add, inside the existing `syncMessageSchema` describe block:

- `rejects a file-request whose imageId contains a path traversal` — `safeParse` the object `{ v: 1, type: 'file-request', payload: { imageId: '../../../../etc/passwd', extension: 'png' } }` and assert `result.success` is `false`.
- `rejects a file-chunk whose imageId contains a path traversal` — `safeParse` the object `{ v: 1, type: 'file-chunk', payload: { imageId: '../../secrets', extension: 'png', seqNo: 0, dataBase64: '', last: true } }` and assert `result.success` is `false`.

Two tests rather than one, because the two payloads declare `imageId` independently and a regression on either one would be invisible to a test covering only the other.

The Rust guard gets no automated test: `app/src-tauri/CLAUDE.md`'s Testing section reads `TODO: Add testing patterns when implemented`, and the Rust gate for this repository is `cargo clippy` plus `cargo fmt --check` only.
