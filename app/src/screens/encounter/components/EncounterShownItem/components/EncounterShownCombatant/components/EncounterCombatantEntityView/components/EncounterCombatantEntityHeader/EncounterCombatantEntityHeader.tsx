import { EntitySectionHeaderLeading } from '@/components/EntitySectionHeaderLeading/EntitySectionHeaderLeading';
import { PanelMenuBar } from '@/components/PanelMenuBar/PanelMenuBar';
import { FCProps } from '@/types/fcProps.type';

type Props = React.ComponentProps<typeof EntitySectionHeaderLeading>;

export const EncounterCombatantEntityHeader: FCProps<Props> = (
  leadingProps,
) => {
  if (leadingProps.sectionName === undefined) return;

  return (
    <PanelMenuBar
      leading={<EntitySectionHeaderLeading {...leadingProps} />}
      title={null}
    />
  );
};
