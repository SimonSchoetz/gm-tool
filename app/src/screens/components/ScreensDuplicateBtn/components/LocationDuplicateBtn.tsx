import { useNavigate, useParams } from '@tanstack/react-router';
import { buildEntityPath } from '@domain';
import { Button } from '@/components';
import { useLocation } from '@/data-access-layer';
import { FCProps } from '@/types';

type Props = { label: string };

export const LocationDuplicateBtn: FCProps<Props> = ({ label }) => {
  const navigate = useNavigate();
  const { adventureId, locationId } = useParams({
    from: '/adventure/$adventureId/location/$locationId',
  });
  const { duplicateLocation } = useLocation(locationId, adventureId);

  const handleDuplicate = async () => {
    const newId = await duplicateLocation();
    await navigate({
      to: buildEntityPath('locations', newId, adventureId),
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
