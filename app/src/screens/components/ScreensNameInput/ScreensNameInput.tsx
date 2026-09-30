import { FCProps } from '@/types/fcProps.type';
import { SyncedInput } from '@/components/SyncedInput/SyncedInput';
import { useFocusNameInputOnArrival } from '@/hooks/useFocusNameInputOnArrival';
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
