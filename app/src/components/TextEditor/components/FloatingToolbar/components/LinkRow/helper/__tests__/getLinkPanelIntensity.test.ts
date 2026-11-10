import { describe, expect, it } from 'vitest';
import { getLinkPanelIntensity } from '../getLinkPanelIntensity';

describe('getLinkPanelIntensity', () => {
  it('brightens the panel while the link input is enabled', () => {
    expect(getLinkPanelIntensity(true)).toBe('bright');
  });

  it('dims the panel while the link input is disabled', () => {
    expect(getLinkPanelIntensity(false)).toBe('dim');
  });
});
