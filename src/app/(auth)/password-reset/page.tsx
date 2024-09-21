import { ConditionWrapper, ContentContainer } from '@/components/wrapper';
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
      <ConditionWrapper condition={!token}>
        <RequestPasswordResetTokenEmailForm />
      </ConditionWrapper>
    </ContentContainer>
  );
};

export default PasswordResetPage;
