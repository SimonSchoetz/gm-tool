import { describe, expect, it } from 'vitest';
import { buildHpLostStyle } from '../buildHpLostStyle';

describe('buildHpLostStyle', () => {
  it('sets the lost HP share when the entry has HP', () => {
    expect(
      buildHpLostStyle({ text: '4/10', state: 'hurt', lostShare: 0.6 }),
    ).toEqual({ '--rt-encounter-queue-entry-hp-lost': 0.6 });
  });

  it('sets nothing when the entry has no HP', () => {
    expect(buildHpLostStyle(null)).toEqual({});
  });
});
