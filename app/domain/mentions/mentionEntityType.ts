import type { EntityType } from '../entities';

export type MentionEntityType = Exclude<EntityType, 'adventures'>;
