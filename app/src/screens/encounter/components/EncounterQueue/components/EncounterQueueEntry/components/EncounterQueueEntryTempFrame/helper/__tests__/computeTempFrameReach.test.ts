import { describe, expect, it } from 'vitest';
import { QUEUE_ENTRY_IMAGE_SIZE } from '../../../../EncounterQueueEntry.constants';
import { TEMP_FRAME_EDGE_WIDTH } from '../../EncounterQueueEntryTempFrame.constants';
import { computeTempFrameReach } from '../computeTempFrameReach';

const edgeBand = TEMP_FRAME_EDGE_WIDTH / QUEUE_ENTRY_IMAGE_SIZE;

describe('computeTempFrameReach', () => {
  it("reaches the temp HP share of the image's height", () => {
    expect(computeTempFrameReach(0.25)).toBe(0.25);
    expect(computeTempFrameReach(0.5)).toBe(0.5);
  });

  it('shows the whole bottom edge for the smallest share', () => {
    expect(computeTempFrameReach(0.001)).toBe(edgeBand);
  });

  it('leaves the top open just below a full share', () => {
    expect(computeTempFrameReach(0.999)).toBe(1 - edgeBand);
  });

  it('closes across the top at a full share and above', () => {
    expect(computeTempFrameReach(1)).toBe(1);
    expect(computeTempFrameReach(2)).toBe(1);
  });
});
