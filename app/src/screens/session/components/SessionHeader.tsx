import { useSession } from '@/data-access-layer';
import './SessionHeader.css';

type View = 'prep' | 'ingame';

type Props = {
  sessionId: string;
  adventureId: string;
  view: View;
  onViewChange: (view: View) => void;
};

export const SessionHeader = ({ sessionId, adventureId, view, onViewChange }: Props) => {
  const { session, updateSession } = useSession(sessionId, adventureId);

  return (
    <header className='session-header'>
      <input
        type='text'
        className='session-name-input'
        placeholder='Session name'
        value={session?.name ?? ''}
        onChange={(e) => updateSession({ name: e.target.value })}
      />

      <div className='session-view-toggle'>
        <button
          className={`view-toggle-btn ${view === 'prep' ? 'active' : ''}`}
          onClick={() => onViewChange('prep')}
        >
          Prep
        </button>
        <button
          className={`view-toggle-btn ${view === 'ingame' ? 'active' : ''}`}
          onClick={() => onViewChange('ingame')}
        >
          In Game
        </button>
      </div>
    </header>
  );
};
