import { cn } from '@/util';

import './ActionContainer.css';
import { HtmlProps } from '@/types';

type ActionContainerProps = {
  onClick: () => void;
  label: string;
} & Omit<HtmlProps<'div'>, 'onClick'>;

const ActionContainer = ({
  onClick,
  label,
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
      className={cn('action-container', className)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={0}
      aria-label={label}
      {...props}
    >
      {children}
    </div>
  );
};

export default ActionContainer;
