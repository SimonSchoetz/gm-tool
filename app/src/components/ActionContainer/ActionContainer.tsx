import { cn } from '@/util';

import './ActionContainer.css';
import { HtmlProps } from '@/types';

type ActionContainerProps = {
  onClick: () => void;
  label: string;
  invisible?: boolean;
} & HtmlProps<'button'>;

const ActionContainer = ({
  onClick,
  label,
  className = '',
  children,
  invisible,
  ...props
}: ActionContainerProps) => {
  return (
    <button
      className={cn('action-container', !invisible && 'button', className)}
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
