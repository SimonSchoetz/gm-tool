import { DivProps } from '@/types/htmlProps';
import { cn } from '@/util';
import GlassPanel from '../GlassPanel/GlassPanel';
import './ActionContainer.css';

type ActionContainerProps = {
  onClick: () => void;
} & Omit<DivProps, 'onClick'>;

const ActionContainer = ({
  onClick,
  className = '',
  children,
  ...props
}: ActionContainerProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={cn('action-card', className)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={0}
      {...props}
    >
      {children}
    </div>
  );
};

export default ActionContainer;
