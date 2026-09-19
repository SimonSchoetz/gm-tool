import { describe, it, expect } from 'vitest';
import { generateId } from '../generate-id';

describe('generateId', () => {
  // generateId names image files, and the Rust image commands (is_valid_image_id in app/src-tauri/src/commands/images/mod.rs) and IMAGE_ID_REGEX in app/domain/sync/messages.ts accept only [A-Za-z0-9_-] ids, so a generator producing any other character would make every image save fail.
  it('generates only characters the image commands accept in an id', () => {
    const ids = Array.from({ length: 100 }, () => generateId());

    for (const id of ids) {
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });
});
