import { useContext } from 'react';
import { SessionContext } from './SessionProvider';

export const useSessions = () => {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSessions must be used within a SessionProvider');
  }

  return context;
};
