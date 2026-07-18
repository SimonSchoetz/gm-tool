import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({
        execute: mockExecute,
        select: mockSelect,
      }),
    ),
  },
}));

import {
  getPeerWatermark,
  setPeerWatermark,
  removePeerState,
} from '../peer-state';

const PEER_ID =
  'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';

describe('peer-state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return 0 when no watermark is stored', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await getPeerWatermark(PEER_ID);

    expect(result).toBe(0);
  });

  it('should return the stored watermark', async () => {
    mockSelect.mockResolvedValue([{ last_received_seq: 17 }]);

    const result = await getPeerWatermark(PEER_ID);

    expect(result).toBe(17);
  });

  it('should reject a malformed peer id', async () => {
    await expect(getPeerWatermark('not-a-valid-id')).rejects.toThrow(
      'Valid peer ID is required',
    );
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('should upsert the watermark on conflict', async () => {
    await setPeerWatermark(PEER_ID, 25);

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT(id) DO UPDATE'),
      [PEER_ID, 25],
    );
  });

  it('should delete the peer state row', async () => {
    await removePeerState(PEER_ID);

    expect(mockExecute).toHaveBeenCalledWith(
      'DELETE FROM _sync_peers WHERE id = $1',
      [PEER_ID],
    );
  });
});
