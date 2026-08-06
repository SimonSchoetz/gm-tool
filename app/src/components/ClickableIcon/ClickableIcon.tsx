import { ReactNode } from 'react';
import { FCProps } from '@/types';
import { cn } from '@/util';
import { ActionContainer } from '../ActionContainer/ActionContainer';
import './ClickableIcon.css';

type Props = {
  icon: ReactNode;
  isActive?: boolean;
  variant?: 'danger';
} & React.ComponentProps<typeof ActionContainer>;

export const ClickableIcon: FCProps<Props> = ({
  icon,
  isActive,
  variant,
  className,
  ...rest
}) => (
  <ActionContainer
    className={cn(
      'clickable-icon',
      isActive && 'clickable-icon--active',
      variant === 'danger' && 'clickable-icon--danger',
      rest.disabled && 'clickable-icon--disabled',
      className,
    )}
    {...rest}
  >
    {icon}
  </ActionContainer>
);
