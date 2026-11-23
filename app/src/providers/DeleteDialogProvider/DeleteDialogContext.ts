import { DeleteDialog } from '@/components/DeleteDialog/DeleteDialog';
import { createContext } from 'react';

type DeleteDialogContextValue = {
  openDeleteDialog: (props: React.ComponentProps<typeof DeleteDialog>) => void;
};

export const DeleteDialogContext =
  createContext<DeleteDialogContextValue | null>(null);
