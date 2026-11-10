import { LabeledToggleButton } from '@/components/LabeledToggleButton';
import { useSession } from '@/data-access-layer';
import type { Session } from '@db/session';
import { useParams } from '@tanstack/react-router';

type SessionView = Session['active_view'];

const VIEW_OPTIONS: [
  { value: SessionView; label: string },
  { value: SessionView; label: string },
] = [
  { value: 'prep', label: 'Prep' },
  { value: 'ingame', label: 'In Game' },
];

export const ToggleSessionViewBtn = () => {
  const { sessionId, adventureId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { session, updateSession } = useSession(sessionId, adventureId);

  if (!session) return;

  const onViewChange = (newView: SessionView) => {
    updateSession({ active_view: newView });
  };

  return (
    <LabeledToggleButton
      options={VIEW_OPTIONS}
      value={session.active_view}
      onChange={onViewChange}
    />
  );
};
