import { useSession } from '@/data-access-layer';
import type { View } from '../SessionScreen';
import './SessionHeader.css';
import { Input, DateInput } from '@/components';
import { FCProps } from '@/types';

type Props = {
  sessionId: string;
  adventureId: string;
  view: View;
  onViewChange: (view: View) => void;
};

export const SessionHeader: FCProps<Props> = ({
  sessionId,
  adventureId,
  view,
  onViewChange,
}) => {
  const { session, updateSession } = useSession(sessionId, adventureId);

  return (
    <header className='session-header'>
      <Input
        className='session-name-input'
        placeholder='Session name'
        value={session?.name ?? ''}
        onChange={(e) => {
          updateSession({ name: e.target.value });
        }}
      />

      <div>
        <label className='session-date'>
          <span className='session-date__label'>Session Date:</span>
          {view === 'prep' && (
            <DateInput
              className='session-date__input'
              value={session?.session_date ?? ''}
              onChange={(e) => {
                updateSession({ session_date: e.target.value });
              }}
            />
          )}

          {view === 'ingame' && session?.session_date && (
            <span className='session-date-display'>{session.session_date}</span>
          )}
        </label>

        <div className='session-view-toggle'>
          <button
            className={`view-toggle-btn${view === 'prep' ? ' view-toggle-btn--active' : ''}`}
            onClick={() => {
              onViewChange('prep');
            }}
          >
            Prep
          </button>
          <button
            className={`view-toggle-btn${view === 'ingame' ? ' view-toggle-btn--active' : ''}`}
            onClick={() => {
              onViewChange('ingame');
            }}
          >
            In Game
          </button>
        </div>
      </div>
    </header>
  );
};
