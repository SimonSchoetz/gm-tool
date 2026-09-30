import { ReactNode } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { DeleteDialogProvider } from '../DeleteDialogProvider';
import { PinnedPopupsProvider } from '../PinnedPopupsProvider/PinnedPopupsProvider';

type Props = { children: ReactNode };

export const AppProviders: FCProps<Props> = ({ children }) => (
  <DeleteDialogProvider>
    <PinnedPopupsProvider>{children}</PinnedPopupsProvider>
  </DeleteDialogProvider>
);
