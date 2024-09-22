import {
  ConditionWrapper,
  ContentContainer,
  GlassPanel,
} from '@/components/wrapper';
import { NextPage } from 'next';
import RequestPasswordResetTokenEmailForm from './request-password-reset-token-email-form';

interface PasswordResetPageProps {
  searchParams: URLSearchParams;
}

const PasswordResetPage: NextPage<PasswordResetPageProps> = ({
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
      </GlassPanel>
    </ContentContainer>
  );
};

export default PasswordResetPage;
