import { GlassPanel } from '@/components';
import { cn } from '@/util';

import './AdventureFrame.css';

type Props = React.ComponentProps<typeof GlassPanel>;

const AdventureFrame = ({ className, children, ...props }: Props) => {
  return (
    <GlassPanel
      intensity='bright'
      className={cn('adventure-frame', className)}
      {...props}
    >
      {children}
    </GlassPanel>
  );
};

export default AdventureFrame;
