import { useContext } from 'react';
import { DeleteDialogContext } from './DeleteDialogContext';

export const useDeleteDialog = () => {
  const value = useContext(DeleteDialogContext);
  if (value === null) {
    throw new Error(
      'useDeleteDialog must be called within a DeleteDialogProvider',
    );
  }
  return value;
};
