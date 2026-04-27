import { LabeledToggleButton } from '@/components';
import { useSession } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';

export const ToggleSessionViewBtn = () => {
  const { sessionId, adventureId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { session, updateSession } = useSession(sessionId, adventureId);

  if (!session) return null;

  return (
    <LabeledToggleButton
      options={[
        { value: 'prep', label: 'Prep' },
        { value: 'ingame', label: 'In Game' },
      ]}
      value={session.active_view}
      onChange={(newView) => {
        updateSession({ active_view: newView });
      }}
    />
  );
};
