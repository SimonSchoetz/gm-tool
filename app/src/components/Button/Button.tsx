import { FCProps } from '@/types';

import './Button.css';
import ActionContainer from '../ActionContainer/ActionContainer';
import GlassPanel from '../GlassPanel/GlassPanel';
import { cn } from '@/util';

type Props = { style?: 'danger' } & React.ComponentProps<
  typeof ActionContainer
>;

export const Button: FCProps<Props> = ({
  onClick,
  label,
  style,
  className,
  ...props
}) => {
  return (
    <ActionContainer
      className={cn(
        'button-wrapper',
        style && `button-wrapper--${style}`,
        className,
      )}
      label={label}
      onClick={onClick}
      {...props}
    >
      <GlassPanel
        className={cn('label-wrapper', style && `label-wrapper--${style}`)}
        radius='xl'
      >
        {label}
      </GlassPanel>
    </ActionContainer>
  );
};
