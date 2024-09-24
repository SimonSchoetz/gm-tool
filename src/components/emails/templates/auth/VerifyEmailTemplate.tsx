import * as React from 'react';
import { Html, Head, Heading } from '@react-email/components';
import { parsedEnv } from '@/util/helper';
import { Route } from '@/enums';
import { FCProps } from '@/types/app';
import EmailBodyWrapper from '../../components/EmailBodyWrapper';
import EmailButton from '../../components/EmailButton';
import EmailGlassPanel from '../../components/EmailGlassPanel';

type VerifyEmailTemplateProps = {
  token: string;
};

export const VerifyEmailTemplate: FCProps<VerifyEmailTemplateProps> = ({
  token,
}) => {
  const url = `${parsedEnv.HOST}${Route.VERIFY_EMAIL}?token=${token}`;

  return (
    <Html lang='en' dir='ltr'>
      <Head>
        <title>Verify email</title>
        <Heading>Verify email</Heading>
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
