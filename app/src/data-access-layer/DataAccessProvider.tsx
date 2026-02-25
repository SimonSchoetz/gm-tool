import { ReactNode } from 'react';
import { TableConfigProvider } from './table-config';
import { ImageProvider } from './images';
import { SessionProvider } from './sessions';

export const DataAccessProvider = ({ children }: { children: ReactNode }) => {
  return (
    <TableConfigProvider>
      <ImageProvider>
        <SessionProvider>{children}</SessionProvider>
      </ImageProvider>
    </TableConfigProvider>
  );
};
