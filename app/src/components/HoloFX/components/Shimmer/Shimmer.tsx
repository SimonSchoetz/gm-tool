import { FCProps, HtmlProps } from '@/types';
import { cn } from '@/util';
import './Shimmer.css';

type Props = { shimmerContent?: string } & HtmlProps<'div'>;

export const Shimmer: FCProps<Props> = ({
  shimmerContent,
  className,
  ...props
}) => {
  return (
    <div
      className={cn('holo-fx-shimmer', className)}
      style={
        {
          '--shimmer-content': shimmerContent ? `"${shimmerContent}"` : '""',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};
