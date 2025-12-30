import { FCProps, HtmlProps } from '@/types';
import { cn } from '@/util';
import './Shimmer.css';

type Props = { isActive: boolean } & HtmlProps<'div'>;

export const Shimmer: FCProps<Props> = ({ isActive, className, ...props }) => {
  return (
    <div
      className={cn('holo-fx-shimmer', className, isActive ? 'active' : '')}
      {...props}
    />
  );
};
