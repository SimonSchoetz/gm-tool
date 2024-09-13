import * as React from 'react';
import { Html, Button, Head, Body } from '@react-email/components';
import { parsedEnv } from '@/util/helper';
import { Route } from '@/enums';

type VerifyEmailTemplateProps = {
  token: string;
};

export const VerifyEmail: React.FC<Readonly<VerifyEmailTemplateProps>> = ({
  token,
}) => {
  const url = `${parsedEnv.HOST}${Route.VERIFY_EMAIL}?token=${token}`;

  return (
    <Html lang='en' dir='ltr'>
      <Head>
        <title>Verify email</title>
      </Head>
      <Body
        style={{
          ...blueprintGridPrimaryStyle,
          color: colors.fg.full,
          backgroundColor: colors.bg.full,
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

const colors = {
  fg: {
    full: '#f8fbfb',
    '20': '#f8fbfb33',
  },
  bg: {
    full: '#031322',
    '30': '#0313224d',
  },
  primary: {
    '01': '#399cbb01',
    '10': '#399cbb1a',
    '30': '#399cbb4d',
  },
};

const glassFX: React.CSSProperties = {
  backgroundColor: colors.primary['01'],
  border: `1px solid ${colors.fg['20']}`,
  borderBottomColor: colors.primary['01'],
  borderRightColor: colors.primary['01'],
  boxShadow: `0px 0px 2px 1px ${colors.bg['30']} inset`,
  backdropFilter: 'blur(2px)',
  filter: `drop-shadow(0 0 1rem ${colors.fg.full})`,
  color: colors.fg.full,
};

const gradientStops = `transparent 24%, ${colors.primary['10']} 25%, transparent 25%, transparent 74%, ${colors.primary['30']} 75%, transparent 75%`;

const blueprintGridPrimaryStyle: React.CSSProperties = {
  backgroundImage: `linear-gradient(0deg, ${gradientStops}), linear-gradient(90deg, ${gradientStops})`,
  backgroundSize: '100px 100px',
};

const lightSource: React.CSSProperties = {
  background: `linear-gradient(to bottom right, ${colors.primary['30']}, transparent)`,
};

const lightSourceDim: React.CSSProperties = {
  background: `linear-gradient(to bottom right, ${colors.primary['10']}, transparent)`,
};
