import { HtmlProps } from '@/types';
import { useEffect } from 'react';
import './LightSource.css';
import { cn } from '@/util';

type LightSourceProps = {
  intensity: 'bright' | 'dim' | 'off';
} & HtmlProps<'div'>;

const LightSource = ({
  intensity,
  className = '',
  ...props
}: Readonly<LightSourceProps>) => {
  useEffect(() => {
    document.documentElement.style.setProperty('--light-state', 'running');
  }, []);

  const intensityClass =
    intensity === 'bright' ? 'light-source-bright' : 'light-source-dim';

  if (intensity === 'off') return <></>;

  return (
    <div
      className={cn('light-source', intensityClass, className)}
      {...props}
    ></div>
  );
};

export default LightSource;
