export const LAZY_DM_STEP_KEYS = [
  'review_characters',
  'strong_start',
  'potential_scenes',
  'secrets_clues',
  'fantastic_locations',
  'important_npcs',
  'relevant_monsters',
  'magic_items',
] as const;

export type LazyDmStepKey = (typeof LAZY_DM_STEP_KEYS)[number];
