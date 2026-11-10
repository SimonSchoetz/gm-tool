import { describe, expect, it } from 'vitest';
import { getPairDialogMode } from '../getPairDialogMode';

describe('getPairDialogMode', () => {
  it('shows the code when a code was requested, with or without a chosen candidate', () => {
    expect(getPairDialogMode({}, null)).toBe('showing-code');
    expect(getPairDialogMode({}, 'device-1')).toBe('showing-code');
  });

  it('asks for the code when a candidate was chosen', () => {
    expect(getPairDialogMode(null, 'device-1')).toBe('entering-code');
  });

  it('lists the candidates otherwise', () => {
    expect(getPairDialogMode(null, null)).toBe('list');
  });
});
