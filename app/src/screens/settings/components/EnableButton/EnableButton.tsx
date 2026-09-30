import { Button } from '@/components/Button/Button';
import { FCProps } from '@/types/fcProps.type';
import { cn } from '@/util/className';
import './EnableButton.css';

type Props = { isEnabled: boolean } & Omit<
  React.ComponentProps<typeof Button>,
  'label'
>;

export const EnableButton: FCProps<Props> = ({ isEnabled, ...rest }) => {
  return (
    <Button
      label={isEnabled ? 'Enabled' : 'Disabled'}
      className={cn('enable-button', isEnabled && 'enable-button-on')}
      {...rest}
    />
  );
};
