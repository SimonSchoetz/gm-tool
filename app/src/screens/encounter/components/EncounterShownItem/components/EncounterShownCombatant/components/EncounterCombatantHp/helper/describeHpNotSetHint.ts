import {
  hpNotSetReason,
  type BaseEntityContentSectionType,
  type HpNotSetReason,
} from '@domain';

const SET_MAX_HP = 'Set max HP in the Actions tab.';

const PLAIN_HINT = `HP is not set. ${SET_MAX_HP}`;

const HINT_BY_REASON: Record<HpNotSetReason, string> = {
  'no-hp-value': `HP is not set: the entity has no stat block with an HP value. ${SET_MAX_HP}`,
  'several-stat-blocks': `HP is not set: the entity has more than one stat block. ${SET_MAX_HP}`,
  other: PLAIN_HINT,
};

export const describeHpNotSetHint = ({
  entityLinked,
  sectionsLoading,
  sections,
}: {
  entityLinked: boolean;
  sectionsLoading: boolean;
  sections: { type: BaseEntityContentSectionType; content: string | null }[];
}): string | null => {
  if (!entityLinked) return PLAIN_HINT;
  if (sectionsLoading) return null;
  return HINT_BY_REASON[hpNotSetReason(sections)];
};
