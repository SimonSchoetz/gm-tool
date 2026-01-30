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
        'button-wrapper',
        buttonStyle && `button-wrapper--${buttonStyle}`,
        className,
      )}
      label={label}
      onClick={onClick}
      {...props}
    >
      <GlassPanel
        className={cn(
          'label-wrapper',
          buttonStyle && `label-wrapper--${buttonStyle}`,
        )}
        radius='xl'
      >
        {label}
      </GlassPanel>
    </ActionContainer>
  );
};
