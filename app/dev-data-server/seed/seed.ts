// Node host — evaluated by the seed's own Vite server (seedDatabase.ts), never by Vite's config bundle: the services it calls import through the project's path aliases, which only a Vite server resolves. Every row is created through the app's own services, so a schema or service change breaks the seed at type-check time. The names and values below are the seeded dataset that app/docs/features/web-dev-mode.md lists for specs to refer to.
import type Database from '@tauri-apps/plugin-sql';
import {
  patchBasicStatBlockContent,
  patchFiveEStatBlockContent,
  type BaseEntityType,
} from '../../domain';
import * as adventureService from '../../services/adventureService';
import * as baseEntityContentSectionService from '../../services/baseEntityContentSectionService';
import * as baseEntityService from '../../services/baseEntityService';
import * as encounterQueueService from '../../services/encounterQueueService';
import * as encounterService from '../../services/encounterService';
import { provideSeedDatabase } from './seedPlatform';

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

// Expects the database `provideSeedDatabase` is handed to be freshly migrated and empty.
export const runSeed = async (db: Database): Promise<void> => {
  provideSeedDatabase(db);

  const adventureId = await adventureService.createAdventure();
  await adventureService.updateAdventure(adventureId, {
    name: 'Seed Adventure',
  });

  await createNamedBaseEntity('npcs', adventureId, 'Seed NPC');
  await createNamedBaseEntity('npcs', adventureId, null);
  await createNamedBaseEntity('pcs', adventureId, 'Seed PC');
  await createNamedBaseEntity('factions', adventureId, 'Seed Faction');
  await createNamedBaseEntity('locations', adventureId, 'Seed Location');
  await createNamedBaseEntity('items', adventureId, 'Seed Item');

  const singleStatBlockFoeId = await createNamedBaseEntity(
    'foes',
    adventureId,
    'Single Stat Block Foe',
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

  const encounterId = await encounterService.createEncounter(adventureId);
  await encounterService.updateEncounter(encounterId, {
    name: 'Seed Encounter',
  });
  await encounterQueueService.addEntityCombatants(
    encounterId,
    'foes',
    singleStatBlockFoeId,
    2,
  );
  await encounterQueueService.addEntityCombatants(
    encounterId,
    'foes',
    twoStatBlockFoeId,
    1,
  );
  await encounterQueueService.addEvent(encounterId, 'Seed Event');
  await encounterQueueService.addEntityCombatants(
    encounterId,
    'foes',
    noStatBlockFoeId,
    1,
  );
  await encounterQueueService.addRandomCombatants(
    encounterId,
    'Seed Bandit',
    9,
    1,
  );
};
