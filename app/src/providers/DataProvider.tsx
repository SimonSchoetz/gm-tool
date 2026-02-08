import { ReactNode } from 'react';
import { AdventureProvider } from './adventures';
import { SessionProvider } from './sessions';
import { ImageProvider } from './images';
import { NpcProvider } from './npcs';

export const DataProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ImageProvider>
      <AdventureProvider>
        <NpcProvider>
          <SessionProvider>{children}</SessionProvider>
        </NpcProvider>
      </AdventureProvider>
    </ImageProvider>
  );
};
