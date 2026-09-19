import type { QueryClient } from '@tanstack/react-query';
import type { MentionEntityType } from '@domain/mentions';
import type { BaseEntityType } from '@domain/entities';
import { sessionQueryOptions } from '../sessions';
import { encounterQueryOptions } from '../encounters';
import { ensureImagePainted } from '../images';
import { baseEntityQueryOptions } from '../base-entities';
import { baseEntityContentSectionListQueryOptions } from '../base-entity-content-sections';

type MentionPrefetch = (
  queryClient: QueryClient,
  entityId: string,
) => Promise<void>;

const prefetchBaseEntity =
  (entityType: BaseEntityType): MentionPrefetch =>
  async (queryClient, entityId) => {
    const baseEntity = await queryClient.query({
      ...baseEntityQueryOptions(entityType, entityId),
      staleTime: 'static',
    });
    await queryClient.query({
      ...baseEntityContentSectionListQueryOptions(entityId),
      staleTime: 'static',
    });
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
    await queryClient.query({
      ...sessionQueryOptions(entityId),
      staleTime: 'static',
    });
  },
  encounters: async (queryClient, entityId) => {
    await queryClient.query({
      ...encounterQueryOptions(entityId),
      staleTime: 'static',
    });
  },
};

export const mentionPrefetchByType: Record<
  string,
  MentionPrefetch | undefined
> = mentionPrefetchMap;
