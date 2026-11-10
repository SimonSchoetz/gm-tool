import { describe, expect, it } from 'vitest';
import { getTableColor } from '../getTableColor';

const tableConfigs = [
  { table_name: 'sessions', color: '10 20 30' },
  { table_name: 'encounters', color: '40 50 60' },
];

describe('getTableColor', () => {
  it('returns the color of the config for the named table', () => {
    expect(getTableColor(tableConfigs, 'encounters')).toBe('40 50 60');
  });

  it('returns an empty string for a table with no config', () => {
    expect(getTableColor(tableConfigs, 'pcs')).toBe('');
  });
});
