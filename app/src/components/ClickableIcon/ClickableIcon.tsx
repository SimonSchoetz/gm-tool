import { ReactNode } from 'react';
import { cn } from '@/util';
import ActionContainer from '../ActionContainer/ActionContainer';
import './ClickableIcon.css';

type Props = {
  icon: ReactNode;
  isActive?: boolean;
  variant?: 'danger';
} & React.ComponentProps<typeof ActionContainer>;

export const ClickableIcon = ({
  icon,
  isActive,
  variant,
  className,
  ...rest
}: Props) => (
  <ActionContainer
    className={cn(
      'clickable-icon',
      isActive && 'clickable-icon--active',
      variant === 'danger' && 'clickable-icon--danger',
      className,
    )}
    {...rest}
  >
    {icon}
  </ActionContainer>
);
