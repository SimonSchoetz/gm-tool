import { describe, expect, it } from 'vitest';
import { QUEUE_ENTRY_IMAGE_SIZE } from '../../../../EncounterQueueEntry.constants';
import { QUEUE_ENTRY_IMAGE_RADIUS } from '../../EncounterQueueEntryTempFrame.constants';
import { buildTempFramePaths } from '../buildTempFramePaths';

const INSET = 4;

const centre = QUEUE_ENTRY_IMAGE_SIZE / 2;
const near = INSET;
const far = QUEUE_ENTRY_IMAGE_SIZE - INSET;
const arc = QUEUE_ENTRY_IMAGE_RADIUS - INSET;
const cornerNear = QUEUE_ENTRY_IMAGE_RADIUS;
const cornerFar = QUEUE_ENTRY_IMAGE_SIZE - QUEUE_ENTRY_IMAGE_RADIUS;

describe('buildTempFramePaths', () => {
  it('draws the left half from the bottom centre up the left side to the top centre', () => {
    expect(buildTempFramePaths(INSET).left).toBe(
      [
        `M ${centre} ${far}`,
        `L ${cornerNear} ${far}`,
        `A ${arc} ${arc} 0 0 1 ${near} ${cornerFar}`,
        `L ${near} ${cornerNear}`,
        `A ${arc} ${arc} 0 0 1 ${cornerNear} ${near}`,
        `L ${centre} ${near}`,
      ].join(' '),
    );
  });

  it('draws the right half as the mirror image of the left one', () => {
    expect(buildTempFramePaths(INSET).right).toBe(
      [
        `M ${centre} ${far}`,
        `L ${cornerFar} ${far}`,
        `A ${arc} ${arc} 0 0 0 ${far} ${cornerFar}`,
        `L ${far} ${cornerNear}`,
        `A ${arc} ${arc} 0 0 0 ${cornerFar} ${near}`,
        `L ${centre} ${near}`,
      ].join(' '),
    );
  });
});
