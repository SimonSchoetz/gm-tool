import { useState } from 'react';
import type { Session } from '@db/session';
import { useSessions } from '@/data-access-layer/sessions';
import { SessionList } from './components';

export const SessionScreen = () => {
  const { sessions, loading, error } = useSessions();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
        <h1>Error</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <p>Check the browser console for more details</p>
      </div>
    );
  }

  return (
    <div>
      <SessionList sessions={sessions} />
    </div>
  );
};
