import { useNavigate, useParams } from '@tanstack/react-router';
import { buildEntityPath } from '@domain';
import { Button } from '@/components';
import { usePc } from '@/data-access-layer';
import { FCProps } from '@/types';

type Props = { label: string };

export const PcDuplicateBtn: FCProps<Props> = ({ label }) => {
  const navigate = useNavigate();
  const { adventureId, pcId } = useParams({
    from: '/adventure/$adventureId/pc/$pcId',
  });
  const { duplicatePc } = usePc(pcId, adventureId);

  const handleDuplicate = async () => {
    const newId = await duplicatePc();
    await navigate({
      to: buildEntityPath('pcs', newId, adventureId),
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
