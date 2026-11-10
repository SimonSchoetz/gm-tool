import { describe, expect, it } from 'vitest';
import { resolveMentionName } from '../resolveMentionName';

describe('resolveMentionName', () => {
  it('shows the live name once it has loaded', () => {
    expect(resolveMentionName(false, 'Live', 'Stored')).toBe('Live');
  });

  it('shows the stored name while loading', () => {
    expect(resolveMentionName(true, 'Live', 'Stored')).toBe('Stored');
  });

  it('shows the stored name when the entity has no live name', () => {
    expect(resolveMentionName(false, null, 'Stored')).toBe('Stored');
  });
});
