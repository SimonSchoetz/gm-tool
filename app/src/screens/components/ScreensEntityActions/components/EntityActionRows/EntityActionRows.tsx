import { useNavigate } from '@tanstack/react-router';
import { CopyIcon, Trash2Icon } from 'lucide-react';
import { MenuOptionRow } from '@/components/MenuOptionRow/MenuOptionRow';
import { useDeleteDialog } from '@/providers/DeleteDialogProvider';
import { FCProps } from '@/types/fcProps.type';

export type AfterDelete = 'stay' | 'go-to-list';

type Props = {
  name: string;
  listPath: string;
  afterDelete: AfterDelete;
  onChoose: () => void;
  // Makes the copy and resolves to the path that opens it.
  duplicate?: () => Promise<string>;
  deleteEntity: () => Promise<void>;
};

// Both flows read everything they need from props and `navigate` taken at construction, so they keep working after `onChoose` unmounts the menu that rendered these rows.
export const EntityActionRows: FCProps<Props> = ({
  name,
  listPath,
  afterDelete,
  onChoose,
  duplicate,
  deleteEntity,
}) => {
  const navigate = useNavigate();
  const { openDeleteDialog } = useDeleteDialog();

  const handleDuplicate = async (duplicateFn: () => Promise<string>) => {
    onChoose();
    const copyPath = await duplicateFn();
    await navigate({ to: copyPath, state: { focusNameInput: true } });
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
          onClick={onDeleteClick}
        />
      </li>
    </>
  );
};
