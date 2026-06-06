import { FCProps, HtmlProps } from '@/types';
import { cn } from '@/util';
import './Glare.css';

type Props = HtmlProps<'div'>;

export const Glare: FCProps<Props> = ({ className, ...props }) => {
  return <div className={cn('holo-fx-glare', className)} {...props} />;
};
