import { describe, it, expect } from 'vitest';
import { derivePeerStatus } from '../derivePeerStatus';

describe('derivePeerStatus', () => {
  it('returns disconnected when not connected, even if compat is compatible', () => {
    expect(derivePeerStatus(false, 'compatible')).toBe('disconnected');
  });

  it('returns connected when connected and compat is compatible', () => {
    expect(derivePeerStatus(true, 'compatible')).toBe('connected');
  });

  it('returns incompatible when connected and compat is incompatible', () => {
    expect(derivePeerStatus(true, 'incompatible')).toBe('incompatible');
  });

  it('returns disconnected when connected but the handshake is still pending', () => {
    expect(derivePeerStatus(true, null)).toBe('disconnected');
  });
});
