import { useNavigate } from '@tanstack/react-router';
import './MentionBadge.css';

type Props = {
  entityId: string;
  entityType: string;
  displayName: string;
  color: string;
  adventureId?: string | undefined;
};

export const MentionBadge = ({
  entityId,
  entityType,
  displayName,
  color,
  adventureId,
}: Props) => {
  const navigate = useNavigate();
  const entitySegment = entityType.slice(0, -1);

  const handleClick = () => {
    const path = adventureId
      ? `/adventure/${adventureId}/${entitySegment}/${entityId}`
      : `/${entitySegment}/${entityId}`;
    navigate({ to: path });
  };

  return (
    <span className='mention-badge' style={{ color }} onClick={handleClick}>
      {displayName}
    </span>
  );
};
