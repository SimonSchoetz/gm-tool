import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { queryClient } from './queryClient';

export const TanstackQueryClientProvider: FCProps<{
  children: ReactNode;
}> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
