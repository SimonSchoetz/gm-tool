import { FCProps } from '@/types';

import './Button.css';
import ActionContainer from '../ActionContainer/ActionContainer';
import GlassPanel from '../GlassPanel/GlassPanel';
import { cn } from '@/util';

type Props = { buttonStyle?: 'danger' } & React.ComponentProps<
  typeof ActionContainer
>;

export const Button: FCProps<Props> = ({
  onClick,
  label,
  buttonStyle,
  className,
  ...props
}) => {
  return (
    <GlassPanel className={cn('global-btn-styles', 'button', className)}>
      <ActionContainer
        className={cn(
          'button-label',
          buttonStyle && `button-label--${buttonStyle}`,
        )}
        label={label}
        onClick={onClick}
        {...props}
      >
        {label}
      </ActionContainer>
    </GlassPanel>
  );
};
