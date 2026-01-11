import type { Session } from '@db/session';

import './SessionList.css';

type SessionListProps = {
  sessions: Session[];
};

const SessionList = ({ sessions }: SessionListProps) => {
  return (
    <div className='sessions-list'>
      <h2>Sessions ({sessions.length})</h2>
      {sessions.length === 0 ? (
        <p className='empty-state'>
          No sessions yet. Create your first session above!
        </p>
      ) : (
        sessions.map((session) => <p>{session.title}</p>)
      )}
    </div>
  );
};

export default SessionList;
