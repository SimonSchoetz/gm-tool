import { DivProps } from '@/types/htmlProps';
import { useEffect } from 'react';
import './LightSource.css';

type LightSourceProps = {
  intensity: 'bright' | 'dim';
} & DivProps;

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

  return (
    <div
      className={`light-source ${intensityClass} ${className}`}
      {...props}
    ></div>
  );
};

export default LightSource;
