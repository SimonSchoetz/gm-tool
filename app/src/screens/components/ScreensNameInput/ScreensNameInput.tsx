import { FCProps } from '@/types';
import { SyncedInput } from '@/components';
import { useFocusNameInputOnArrival } from '@/hooks';
import { ComponentProps } from 'react';
import './ScreensNameInput.css';

type Props = Omit<
  ComponentProps<typeof SyncedInput>,
  'autoFocus' | 'className'
>;

export const ScreensNameInput: FCProps<Props> = ({ ...props }) => {
  const focusNameInput = useFocusNameInputOnArrival();

  return (
    <SyncedInput
      {...props}
      autoFocus={focusNameInput}
      className='screens-name-input'
    />
  );
};
