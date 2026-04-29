import { useState, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PopUpContainer, DeleteDialog } from '@/components';
import type { FCProps } from '@/types';
import { DeleteDialogContext } from './DeleteDialogContext';

type Props = { children: ReactNode };

type DeleteDialogProps = React.ComponentProps<typeof DeleteDialog>;

export const DeleteDialogProvider: FCProps<Props> = ({ children }) => {
  const [dialog, setDialog] = useState<DeleteDialogProps | null>(null);
  const [popupState, setPopupState] = useState<'open' | 'closed'>('closed');

  const openDeleteDialog = ({
    name,
    onDeletionConfirm,
    oneClickConfirm,
  }: DeleteDialogProps) => {
    setDialog({ name, onDeletionConfirm, oneClickConfirm });
    setPopupState('open');
  };

  const onDeletionConfirm = () => {
    dialog?.onDeletionConfirm();
    setPopupState('closed');
  };

  useEffect(() => {
    if (popupState === 'closed') {
      const timeout = setTimeout(() => {
        setDialog(null);
      }, 500);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [popupState]);

  return (
    <>
      <DeleteDialogContext.Provider value={{ openDeleteDialog }}>
        {children}
      </DeleteDialogContext.Provider>
      {dialog !== null &&
        createPortal(
          <PopUpContainer state={popupState} setState={setPopupState}>
            <DeleteDialog
              name={dialog.name}
              onDeletionConfirm={onDeletionConfirm}
              oneClickConfirm={dialog.oneClickConfirm}
            />
          </PopUpContainer>,
          document.body,
        )}
    </>
  );
};
