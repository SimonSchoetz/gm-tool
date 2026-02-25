import { ReactNode } from 'react';
import { TableConfigProvider } from './table-config';
import { ImageProvider } from './images';
import { AdventureProvider } from './adventures';
import { SessionProvider } from './sessions';

export const DataAccessProvider = ({ children }: { children: ReactNode }) => {
  return (
    <TableConfigProvider>
      <ImageProvider>
        <AdventureProvider>
          <SessionProvider>{children}</SessionProvider>
        </AdventureProvider>
      </ImageProvider>
    </TableConfigProvider>
  );
};
