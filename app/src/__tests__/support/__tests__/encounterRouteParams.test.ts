import { describe, it, expect } from 'vitest';
import {
  ROUTE_ADVENTURE_ID,
  ROUTE_ENCOUNTER_ID,
  encounterRouteParams,
} from '../encounterRouteParams';

describe('encounterRouteParams', () => {
  it('answers the adventure and encounter ids for the encounter route', () => {
    expect(
      encounterRouteParams({
        from: '/adventure/$adventureId/encounter/$encounterId',
      }),
    ).toEqual({
      adventureId: ROUTE_ADVENTURE_ID,
      encounterId: ROUTE_ENCOUNTER_ID,
    });
  });

  it('answers no params for another route', () => {
    expect(
      encounterRouteParams({ from: '/adventure/$adventureId/encounters' }),
    ).toEqual({});
  });
});
