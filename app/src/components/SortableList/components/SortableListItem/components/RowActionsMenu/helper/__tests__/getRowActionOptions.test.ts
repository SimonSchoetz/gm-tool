import { describe, expect, it } from 'vitest';
import { PinIcon, PinOffIcon } from 'lucide-react';
import { getRowActionOptions } from '../getRowActionOptions';

describe('getRowActionOptions', () => {
  it('offers Unpin for a pinned row', () => {
    expect(getRowActionOptions(true)).toEqual([
      { key: 'unpin', Icon: PinOffIcon, label: 'Unpin' },
    ]);
  });

  it('offers Pin for an unpinned row', () => {
    expect(getRowActionOptions(false)).toEqual([
      { key: 'pin', Icon: PinIcon, label: 'Pin' },
    ]);
  });
});
