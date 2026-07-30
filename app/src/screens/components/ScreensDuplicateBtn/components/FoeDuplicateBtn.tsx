import { useNavigate, useParams } from '@tanstack/react-router';
import { buildEntityPath } from '@domain';
import { Button } from '@/components';
import { useFoe } from '@/data-access-layer';
import { FCProps } from '@/types';

type Props = { label: string };

export const FoeDuplicateBtn: FCProps<Props> = ({ label }) => {
  const navigate = useNavigate();
  const { adventureId, foeId } = useParams({
    from: '/adventure/$adventureId/foe/$foeId',
  });
  const { duplicateFoe } = useFoe(foeId, adventureId);

  const handleDuplicate = async () => {
    const newId = await duplicateFoe();
    await navigate({
      to: buildEntityPath('foes', newId, adventureId),
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
