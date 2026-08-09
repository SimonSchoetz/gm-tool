import type { QueryClient } from '@tanstack/react-query';
import { npcQueryOptions } from '../npcs';
import { foeQueryOptions } from '../foes';
import { pcQueryOptions } from '../pcs';
import { factionQueryOptions } from '../factions';
import { locationQueryOptions } from '../locations';
import { itemQueryOptions } from '../items';
import { sessionQueryOptions } from '../sessions';
import { encounterQueryOptions } from '../encounters';
import { ensureImagePainted } from '../images';

type MentionPrefetch = (
  queryClient: QueryClient,
  entityId: string,
) => Promise<void>;

export const mentionPrefetchByType: Record<
  string,
  MentionPrefetch | undefined
> = {
  npcs: async (queryClient, entityId) => {
    const npc = await queryClient.ensureQueryData(npcQueryOptions(entityId));
    await ensureImagePainted(queryClient, npc.image_id ?? null);
  },
  foes: async (queryClient, entityId) => {
    const foe = await queryClient.ensureQueryData(foeQueryOptions(entityId));
    await ensureImagePainted(queryClient, foe.image_id ?? null);
  },
  pcs: async (queryClient, entityId) => {
    const pc = await queryClient.ensureQueryData(pcQueryOptions(entityId));
    await ensureImagePainted(queryClient, pc.image_id ?? null);
  },
  factions: async (queryClient, entityId) => {
    const faction = await queryClient.ensureQueryData(
      factionQueryOptions(entityId),
    );
    await ensureImagePainted(queryClient, faction.image_id ?? null);
  },
  locations: async (queryClient, entityId) => {
    const location = await queryClient.ensureQueryData(
      locationQueryOptions(entityId),
    );
    await ensureImagePainted(queryClient, location.image_id ?? null);
  },
  items: async (queryClient, entityId) => {
    const item = await queryClient.ensureQueryData(itemQueryOptions(entityId));
    await ensureImagePainted(queryClient, item.image_id ?? null);
  },
  sessions: async (queryClient, entityId) => {
    await queryClient.ensureQueryData(sessionQueryOptions(entityId));
  },
  encounters: async (queryClient, entityId) => {
    await queryClient.ensureQueryData(encounterQueryOptions(entityId));
  },
};
