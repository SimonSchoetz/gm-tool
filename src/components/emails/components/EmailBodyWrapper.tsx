import { FCProps } from '@/types/app';
import { Body } from '@react-email/components';
import { PropsWithChildren } from 'react';
import { emailColors as colors, lightSource } from './styles';

const BodyWrapper: FCProps<PropsWithChildren> = ({ children, ...props }) => {
  return (
    <Body
      style={{
        ...blueprintGridPrimaryStyle,
        color: colors.fg.full,
        backgroundColor: colors.bg.full,
        textAlign: 'center',
      }}
      {...props}
    >
      <div
        style={{
          ...lightSource,
          padding: '2rem',
          display: 'flex',
        }}
      >
        {children}
      </div>
    </Body>
  );
};

export default BodyWrapper;

const gradientStops = `transparent 24%, ${colors.primary['10']} 25%, transparent 25%, transparent 74%, ${colors.primary['30']} 75%, transparent 75%`;

const blueprintGridPrimaryStyle: React.CSSProperties = {
  backgroundImage: `linear-gradient(0deg, ${gradientStops}), linear-gradient(90deg, ${gradientStops})`,
  backgroundSize: '100px 100px',
};
