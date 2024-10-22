import Input from '@/components/Input';
import {
  ContentContainer,
  FormWrapper,
  GlassPanel,
} from '@/components/wrapper';
import { submitLogin } from '@/actions/auth';
import { ValidatorName } from '@/validators/util';
import AppLink, { AppLinkLayout } from '@/components/AppLink';
import { Route } from '@/enums';
import { NextPage } from 'next';

const LoginPage: NextPage = () => {
  const title = 'Login';

  return (
    <ContentContainer title={title}>
      <GlassPanel>
        <div className='text-center my-5'>
          <p>Please enter your email and password to proceed.</p>
          <p>
            Or{' '}
            <AppLink
              title='create an account &rarr;'
              href={Route.SIGN_UP}
              layout={AppLinkLayout.LINK}
            />
          </p>
        </div>

        <FormWrapper
          schemaName={ValidatorName.LOGIN}
          submitAction={submitLogin}
          buttonLabel='Login'
        >
          <Input
            name='email'
            id='email'
            placeholder='Email'
            label='Email'
            type='email'
            required
          />

          <Input
            name='password'
            id='password'
            placeholder='Password'
            label='Password'
            type='password'
            required
          />
        </FormWrapper>

        <AppLink
          className='mt-10'
          title='Password reset'
          href={Route.PASSWORD_RESET}
          layout={AppLinkLayout.LINK}
        />
      </GlassPanel>
    </ContentContainer>
  );
};

export default LoginPage;
