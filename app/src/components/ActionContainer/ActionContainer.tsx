import { cn } from '@/util';

import './ActionContainer.css';
import { HtmlProps } from '@/types';

type ActionContainerProps = {
  onClick: () => void;
} & Omit<HtmlProps<'div'>, 'onClick'>;

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
