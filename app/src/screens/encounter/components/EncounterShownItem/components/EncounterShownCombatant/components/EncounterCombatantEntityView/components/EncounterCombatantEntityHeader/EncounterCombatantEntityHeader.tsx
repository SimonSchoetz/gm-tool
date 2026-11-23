import { ExternalLinkIcon } from 'lucide-react';
import { ClickableIcon } from '@/components/ClickableIcon/ClickableIcon';
import { EntitySectionHeaderLeading } from '@/components/EntitySectionHeaderLeading/EntitySectionHeaderLeading';
import { PanelMenuBar } from '@/components/PanelMenuBar/PanelMenuBar';
import { FCProps } from '@/types/fcProps.type';
import { useEncounterCombatantEntityNavigation } from '../../hooks/useEncounterCombatantEntityNavigation';

type Props = React.ComponentProps<typeof EntitySectionHeaderLeading>;

// The header shows for every entity, so even one with a single section offers the jump to its screen; the section name and menu show only when the entity has two or more sections.
export const EncounterCombatantEntityHeader: FCProps<Props> = (
  leadingProps,
) => {
  const onNavigate = useEncounterCombatantEntityNavigation();
  const leading =
    leadingProps.sectionName === undefined ? null : (
      <EntitySectionHeaderLeading {...leadingProps} />
    );

  return (
    <PanelMenuBar leading={leading} title={null}>
      <ClickableIcon
        icon={<ExternalLinkIcon />}
        onClick={onNavigate}
        label='Navigate to entity'
        title='Navigate'
      />
    </PanelMenuBar>
  );
};
