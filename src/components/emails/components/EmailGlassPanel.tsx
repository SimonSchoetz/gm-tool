import { FCProps } from '@/types/app';
import { PropsWithChildren } from 'react';
import { glassFX, lightSourceDim } from '../styles';

const EmailGlassPanel: FCProps<PropsWithChildren> = ({
  children,
  ...props
}) => {
  return (
    <div
      {...props}
      style={{
        ...glassFX,
        ...lightSourceDim,
        borderRadius: '0.125rem',
        padding: ' 0 1rem 1rem',
        maxWidth: '28rem',
        width: '100%',
        margin: '0 auto',
      }}
    >
      {children}
    </div>
  );
};

export default EmailGlassPanel;
