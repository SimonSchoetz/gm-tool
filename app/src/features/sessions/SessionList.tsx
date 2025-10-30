import type { Session } from '@db/session';
import SessionCard from './SessionCard';
import './SessionList.css';

type SessionListProps = {
  sessions: Session[];
  onEdit: (session: Session) => void;
  onDelete: (id: string) => void;
};

const SessionList = ({ sessions, onEdit, onDelete }: SessionListProps) => {
  return (
    <div className="sessions-list">
      <h2>Sessions ({sessions.length})</h2>
      {sessions.length === 0 ? (
        <p className="empty-state">No sessions yet. Create your first session above!</p>
      ) : (
        sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
};

export default SessionList;
