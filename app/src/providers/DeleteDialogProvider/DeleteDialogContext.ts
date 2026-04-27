import { createContext } from 'react';

export type DeleteDialogContextValue = {
  openDeleteDialog: (name: string, action: () => void) => void;
};

export const DeleteDialogContext =
  createContext<DeleteDialogContextValue | null>(null);
