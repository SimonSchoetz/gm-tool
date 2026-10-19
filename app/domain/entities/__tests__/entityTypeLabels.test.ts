import { describe, it, expect } from 'vitest';
import { ENTITY_TYPES } from '../entityTypes';
import { entityTypeLabel } from '../entityTypeLabels';

describe('entityTypeLabel', () => {
  it.each(ENTITY_TYPES)(
    "looks up a label for the known entity type %s instead of falling back to 'Entity'",
    (entityType) => {
      expect(entityTypeLabel(entityType)).not.toBe('Entity');
    },
  );

  it("returns 'Entity' for an unrecognized entity type", () => {
    expect(entityTypeLabel('stories')).toBe('Entity');
  });
});
