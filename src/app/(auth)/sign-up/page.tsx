import Input from '@/components/Input';
import {
  ContentContainer,
  FormWrapper,
  GlassPanel,
} from '@/components/wrapper';
import { submitSignUp } from '@/actions/formSubmits';
import { ValidatorName } from '@/validators/util';
import { generateToken } from '@/actions/token';

export default function SignUpPage() {
  const title = 'Sign Up';

  return (
    <ContentContainer title={title}>
      <GlassPanel>
        <p className='text-center my-5'>
          Please fill in your data to create an account
        </p>

        <FormWrapper
          schemaName={ValidatorName.SIGN_UP}
          submitAction={submitSignUp}
          buttonLabel='Sign Up'
          encrypt={generateToken}
        >
          <Input
            name='email'
            id='email'
            placeholder='Email'
            label='Email'
            type='email'
          />
          <Input
            name='password'
            id='password'
            placeholder='Password'
            label='Password'
            type='password'
          />
          <Input
            name='confirmPassword'
            id='confirmPassword'
            placeholder='Confirm password'
            label='Confirm password'
            type='password'
          />
        </FormWrapper>
      </GlassPanel>
    </ContentContainer>
  );
}
