import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({ execute: mockExecute, select: mockSelect }),
    ),
  },
}));

import { remove } from '../remove';

describe('remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('deletes the section by id', async () => {
    await remove('section-id');

    expect(mockExecute).toHaveBeenCalledWith(
      'DELETE FROM base_entity_content_sections WHERE id = $1',
      ['section-id'],
    );
  });

  it('throws when id is empty', async () => {
    await expect(remove('')).rejects.toThrow(
      'Valid Base entity content section ID is required',
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
