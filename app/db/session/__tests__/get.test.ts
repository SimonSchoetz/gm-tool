import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Session } from '../types';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() => Promise.resolve({
      execute: mockExecute,
      select: mockSelect,
    })),
  },
}));

import { get } from '../get';

describe('get', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return session by id', async () => {
    const mockSession: Session = {
      id: 'test-id-1',
      title: 'Test Session',
      description: 'Test Description',
    };

    mockSelect.mockResolvedValue([mockSession]);

    const session = await get('test-id-1');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM sessions WHERE id = $1',
      ['test-id-1']
    );
    expect(session).toEqual(mockSession);
  });

  it('should return null when session not found', async () => {
    mockSelect.mockResolvedValue([]);

    const session = await get('non-existent-id');

    expect(session).toBeNull();
  });

  it('should throw error when id is invalid', async () => {
    await expect(get('')).rejects.toThrow('Valid session ID is required');
    await expect(get('   ')).rejects.toThrow('Valid session ID is required');
  });
});
