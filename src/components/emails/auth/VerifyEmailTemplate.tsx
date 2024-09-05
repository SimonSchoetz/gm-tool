import * as React from 'react';
import { Html, Button, Head, Body } from '@react-email/components';
import { parsedEnv } from '@/util/helper';
import { colors } from '@/util/styles';

type VerifyEmailTemplateProps = {
  token: string;
};

export const VerifyEmail: React.FC<Readonly<VerifyEmailTemplateProps>> = ({
  token,
}) => {
  const url = `${parsedEnv.HOST}/verify-email?token=${token}`;
  return (
    <Html lang='en' dir='ltr'>
      <Head>
        <title>Verify email</title>
      </Head>
      <Body
        style={{
          ...blueprintGridPrimaryStyle,
          color: '#f8fbfb',
          backgroundColor: '#031322',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            ...lightSource,
            padding: '2rem',
            display: 'flex',
          }}
        >
          <div
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
            <h2>Almost done!</h2>
            <p>Please click the button below to verify your email</p>

            <Button
              style={{
                ...glassFX,
                borderRadius: '.75rem',
                padding: '.5rem 1rem',
              }}
              href={url}
            >
              Verify Email
            </Button>
          </div>
        </div>
      </Body>
    </Html>
  );
};

const glassFX: React.CSSProperties = {
  backgroundColor: colors.accent['01'],
  border: '1px solid #f8fbfb33',
  borderBottomColor: colors.accent['01'],
  borderRightColor: colors.accent['01'],
  boxShadow: '0px 0px 2px 1px #0313224d inset',
  backdropFilter: 'blur(2px)',
  filter: 'drop-shadow(0 0 1rem #f8fbfb)',
  color: colors.bright.full,
};

const gradientStops = `transparent 24%, ${colors.accent['10']} 25%, transparent 25%, transparent 74%, ${colors.accent['30']} 75%, transparent 75%`;

const blueprintGridPrimaryStyle: React.CSSProperties = {
  backgroundImage: `linear-gradient(0deg, ${gradientStops}), linear-gradient(90deg, ${gradientStops})`,
  backgroundSize: '100px 100px',
};

const lightSource: React.CSSProperties = {
  background: `linear-gradient(to bottom right, ${colors.accent['30']}, transparent)`,
};

const lightSourceDim: React.CSSProperties = {
  background: `linear-gradient(to bottom right, ${colors.accent['10']}, transparent)`,
};
