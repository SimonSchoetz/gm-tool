import { useParams } from '@tanstack/react-router';
import { Button } from '@/components/Button/Button';
import { useEncounterLogEntries } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import type { GroupActionPlan } from '../../helper/planGroupAction';

type Props = {
  label: string;
  plan: GroupActionPlan | null;
  onRun: (plan: GroupActionPlan) => void;
} & Pick<React.ComponentProps<typeof Button>, 'buttonStyle'>;

export const EncounterCombatantActionButton: FCProps<Props> = ({
  label,
  plan,
  onRun,
  ...buttonProps
}) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { isWriting } = useEncounterLogEntries(encounterId);

  const onClick = () => {
    // The button is disabled while its plan is null, so a click never reaches this guard.
    if (plan === null) return;
    onRun(plan);
  };

  return (
    <Button
      {...buttonProps}
      label={label}
      onClick={onClick}
      disabled={isWriting || plan === null}
    />
  );
};
