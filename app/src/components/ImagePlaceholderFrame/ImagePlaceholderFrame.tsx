import { GlassPanel } from '@/components';
import { cn } from '@/util';

import './ImagePlaceholderFrame.css';
import { CSSProperties } from 'react';

type Props = React.ComponentProps<typeof GlassPanel> & {
  dimensions: {
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
  const { width, height } = dimensions;

  return (
    <GlassPanel
      style={{ width, height }}
      intensity='bright'
      className={cn('adventure-frame', className)}
      {...props}
    >
      {children}
    </GlassPanel>
  );
};

export default ImagePlaceholderFrame;
