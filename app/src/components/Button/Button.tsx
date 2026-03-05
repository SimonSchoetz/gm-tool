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
    <ActionContainer
      className={cn(
        'button',
        buttonStyle && `button--${buttonStyle}`,
        className,
      )}
      label={label}
      onClick={onClick}
      {...props}
    >
      <GlassPanel
        className={cn(
          'button-label',
          buttonStyle && `button-label--${buttonStyle}`,
        )}
        radius='xl'
      >
        {label}
      </GlassPanel>
    </ActionContainer>
  );
};
