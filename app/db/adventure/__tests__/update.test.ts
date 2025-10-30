import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({
        execute: mockExecute,
        select: mockSelect,
      })
    ),
  },
}));

import { update } from '../update';

describe('update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should update all provided fields', async () => {
    await update('test-id', {
      title: 'Updated Title',
      description: 'Updated Description',
    });

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE adventures SET title = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      ['Updated Title', 'Updated Description', 'test-id']
    );
  });

  it('should update only title', async () => {
    await update('test-id', {
      title: 'Updated Title',
    });

    expect(mockExecute).toHaveBeenCalledWith(
      'UPDATE adventures SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['Updated Title', 'test-id']
    );
  });

  it('should throw error when id is empty', async () => {
    await expect(update('', { title: 'Test' })).rejects.toThrow(
      'Valid adventure ID is required'
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should throw error when title is empty string', async () => {
    await expect(update('test-id', { title: '' })).rejects.toThrow(
      'Adventure title cannot be empty'
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should throw error when title is only whitespace', async () => {
    await expect(update('test-id', { title: '   ' })).rejects.toThrow(
      'Adventure title cannot be empty'
    );
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
