import {
  ConditionWrapper,
  ContentContainer,
  GlassPanel,
} from '@/components/wrapper';
import { NextPage } from 'next';
import RequestPasswordResetTokenEmailForm from './request-password-reset-token-email-form';
import NewPasswordForm from './new-password-form';
import { isString } from '@/util/type-guards';

interface PasswordResetPageProps {
  searchParams: URLSearchParams;
}

const PasswordResetPage: NextPage<PasswordResetPageProps> = async ({
  searchParams,
}) => {
  const title = 'Password reset';
  const token = 'token' in searchParams && searchParams.token;

  return (
    <ContentContainer title={title}>
      <GlassPanel>
        <ConditionWrapper condition={!token}>
          <RequestPasswordResetTokenEmailForm />
        </ConditionWrapper>

        <ConditionWrapper condition={isString(token)}>
          <NewPasswordForm token={token as string} />
        </ConditionWrapper>
      </GlassPanel>
    </ContentContainer>
  );
};

export default PasswordResetPage;
