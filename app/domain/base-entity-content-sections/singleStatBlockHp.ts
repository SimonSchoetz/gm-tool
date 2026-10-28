import { parseBasicStatBlockContent } from './basicStatBlockContent';
import { readFiveEStatBlockContent } from './fiveEStatBlockContent';

const STAT_BLOCK_TYPES = ['basic-stat-block', '5e-stat-block'];

// Corrupt Basic stat block content makes parseBasicStatBlockContent throw; the throw is left unguarded and reaches the Error Boundary, as opening that section on the entity screen does.
export const singleStatBlockHp = (
  sections: { type: string; content: string | null }[],
): number | null => {
  const statBlocks = sections.filter((section) =>
    STAT_BLOCK_TYPES.includes(section.type),
  );
  if (statBlocks.length !== 1) return null;
  const [{ type, content }] = statBlocks;
  return type === 'basic-stat-block'
    ? parseBasicStatBlockContent(content).basicStatBlock.hp
    : readFiveEStatBlockContent(content).fiveEStatBlock.hp;
};
