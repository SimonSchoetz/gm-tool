import {
  CastleIcon,
  FlagIcon,
  GemIcon,
  SwordsIcon,
  UserSquareIcon,
  type LucideIcon,
} from 'lucide-react';
import type { BaseEntityType } from '@domain';

export type ImagePlaceholderEntityType = BaseEntityType | 'encounters';

// `person` is the silhouette of a combatant that has no entity, so it has no domain of its own.
export const ENTITY_PLACEHOLDER_ICONS = {
  encounters: SwordsIcon,
  items: GemIcon,
  locations: CastleIcon,
  factions: FlagIcon,
  npcs: UserSquareIcon,
  pcs: UserSquareIcon,
  foes: UserSquareIcon,
  person: UserSquareIcon,
} satisfies Record<ImagePlaceholderEntityType | 'person', LucideIcon>;
