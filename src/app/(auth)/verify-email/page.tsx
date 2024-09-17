import {
  ConditionWrapper,
  ContentContainer,
  GlassPanel,
} from '@/components/wrapper';
import VerifyToken from './verify-token';
import RequestNewVerificationEmailForm from './request-new-verification-email-form';
import { isString } from '@/util/type-guards';

interface VerifyEmailPageProps {
  searchParams: URLSearchParams;
}

const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ searchParams }) => {
  const title = 'Verify email';
  const token = 'token' in searchParams && searchParams.token;

  return (
    <ContentContainer title={title}>
      <GlassPanel>
        <ConditionWrapper condition={isString(token)}>
          <VerifyToken token={token as string} />
        </ConditionWrapper>

        <ConditionWrapper condition={!token}>
          <p className='text-center my-5'>
            We sent you a verification email on registration. To the ADHD gang:
            It&apos;s just a button but be warned: it will expire in one day so
            don&apos;t get too distracted!
          </p>

          <p className='text-center my-5'>
            You can&apos;t find any? Not even in your spam folder? You can try
            again and enter your email below. If an account with your email
            exists, we will send you a new one.
          </p>

          <RequestNewVerificationEmailForm />
        </ConditionWrapper>
      </GlassPanel>
    </ContentContainer>
  );
};

export default VerifyEmailPage;
