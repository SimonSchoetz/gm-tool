import { DivProps } from '@/types/htmlProps';
import { cn } from '@/util';
import GlassPanel from '../GlassPanel/GlassPanel';
import './ActionCard.css';

type ActionCardProps = {
  onClick: () => void;
} & Omit<DivProps, 'onClick'>;

const ActionCard = ({
  onClick,
  className = '',
  children,
  ...props
}: ActionCardProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <GlassPanel
      className={cn('action-card', className)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={0}
      {...props}
    >
      {children}
    </GlassPanel>
  );
};

export default ActionCard;
