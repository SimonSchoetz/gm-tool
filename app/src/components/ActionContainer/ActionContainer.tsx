import { cn } from '@/util';

import './ActionContainer.css';
import { HtmlProps } from '@/types';

type ActionContainerProps = {
  label: string;
} & HtmlProps<'button'>;

const ActionContainer = ({
  label,
  className = '',
  children,
  ...props
}: ActionContainerProps) => {
  return (
    <button
      className={cn('action-container', className)}
      tabIndex={0}
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  );
};

export default ActionContainer;
