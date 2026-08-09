import { GlassPanel } from '../GlassPanel/GlassPanel';
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
  return (
    <GlassPanel
      style={dimensions}
      intensity='bright'
      className={cn('image-placeholder-frame', className)}
      {...props}
    >
      {children}
    </GlassPanel>
  );
};

export default ImagePlaceholderFrame;
