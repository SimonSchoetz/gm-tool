import { parseBasicStatBlockContent } from './basicStatBlockContent';
import type { BaseEntityContentSectionType } from './contentSectionTypes';
import { readFiveEStatBlockContent } from './fiveEStatBlockContent';

const STAT_BLOCK_TYPES: BaseEntityContentSectionType[] = [
  'basic-stat-block',
  '5e-stat-block',
];

type HpSection = {
  type: BaseEntityContentSectionType;
  content: string | null;
};

export type HpNotSetReason = 'no-hp-value' | 'several-stat-blocks' | 'other';

const statBlocksOf = (sections: HpSection[]): HpSection[] =>
  sections.filter((section) => STAT_BLOCK_TYPES.includes(section.type));

// Corrupt Basic stat block content makes parseBasicStatBlockContent throw; the throw is left unguarded and reaches the Error Boundary, as opening that section on the entity screen does.
export const singleStatBlockHp = (sections: HpSection[]): number | null => {
  const statBlocks = statBlocksOf(sections);
  if (statBlocks.length !== 1) return null;
  const [{ type, content }] = statBlocks;
  return type === 'basic-stat-block'
    ? parseBasicStatBlockContent(content).basicStatBlock.hp
    : readFiveEStatBlockContent(content).fiveEStatBlock.hp;
};

// A combatant whose HP is not set got its starting max HP from singleStatBlockHp when it was added. This reads the entity's sections now, so a stat block changed after the add gives 'other'.
export const hpNotSetReason = (sections: HpSection[]): HpNotSetReason => {
  if (statBlocksOf(sections).length >= 2) return 'several-stat-blocks';
  return singleStatBlockHp(sections) === null ? 'no-hp-value' : 'other';
};
