import { useSession } from '@/data-access-layer';
import './SessionHeader.css';
import { Input, DateInput } from '@/components';
import { FCProps, HtmlProps } from '@/types';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';

export const SessionHeader: FCProps<HtmlProps<'header'>> = () => {
  const { sessionId, adventureId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { session, updateSession } = useSession(sessionId, adventureId);

  const [sessionName, setSessionName] = useState(session?.name ?? '');
  const [sessionDate, setSessionDate] = useState(session?.session_date ?? '');
  const [syncedSessionId, setSyncedSessionId] = useState(session?.id);

  if (!session) return null;

  if (session.id !== syncedSessionId) {
    setSyncedSessionId(session.id);
    setSessionName(session.name ?? '');
    setSessionDate(session.session_date ?? '');
  }

  return (
    <header className='session-header'>
      <Input
        className='session-name-input'
        placeholder='Session name'
        value={sessionName}
        onChange={(e) => {
          setSessionName(e.target.value);
          updateSession({ name: e.target.value });
        }}
      />

      <label className='session-date'>
        <span className='session-date__label'>Session Date:</span>

        <DateInput
          className='session-date__input'
          value={sessionDate}
          onChange={(e) => {
            setSessionDate(e.target.value);
            updateSession({ session_date: e.target.value });
          }}
        />
      </label>
    </header>
  );
};
