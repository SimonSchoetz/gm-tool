import { useSession } from '@/data-access-layer';
import type { View } from '../SessionScreen';
import './SessionHeader.css';
import { Input } from '@/components';

type Props = {
  sessionId: string;
  adventureId: string;
  view: View;
  onViewChange: (view: View) => void;
};

export const SessionHeader = ({
  sessionId,
  adventureId,
  view,
  onViewChange,
}: Props) => {
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
        {view === 'prep' && (
          <input
            type='date'
            className='session-date-input'
            value={session?.session_date ?? ''}
            onChange={(e) => {
              updateSession({ session_date: e.target.value });
            }}
          />
        )}

        {view === 'ingame' && session?.session_date && (
          <span className='session-date-display'>{session.session_date}</span>
        )}

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
