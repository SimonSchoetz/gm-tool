import { cn } from '@/util/className';

import './ActionContainer.css';
import { HtmlProps } from '@/types/htmlProps.type';

type ActionContainerProps = {
  label: string;
} & HtmlProps<'button'>;

export const ActionContainer = ({
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
