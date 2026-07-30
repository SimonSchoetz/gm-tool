import { useSession } from '@/data-access-layer';
import './SessionHeader.css';
import { SyncedInput, DateInput } from '@/components';
import { FCProps, HtmlProps } from '@/types';
import { useSyncedInputValue } from '@/hooks';
import { useParams, useRouterState } from '@tanstack/react-router';

export const SessionHeader: FCProps<HtmlProps<'header'>> = () => {
  const { sessionId, adventureId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { session, updateSession } = useSession(sessionId, adventureId);

  const focusNameInput = useRouterState({
    select: (state) => state.location.state.focusNameInput ?? false,
  });

  // DateInput wraps a native <input type='date'>, not the text Input, so the date field can't use SyncedInput and reconciles its external value through the shared hook directly.
  const {
    value: sessionDate,
    setValue: setSessionDate,
    focusProps: dateFocusProps,
  } = useSyncedInputValue(session?.session_date ?? '');

  if (!session) return;

  return (
    <header className='session-header'>
      <SyncedInput
        autoFocus={focusNameInput}
        className='session-name-input'
        placeholder='Session name, i. e. ingame date'
        initValue={session.name ?? ''}
        onCommit={(name) => {
          updateSession({ name });
        }}
      />

      <label className='session-date'>
        <span className='session-date-label'>Session Date:</span>

        <DateInput
          className='session-date-input'
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
