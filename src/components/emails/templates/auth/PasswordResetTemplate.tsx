import * as React from 'react';
import { Html, Head, Heading } from '@react-email/components';
import { parsedEnv } from '@/util/helper';
import { Route } from '@/enums';
import { FCProps } from '@/types/app';
import EmailBodyWrapper from '../../components/EmailBodyWrapper';
import EmailButton from '../../components/EmailButton';
import EmailGlassPanel from '../../components/EmailGlassPanel';

type PasswordResetTemplateProps = {
  token: string;
};

export const PasswordResetTemplate: FCProps<PasswordResetTemplateProps> = ({
  token,
}) => {
  const url = `${parsedEnv.HOST}${Route.PASSWORD_RESET}?token=${token}`;

  return (
    <Html lang='en' dir='ltr'>
      <Head>
        <title>Password reset</title>
        <Heading>Password reset</Heading>
      </Head>
      <EmailBodyWrapper>
        <EmailGlassPanel>
          <h2>Almost done!</h2>

          <p>
            Please click the button below to continue with your password reset
          </p>

          <EmailButton label='Reset password' url={url} />

          <p>
            If you did not request a password reset, please ignore this email
            and your password will stay the same.
          </p>
        </EmailGlassPanel>
      </EmailBodyWrapper>
    </Html>
  );
};
