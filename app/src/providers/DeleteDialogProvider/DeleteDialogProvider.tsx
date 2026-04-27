import { useState, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PopUpContainer, DeleteDialog } from '@/components';
import type { FCProps } from '@/types';
import { DeleteDialogContext } from './DeleteDialogContext';

type Props = { children: ReactNode };

export const DeleteDialogProvider: FCProps<Props> = ({ children }) => {
  const [dialog, setDialog] = useState<{
    name: string;
    action: () => void;
  } | null>(null);
  const [popupState, setPopupState] = useState<'open' | 'closed'>('closed');

  const openDeleteDialog = (name: string, action: () => void) => {
    setDialog({ name, action });
    setPopupState('open');
  };

  const onDeletionConfirm = () => {
    dialog?.action();
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
            />
          </PopUpContainer>,
          document.body,
        )}
    </>
  );
};
