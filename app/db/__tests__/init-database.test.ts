import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initDatabase } from '../database';

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

describe('initDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should create the _migrations tracking table', async () => {
    await initDatabase();
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS _migrations'),
    );
  });

  it('should query applied migrations on init', async () => {
    await initDatabase();
    expect(mockSelect).toHaveBeenCalledWith('SELECT id FROM _migrations');
  });
});
