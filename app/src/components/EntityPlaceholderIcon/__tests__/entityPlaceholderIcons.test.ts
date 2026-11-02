import { describe, it, expect } from 'vitest';
import {
  CastleIcon,
  FlagIcon,
  GemIcon,
  SwordsIcon,
  UserSquareIcon,
} from 'lucide-react';
import { ENTITY_PLACEHOLDER_ICONS } from '../entityPlaceholderIcons';

describe('ENTITY_PLACEHOLDER_ICONS', () => {
  it.each([
    ['encounters', SwordsIcon],
    ['items', GemIcon],
    ['locations', CastleIcon],
    ['factions', FlagIcon],
  ] as const)(
    'gives %s its own thing icon, not the person silhouette',
    (domain, icon) => {
      expect(ENTITY_PLACEHOLDER_ICONS[domain]).toBe(icon);
    },
  );

  it.each(['npcs', 'pcs', 'foes', 'person'] as const)(
    'keeps the person silhouette for %s',
    (domain) => {
      expect(ENTITY_PLACEHOLDER_ICONS[domain]).toBe(UserSquareIcon);
    },
  );
});
