import { ReactNode } from 'react';
import { FCProps } from '@/types';
import { DeleteDialogProvider } from '../DeleteDialogProvider';
import { PinnedPopupsProvider } from '../PinnedPopupsProvider';

type Props = { children: ReactNode };

export const AppProviders: FCProps<Props> = ({ children }) => (
  <DeleteDialogProvider>
    <PinnedPopupsProvider>{children}</PinnedPopupsProvider>
  </DeleteDialogProvider>
);
