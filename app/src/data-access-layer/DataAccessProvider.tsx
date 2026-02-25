import { ReactNode } from 'react';
import { SessionProvider } from './sessions';

export const DataAccessProvider = ({ children }: { children: ReactNode }) => {
  return <SessionProvider>{children}</SessionProvider>;
};
