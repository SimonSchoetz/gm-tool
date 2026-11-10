import { Button } from '@/components/Button/Button';
import { FCProps } from '@/types/fcProps.type';
import { cn } from '@/util/className';
import { getEnableButtonLabel } from './helper/getEnableButtonLabel';
import './EnableButton.css';

type Props = { isEnabled: boolean } & Omit<
  React.ComponentProps<typeof Button>,
  'label'
>;

export const EnableButton: FCProps<Props> = ({ isEnabled, ...rest }) => {
  const label = getEnableButtonLabel(isEnabled);

  return (
    <Button
      label={label}
      className={cn('enable-button', isEnabled && 'enable-button-on')}
      {...rest}
    />
  );
};
