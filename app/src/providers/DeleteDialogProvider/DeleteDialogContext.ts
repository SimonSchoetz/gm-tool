import { DeleteDialog } from '@/components';
import { createContext } from 'react';

export type DeleteDialogContextValue = {
  openDeleteDialog: ({
    name,
    onDeletionConfirm,
    oneClickConfirm,
  }: React.ComponentProps<typeof DeleteDialog>) => void;
};

export const DeleteDialogContext =
  createContext<DeleteDialogContextValue | null>(null);
