import { useState } from 'react';
import { GlassPanel } from '../GlassPanel/GlassPanel';
import { Input } from '../Input/Input';
import { useTypographicInput } from '@/hooks/useTypographicInput';
import { FCProps } from '@/types/fcProps.type';
import './DeleteDialog.css';
import { Button } from '../Button/Button';

type Action = 'delete' | 'remove';

// The words of the title and of the one-click sentence.
const ACTION_WORDS: Record<Action, { title: string; verb: string }> = {
  delete: { title: 'Delete', verb: 'delete' },
  remove: { title: 'Remove', verb: 'remove' },
};

// Typing to confirm always asks for DELETE, so only the one-click mode takes another action's wording.
type Props = {
  name: string;
  onDeletionConfirm: () => void;
} & (
  | { oneClickConfirm: true; action?: Action }
  | { oneClickConfirm: false; action?: 'delete' }
);

export const DeleteDialog: FCProps<Props> = ({
  name,
  onDeletionConfirm,
  oneClickConfirm,
  action = 'delete',
}) => {
  const [intensity, setIntensity] = useState(0);
  const [confirmInput, setConfirmInput] = useState('');
  const confirmText = `DELETE ${name}`.trim();
  const words = ACTION_WORDS[action];

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

  const { inputRef, handleChange } = useTypographicInput(
    confirmInput,
    (newValue) => {
      setConfirmInput(newValue);
      handleInputChange(newValue);
    },
  );

  return (
    <GlassPanel
      className='delete-dialog'
      style={{ '--delete-dialog-intensity': intensity } as React.CSSProperties}
    >
      <h1 className='delete-dialog-title'>
        {words.title} {name}
      </h1>
      {oneClickConfirm ? (
        <>
          <p>
            Are you sure you want to {words.verb} {name}?
          </p>
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
            ref={inputRef}
            className='delete-dialog-input'
            placeholder={confirmText}
            value={confirmInput}
            onChange={handleChange}
          />
        </>
      )}
    </GlassPanel>
  );
};
