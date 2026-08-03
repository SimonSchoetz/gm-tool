import { useState } from 'react';
import { GlassPanel } from '../GlassPanel/GlassPanel';
import { Input } from '../Input/Input';
import { FCProps } from '@/types';
import './DeleteDialog.css';
import { Button } from '../Button/Button';

type Props = {
  name: string;
  onDeletionConfirm: () => void;
  oneClickConfirm: boolean;
};

export const DeleteDialog: FCProps<Props> = ({
  name,
  onDeletionConfirm,
  oneClickConfirm,
}) => {
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
      className='delete-dialog'
      style={{ '--delete-dialog-intensity': intensity } as React.CSSProperties}
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
