import { ReactNode } from 'react';
import { AdventureProvider } from './adventures';
import { SessionProvider } from './sessions';
import { ImageProvider } from './images';

export const DataProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ImageProvider>
      <AdventureProvider>
        <SessionProvider>{children}</SessionProvider>
      </AdventureProvider>
    </ImageProvider>
  );
};
