import { useNavigate, useParams } from '@tanstack/react-router';
import { buildEntityPath } from '@domain';
import { Button } from '@/components';
import { useSession } from '@/data-access-layer';
import { FCProps } from '@/types';

type Props = { label: string };

export const SessionDuplicateBtn: FCProps<Props> = ({ label }) => {
  const navigate = useNavigate();
  const { adventureId, sessionId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { duplicateSession } = useSession(sessionId, adventureId);

  const handleDuplicate = async () => {
    const newId = await duplicateSession();
    await navigate({
      to: buildEntityPath('sessions', newId, adventureId),
      state: { focusNameInput: true },
    });
  };

  return (
    <Button
      label={label}
      onClick={() => {
        void handleDuplicate();
      }}
    />
  );
};
