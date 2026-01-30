import { cn } from '@/util';

import './ActionContainer.css';
import { HtmlProps } from '@/types';

type ActionContainerProps = {
  onClick: () => void;
  label: string;
} & Omit<HtmlProps<'button'>, 'onClick'>;

const ActionContainer = ({
  onClick,
  label,
  className = '',
  children,
  ...props
}: ActionContainerProps) => {
  return (
    <button
      className={cn('action-container', 'button', className)}
      onClick={onClick}
      tabIndex={0}
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  );
};

export default ActionContainer;
