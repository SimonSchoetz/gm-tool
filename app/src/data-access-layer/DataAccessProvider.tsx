import { ReactNode } from 'react';
import { ImageProvider } from './images';
import { SessionProvider } from './sessions';

export const DataAccessProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ImageProvider>
      <SessionProvider>{children}</SessionProvider>
    </ImageProvider>
  );
};
