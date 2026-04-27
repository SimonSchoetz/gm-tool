import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SessionStep } from '../types';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({ execute: mockExecute, select: mockSelect }),
    ),
  },
}));

import { getAllBySession } from '../get-all-by-session';

describe('getAllBySession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({});
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return session steps for a given sessionId ordered by sort_order ASC', async () => {
    const step1: SessionStep = {
      id: 'step-1',
      session_id: 'sess-id',
      sort_order: 0,
      checked: 0,
    };
    const step2: SessionStep = {
      id: 'step-2',
      session_id: 'sess-id',
      sort_order: 1,
      checked: 0,
    };

    mockSelect.mockResolvedValue([step1, step2]);

    const result = await getAllBySession('sess-id');

    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT * FROM session_steps WHERE session_id = $1 ORDER BY sort_order ASC',
      ['sess-id'],
    );
    expect(result).toEqual([step1, step2]);
  });

  it('should return empty array when no steps found for the session', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await getAllBySession('sess-id');

    expect(result).toEqual([]);
  });

  it('should throw when sessionId is empty string', async () => {
    await expect(getAllBySession('')).rejects.toThrow(
      'Valid Session ID is required',
    );
  });

  it('should throw when sessionId is whitespace only', async () => {
    await expect(getAllBySession('   ')).rejects.toThrow(
      'Valid Session ID is required',
    );
  });
});
