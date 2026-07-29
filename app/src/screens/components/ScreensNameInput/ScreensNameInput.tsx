import { FCProps } from '@/types';
import { SyncedInput } from '@/components';
import { ComponentProps } from 'react';
import './ScreensNameInput.css';

type Props = ComponentProps<typeof SyncedInput>;

export const ScreensNameInput: FCProps<Props> = ({ ...props }) => {
  return <SyncedInput {...props} className='screens-name-input' />;
};
