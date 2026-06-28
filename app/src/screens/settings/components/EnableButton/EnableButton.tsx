import { Button } from '@/components';
import { FCProps } from '@/types';
import { cn } from '@/util';
import './EnableButton.css';

type Props = { isEnabled: boolean } & Omit<
  React.ComponentProps<typeof Button>,
  'label'
>;

export const EnableButton: FCProps<Props> = ({ isEnabled }) => {
  return (
    <Button
      label={isEnabled ? 'Enabled' : 'Disabled'}
      className={cn('enable-button', isEnabled && 'enable-button-on')}
    />
  );
};
