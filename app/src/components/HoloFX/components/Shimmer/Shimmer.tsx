import { FCProps, HtmlProps } from '@/types';
import { cn } from '@/util';
import './Shimmer.css';

type Props = HtmlProps<'div'>;

export const Shimmer: FCProps<Props> = ({ className, ...props }) => {
  return <div className={cn('holo-fx-shimmer', className)} {...props} />;
};
