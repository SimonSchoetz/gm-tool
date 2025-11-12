import { ReactNode } from 'react';
import { AdventureProvider } from './adventures';
import { SessionProvider } from './sessions';

export const DataProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AdventureProvider>
      <SessionProvider>{children}</SessionProvider>
    </AdventureProvider>
  );
};
