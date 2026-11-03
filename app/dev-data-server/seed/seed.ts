// Node host — evaluated by the seed's own Vite server (seedDatabase.ts), never by Vite's config bundle: the services it calls import through the project's path aliases, which only a Vite server resolves. Every row is created through the app's own services, so a schema or service change breaks the seed at type-check time. The names and values below are the seeded dataset that app/docs/features/web-dev-mode.md lists for specs to refer to.
import { basename } from 'node:path';
import {
  patchBasicStatBlockContent,
  patchFiveEStatBlockContent,
  type BaseEntityType,
} from '@domain';
import * as adventureService from '@services/adventureService';
import * as baseEntityContentSectionService from '@services/baseEntityContentSectionService';
import * as baseEntityService from '@services/baseEntityService';
import * as encounterQueueService from '@services/encounterQueueService';
import * as encounterService from '@services/encounterService';
import type { CommandContext } from '../commands';
import { provideSeedContext } from './seedPlatform';

// One fixture image per shape, so the seeded covers show each aspect ratio the framing dialog handles.
const LANDSCAPE_FIXTURE = 'landscape.png';
const PORTRAIT_FIXTURE = 'portrait.jpg';
const SQUARE_FIXTURE = 'square.webp';

// A name with no space or hyphen, so no browser can break it: the fit checks of a narrow column read it.
const UNBROKEN_NAME_FOE_NAME =
  'UnbrokenNameFoeUnbrokenNameFoeUnbrokenNameFoeUnbrokenNameFoe';

const createNamedBaseEntity = async (
  entityType: BaseEntityType,
  adventureId: string,
  name: string | null,
): Promise<string> => {
  const id = await baseEntityService.createBaseEntity(entityType, adventureId);
  await baseEntityService.updateBaseEntity(entityType, id, { name });
  return id;
};

const addBasicStatBlock = async (
  baseEntityId: string,
  hp: number,
): Promise<void> => {
  const sectionId = await baseEntityContentSectionService.createSection(
    baseEntityId,
    'basic-stat-block',
  );
  await baseEntityContentSectionService.updateSection(sectionId, {
    content: patchBasicStatBlockContent(null, { hp }),
  });
};

const addFiveEStatBlock = async (
  baseEntityId: string,
  hp: number,
): Promise<void> => {
  const sectionId = await baseEntityContentSectionService.createSection(
    baseEntityId,
    '5e-stat-block',
  );
  await baseEntityContentSectionService.updateSection(sectionId, {
    content: patchFiveEStatBlockContent(null, 'hp', hp),
  });
};

const fixturePathNamed = (
  fixturePaths: readonly string[],
  name: string,
): string => {
  const path =
    fixturePaths.find((candidate) => basename(candidate) === name) ?? null;
  if (path === null) {
    throw new Error(`The seed found no fixture image named ${name}.`);
  }
  return path;
};

const createNamedBaseEntityWithImage = async (
  entityType: BaseEntityType,
  adventureId: string,
  name: string,
  imgFilePath: string,
): Promise<string> => {
  const id = await createNamedBaseEntity(entityType, adventureId, name);
  await baseEntityService.updateBaseEntity(entityType, id, { imgFilePath });
  return id;
};

// Expects the context's database to be freshly migrated and empty; the images go through the context's command table into its images folder. The fixtures are looked up before any row is written, so a missing one leaves the database untouched.
export const runSeed = async (context: CommandContext): Promise<void> => {
  const landscape = fixturePathNamed(context.fixturePaths, LANDSCAPE_FIXTURE);
  const portrait = fixturePathNamed(context.fixturePaths, PORTRAIT_FIXTURE);
  const square = fixturePathNamed(context.fixturePaths, SQUARE_FIXTURE);
  provideSeedContext(context);

  const adventureId = await adventureService.createAdventure();
  await adventureService.updateAdventure(adventureId, {
    name: 'Seed Adventure',
    imgFilePath: landscape,
  });
  const imagelessAdventureId = await adventureService.createAdventure();
  await adventureService.updateAdventure(imagelessAdventureId, {
    name: 'Imageless Adventure',
  });

  await createNamedBaseEntityWithImage(
    'npcs',
    adventureId,
    'Seed NPC',
    portrait,
  );
  await createNamedBaseEntity('npcs', adventureId, null);
  await createNamedBaseEntityWithImage('pcs', adventureId, 'Seed PC', portrait);
  await createNamedBaseEntity('pcs', adventureId, 'Imageless PC');
  await createNamedBaseEntityWithImage(
    'factions',
    adventureId,
    'Seed Faction',
    square,
  );
  await createNamedBaseEntity('factions', adventureId, 'Imageless Faction');
  await createNamedBaseEntityWithImage(
    'locations',
    adventureId,
    'Seed Location',
    landscape,
  );
  await createNamedBaseEntity('locations', adventureId, 'Imageless Location');
  await createNamedBaseEntityWithImage(
    'items',
    adventureId,
    'Seed Item',
    square,
  );
  await createNamedBaseEntity('items', adventureId, 'Imageless Item');

  const singleStatBlockFoeId = await createNamedBaseEntityWithImage(
    'foes',
    adventureId,
    'Single Stat Block Foe',
    square,
  );
  await addFiveEStatBlock(singleStatBlockFoeId, 7);

  const twoStatBlockFoeId = await createNamedBaseEntity(
    'foes',
    adventureId,
    'Two Stat Block Foe',
  );
  await addBasicStatBlock(twoStatBlockFoeId, 12);
  await addFiveEStatBlock(twoStatBlockFoeId, 30);

  const noStatBlockFoeId = await createNamedBaseEntity(
    'foes',
    adventureId,
    'No Stat Block Foe',
  );
  await baseEntityContentSectionService.createSection(noStatBlockFoeId, 'text');

  await createNamedBaseEntity('foes', adventureId, UNBROKEN_NAME_FOE_NAME);

  const encounterId = await encounterService.createEncounter(adventureId);
  await encounterService.updateEncounter(encounterId, {
    name: 'Seed Encounter',
    imgFilePath: landscape,
  });
  const imagelessEncounterId =
    await encounterService.createEncounter(adventureId);
  await encounterService.updateEncounter(imagelessEncounterId, {
    name: 'Imageless Encounter',
  });
  await encounterQueueService.addEntityCombatants(
    encounterId,
    'foes',
    singleStatBlockFoeId,
  );
  await encounterQueueService.addEntityCombatants(
    encounterId,
    'foes',
    singleStatBlockFoeId,
  );
  await encounterQueueService.addEntityCombatants(
    encounterId,
    'foes',
    twoStatBlockFoeId,
  );
  await encounterQueueService.addEvent(encounterId, 'Seed Event');
  await encounterQueueService.addEntityCombatants(
    encounterId,
    'foes',
    noStatBlockFoeId,
  );
  await encounterQueueService.addRandomCombatants(
    encounterId,
    'Seed Bandit',
    9,
  );
};
