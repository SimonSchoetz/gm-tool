import Input from '@/components/Input';
import {
  ContentContainer,
  FormWrapper,
  GlassPanel,
} from '@/components/wrapper';
import { submitSignUp } from '@/actions/formSubmits';
import { ValidatorName } from '@/validators/util';
import AppLink, { AppLinkLayout } from '@/components/AppLink';
import { Route } from '@/enums';
import { NextPage } from 'next';

const SignUpPage: NextPage = () => {
  const title = 'Sign Up';

  return (
    <ContentContainer title={title}>
      <GlassPanel>
        <div className='text-center my-5'>
          <p>Please fill in your data to create an account.</p>
          <p>
            Already got one?{' '}
            <AppLink
              title='Login &rarr;'
              href={Route.LOGIN}
              layout={AppLinkLayout.LINK}
            />
          </p>
        </div>

        <FormWrapper
          schemaName={ValidatorName.SIGN_UP}
          submitAction={submitSignUp}
          buttonLabel='Sign Up'
        >
          <Input
            name='userName'
            id='userName'
            placeholder='User name'
            label='User name'
            type='text'
          />
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
          <Input
            name='confirmPassword'
            id='confirmPassword'
            placeholder='Confirm password'
            label='Confirm password'
            type='password'
            required
          />
        </FormWrapper>
      </GlassPanel>
    </ContentContainer>
  );
};

export default SignUpPage;
