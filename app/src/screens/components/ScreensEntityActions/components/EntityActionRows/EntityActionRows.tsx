import { useNavigate } from '@tanstack/react-router';
import { CopyIcon, Trash2Icon } from 'lucide-react';
import { buildEntityPath, type EntityType } from '@domain';
import { MenuOptionRow } from '@/components/MenuOptionRow/MenuOptionRow';
import { useDeleteDialog } from '@/providers/DeleteDialogProvider';
import { FCProps } from '@/types/fcProps.type';

export type AfterDelete = 'stay' | 'go-to-list';

type Props = {
  entityType: EntityType;
  adventureId: string;
  name: string;
  listPath: string;
  canDelete: boolean;
  afterDelete: AfterDelete;
  onChoose: () => void;
  duplicate?: () => Promise<string>;
  deleteEntity: () => Promise<void>;
};

// Both flows read everything they need from props and `navigate` taken at construction, so they keep working after `onChoose` unmounts the menu that rendered these rows.
export const EntityActionRows: FCProps<Props> = ({
  entityType,
  adventureId,
  name,
  listPath,
  canDelete,
  afterDelete,
  onChoose,
  duplicate,
  deleteEntity,
}) => {
  const navigate = useNavigate();
  const { openDeleteDialog } = useDeleteDialog();

  const handleDuplicate = async (duplicateFn: () => Promise<string>) => {
    onChoose();
    const newId = await duplicateFn();
    await navigate({
      to: buildEntityPath(entityType, newId, adventureId),
      state: { focusNameInput: true },
    });
  };

  const handleDelete = async () => {
    await deleteEntity();
    if (afterDelete === 'go-to-list') {
      await navigate({ to: listPath });
    }
  };

  const onDuplicateClick = duplicate
    ? () => {
        void handleDuplicate(duplicate);
      }
    : null;

  const onDeleteClick = () => {
    openDeleteDialog({
      name,
      onDeletionConfirm: () => {
        void handleDelete();
      },
      oneClickConfirm: false,
    });
    onChoose();
  };

  return (
    <>
      {onDuplicateClick && (
        <li>
          <MenuOptionRow
            Icon={CopyIcon}
            label='Duplicate'
            onClick={onDuplicateClick}
          />
        </li>
      )}
      <li>
        <MenuOptionRow
          Icon={Trash2Icon}
          label='Delete'
          variant='danger'
          disabled={!canDelete}
          onClick={onDeleteClick}
        />
      </li>
    </>
  );
};
