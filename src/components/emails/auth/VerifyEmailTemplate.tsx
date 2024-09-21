import * as React from 'react';
import { Html, Head } from '@react-email/components';
import { parsedEnv } from '@/util/helper';
import { Route } from '@/enums';
import EmailBodyWrapper from '../components/EmailBodyWrapper';
import EmailGlassPanel from '../components/EmailGlassPanel';
import EmailButton from '../components/EmailButton';

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
      <EmailBodyWrapper>
        <EmailGlassPanel>
          <h2>Almost done!</h2>

          <p>Please click the button below to verify your email</p>

          <EmailButton label='Verify Email' url={url} />
        </EmailGlassPanel>
      </EmailBodyWrapper>
    </Html>
  );
};
