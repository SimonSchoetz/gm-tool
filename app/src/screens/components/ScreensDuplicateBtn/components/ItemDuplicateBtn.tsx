import { useNavigate, useParams } from '@tanstack/react-router';
import { buildEntityPath } from '@domain';
import { Button } from '@/components';
import { useItem } from '@/data-access-layer';
import { FCProps } from '@/types';

type Props = { label: string };

export const ItemDuplicateBtn: FCProps<Props> = ({ label }) => {
  const navigate = useNavigate();
  const { adventureId, itemId } = useParams({
    from: '/adventure/$adventureId/item/$itemId',
  });
  const { duplicateItem } = useItem(itemId, adventureId);

  const handleDuplicate = async () => {
    const newId = await duplicateItem();
    await navigate({
      to: buildEntityPath('items', newId, adventureId),
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
