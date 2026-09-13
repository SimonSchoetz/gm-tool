import type { QueryClient } from '@tanstack/react-query';
import type { MentionEntityType } from '@domain/mentions';
import type { BaseEntityType } from '@domain/entities';
import { sessionQueryOptions } from '../sessions';
import { encounterQueryOptions } from '../encounters';
import { ensureImagePainted } from '../images';
import { baseEntityQueryOptions } from '../base-entities';

type MentionPrefetch = (
  queryClient: QueryClient,
  entityId: string,
) => Promise<void>;

const prefetchBaseEntity =
  (entityType: BaseEntityType): MentionPrefetch =>
  async (queryClient, entityId) => {
    const baseEntity = await queryClient.ensureQueryData(
      baseEntityQueryOptions(entityType, entityId),
    );
    await ensureImagePainted(queryClient, baseEntity.image_id);
  };

// keyed against MentionEntityType (domain/mentions/mentionEntityType.ts) so a mentionable entity added there and not here fails to compile
const mentionPrefetchMap: Record<MentionEntityType, MentionPrefetch> = {
  npcs: prefetchBaseEntity('npcs'),
  foes: prefetchBaseEntity('foes'),
  pcs: prefetchBaseEntity('pcs'),
  factions: prefetchBaseEntity('factions'),
  locations: prefetchBaseEntity('locations'),
  items: prefetchBaseEntity('items'),
  sessions: async (queryClient, entityId) => {
    await queryClient.ensureQueryData(sessionQueryOptions(entityId));
  },
  encounters: async (queryClient, entityId) => {
    await queryClient.ensureQueryData(encounterQueryOptions(entityId));
  },
};

export const mentionPrefetchByType: Record<
  string,
  MentionPrefetch | undefined
> = mentionPrefetchMap;
