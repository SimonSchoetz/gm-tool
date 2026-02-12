import { useState } from 'react';
import GlassPanel from '../GlassPanel/GlassPanel';
import { cn } from '@/util';
import Input from '../Input/Input';
import './DeleteDialog.css';

type DeleteDialogProps = {
  name: string;
  onDeletionConfirm: () => void;
};

export const DeleteDialog = ({
  name,
  onDeletionConfirm,
}: DeleteDialogProps) => {
  const [intensity, setIntensity] = useState<number>(0);
  const confirmText = `DELETE ${name}`;

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
      <p>
        You are about to delete {name} with all associated data. This action
        cannot be undone.
      </p>
      <p>
        Type
        <span className='delete-dialog-confirm-text'>{` ${confirmText} `}</span>
        below to confirm this action:
      </p>
      <Input
        className='delete-dialog-input'
        placeholder={confirmText}
        onChange={(e) => handleInputChange(e.target.value)}
      />
    </GlassPanel>
  );
};
