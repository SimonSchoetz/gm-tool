import { useState } from 'react';
import GlassPanel from '../GlassPanel/GlassPanel';
import { cn } from '@/util';
import Input from '../Input/Input';
import './DeleteDialog.css';
import { Button } from '../Button/Button';

type DeleteDialogProps = {
  name: string;
  onDeletionConfirm: () => void;
  oneClickConfirm: boolean;
};

export const DeleteDialog = ({
  name,
  onDeletionConfirm,
  oneClickConfirm,
}: DeleteDialogProps) => {
  const [intensity, setIntensity] = useState(0);
  const confirmText = `DELETE ${name}`.trim();

  const handleInputChange = (input: string) => {
    const targetSubString = confirmText.substring(0, input.length);
    if (input === targetSubString) {
      setIntensity((1 / confirmText.length) * input.length);
    } else {
      setIntensity(0);
    }

    if (input === confirmText) {
      onDeletionConfirm();
    }
  };

  return (
    <GlassPanel
      className={cn('delete-dialog')}
      style={{
        boxShadow: `inset 0 -${intensity * 5}px ${intensity * 10}px rgb(var(--color-danger-hover-rgb), ${intensity / 2})`,
        background: `radial-gradient(ellipse 50% 80% at 50% 100%, rgb(var(--color-danger-hover-rgb), ${intensity}), transparent)`,
      }}
    >
      <h1 className='delete-dialog-title'>Delete {name}</h1>
      {oneClickConfirm ? (
        <>
          <p>Are you sure you want to delete {name}?</p>
          <Button
            className='one-click-confirm-btn'
            onClick={onDeletionConfirm}
            label='CONFIRM'
            buttonStyle='danger'
          />
        </>
      ) : (
        <>
          <p>
            Type
            <span className='delete-dialog-confirm-text'>{` ${confirmText} `}</span>
            below to confirm this action:
          </p>
          <Input
            className='delete-dialog-input'
            placeholder={confirmText}
            onChange={(e) => {
              handleInputChange(e.target.value);
            }}
          />
        </>
      )}
    </GlassPanel>
  );
};
