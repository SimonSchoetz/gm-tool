import type { Session } from '@db/session';
import { Button, GlassPanel } from '@/components';
import './SessionCard.css';

type SessionCardProps = {
  session: Session;
  onEdit: (session: Session) => void;
  onDelete: (id: string) => void;
};

const SessionCard = ({ session, onEdit, onDelete }: SessionCardProps) => {
  return (
    <GlassPanel className='session-card'>
      <h3>{session.title}</h3>
      {session.description && (
        <p className='session-description'>{session.description}</p>
      )}
      {session.session_date && (
        <p className='session-date'>
          Date: {new Date(session.session_date).toLocaleDateString()}
        </p>
      )}
      {session.notes && (
        <div className='session-notes'>
          <strong>Notes:</strong>
          <p>{session.notes}</p>
        </div>
      )}
      <div className='session-actions'>
        <Button size='small' onClick={() => onEdit(session)}>
          Edit
        </Button>
        <Button
          size='small'
          variant='danger'
          onClick={() => onDelete(session.id)}
        >
          Delete
        </Button>
      </div>
    </GlassPanel>
  );
};

export default SessionCard;
