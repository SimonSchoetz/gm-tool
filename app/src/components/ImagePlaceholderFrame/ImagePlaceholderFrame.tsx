import { GlassPanel } from '@/components';
import { cn } from '@/util';

import './ImagePlaceholderFrame.css';
import { CSSProperties } from 'react';

type Props = React.ComponentProps<typeof GlassPanel> & {
  dimensions?: {
    width: CSSProperties['width'];
    height: CSSProperties['height'];
  };
};

export const ImagePlaceholderFrame = ({
  className,
  children,
  dimensions,
  ...props
}: Props) => {
  return (
    <GlassPanel
      style={{
        width: dimensions?.width || '200px',
        height: dimensions?.height || '350px',
      }}
      intensity='bright'
      className={cn('adventure-frame', className)}
      {...props}
    >
      {children}
    </GlassPanel>
  );
};

export default ImagePlaceholderFrame;
