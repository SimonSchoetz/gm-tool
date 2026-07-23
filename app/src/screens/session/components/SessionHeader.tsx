import { useSession } from '@/data-access-layer';
import './SessionHeader.css';
import { SyncedInput, DateInput } from '@/components';
import { FCProps, HtmlProps } from '@/types';
import { useSyncedInputValue } from '@/hooks';
import { useParams } from '@tanstack/react-router';

export const SessionHeader: FCProps<HtmlProps<'header'>> = () => {
  const { sessionId, adventureId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { session, updateSession } = useSession(sessionId, adventureId);

  // DateInput wraps a native <input type='date'>, not the text Input, so the date field can't use SyncedInput and reconciles its external value through the shared hook directly.
  const {
    value: sessionDate,
    setValue: setSessionDate,
    focusProps: dateFocusProps,
  } = useSyncedInputValue(session?.session_date ?? '');

  if (!session) return null;

  return (
    <header className='session-header'>
      <SyncedInput
        className='session-name-input'
        placeholder='Session name, i. e. ingame date'
        initValue={session.name ?? ''}
        onCommit={(name) => {
          updateSession({ name });
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
          {...dateFocusProps}
        />
      </label>
    </header>
  );
};
