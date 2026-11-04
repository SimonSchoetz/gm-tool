import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as adventureDb from '@db/adventure';
import type * as baseEntityDb from '@db/base-entity';
import type * as encounterDb from '@db/encounter';
import type * as imageDb from '@db/image';
import type { Adventure } from '@db/adventure';
import { BASE_ENTITY_TYPES } from '@domain';
import { buildBaseEntity } from './support/encounterQueueFixtures';
import { buildEncounter } from './support/encounterFixtures';

const getAdventure = vi.hoisted(() => vi.fn<typeof adventureDb.get>());
const removeAdventure = vi.hoisted(() => vi.fn<typeof adventureDb.remove>());
const updateAdventureRow = vi.hoisted(() => vi.fn<typeof adventureDb.update>());
const getAllBaseEntities = vi.hoisted(() =>
  vi.fn<typeof baseEntityDb.getAll>(),
);
const getAllEncounters = vi.hoisted(() => vi.fn<typeof encounterDb.getAll>());
const removeImage = vi.hoisted(() => vi.fn<typeof imageDb.remove>());
const createImage = vi.hoisted(() => vi.fn<typeof imageDb.create>());
const replaceImage = vi.hoisted(() => vi.fn<typeof imageDb.replace>());

vi.mock('@db/adventure', () => ({
  get: getAdventure,
  remove: removeAdventure,
  update: updateAdventureRow,
}));
vi.mock('@db/base-entity', () => ({ getAll: getAllBaseEntities }));
vi.mock('@db/encounter', () => ({ getAll: getAllEncounters }));
vi.mock('@db/image', () => ({
  remove: removeImage,
  create: createImage,
  replace: replaceImage,
}));

const ADVENTURE_ID = 'adventure-1';

const buildAdventure = (overrides: Partial<Adventure> = {}): Adventure => ({
  id: ADVENTURE_ID,
  name: null,
  description: null,
  image_id: null,
  created_at: '',
  updated_at: '',
  ...overrides,
});

// One base entity per type holds an image of its own, named for its type, in the adventure under test; the other adventure's rows hold images that must survive.
const armSpies = () => {
  removeAdventure.mockReset().mockResolvedValue();
  removeImage.mockReset().mockResolvedValue();
  getAllBaseEntities.mockReset().mockImplementation((entityType, adventureId) =>
    Promise.resolve([
      buildBaseEntity({
        id: `${entityType}-entity`,
        entity_type: entityType,
        image_id:
          adventureId === ADVENTURE_ID
            ? `${entityType}-image`
            : `other-${entityType}-image`,
      }),
    ]),
  );
  getAllEncounters.mockReset().mockImplementation((adventureId) =>
    Promise.resolve([
      buildEncounter({
        id: 'encounter-with-cover',
        image_id:
          adventureId === ADVENTURE_ID ? 'encounter-cover' : 'other-cover',
      }),
      buildEncounter({ id: 'encounter-without-cover', image_id: null }),
    ]),
  );
};

describe('deleteAdventure', () => {
  beforeEach(() => {
    vi.resetModules();
    armSpies();
  });

  it("deletes the images of the adventure's base entities of every type, its encounters' covers and its own cover, then removes the adventure", async () => {
    const { deleteAdventure } = await import('../adventureService');

    getAdventure.mockResolvedValue(
      buildAdventure({ image_id: 'adventure-cover' }),
    );

    await deleteAdventure(ADVENTURE_ID);

    expect(removeImage.mock.calls.map(([imageId]) => imageId).sort()).toEqual(
      [
        ...BASE_ENTITY_TYPES.map((entityType) => `${entityType}-image`),
        'encounter-cover',
        'adventure-cover',
      ].sort(),
    );
    expect(removeAdventure).toHaveBeenCalledWith(ADVENTURE_ID);
    expect(removeAdventure.mock.invocationCallOrder[0]).toBeGreaterThan(
      Math.max(...removeImage.mock.invocationCallOrder),
    );
  });

  it('deletes no image of another adventure and none for a row or an adventure without an image', async () => {
    const { deleteAdventure } = await import('../adventureService');

    getAdventure.mockResolvedValue(buildAdventure());

    await deleteAdventure(ADVENTURE_ID);

    for (const [imageId] of removeImage.mock.calls) {
      expect(imageId).not.toMatch(/^other-/);
    }
    expect(removeImage).toHaveBeenCalledTimes(BASE_ENTITY_TYPES.length + 1);
    expect(getAllEncounters).toHaveBeenCalledWith(ADVENTURE_ID);
    for (const entityType of BASE_ENTITY_TYPES) {
      expect(getAllBaseEntities).toHaveBeenCalledWith(entityType, ADVENTURE_ID);
    }
  });

  it('rejects as AdventureDeleteError, deletes no later image and removes no adventure when an image delete fails', async () => {
    const { deleteAdventure } = await import('../adventureService');
    getAdventure.mockResolvedValue(
      buildAdventure({ image_id: 'adventure-cover' }),
    );
    removeImage.mockRejectedValueOnce(new Error('disk locked'));

    await expect(deleteAdventure(ADVENTURE_ID)).rejects.toMatchObject({
      name: 'AdventureDeleteError',
    });

    expect(removeImage).toHaveBeenCalledTimes(1);
    expect(removeAdventure).not.toHaveBeenCalled();
  });
});

describe('updateAdventure', () => {
  beforeEach(() => {
    vi.resetModules();
    updateAdventureRow.mockReset().mockResolvedValue();
    createImage.mockReset().mockResolvedValue('created-image');
    replaceImage.mockReset().mockResolvedValue('replacement-image');
  });

  it('replaces the existing cover with the chosen file and writes the replacement id without the file path', async () => {
    const { updateAdventure } = await import('../adventureService');

    await updateAdventure(ADVENTURE_ID, {
      imgFilePath: '/pick/map.png',
      image_id: 'adventure-cover',
    });

    expect(replaceImage).toHaveBeenCalledWith('adventure-cover', {
      filePath: '/pick/map.png',
    });
    expect(createImage).not.toHaveBeenCalled();
    expect(updateAdventureRow).toHaveBeenCalledWith(ADVENTURE_ID, {
      image_id: 'replacement-image',
    });
  });

  it('creates a cover from the chosen file when the adventure has none', async () => {
    const { updateAdventure } = await import('../adventureService');

    await updateAdventure(ADVENTURE_ID, {
      imgFilePath: '/pick/map.png',
      image_id: null,
    });

    expect(createImage).toHaveBeenCalledWith({ filePath: '/pick/map.png' });
    expect(replaceImage).not.toHaveBeenCalled();
    expect(updateAdventureRow).toHaveBeenCalledWith(ADVENTURE_ID, {
      image_id: 'created-image',
    });
  });
});
