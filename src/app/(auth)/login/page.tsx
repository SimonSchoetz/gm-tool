import Input from '@/components/Input';
import {
  ContentContainer,
  FormWrapper,
  GlassPanel,
} from '@/components/wrapper';
import { submitLogin } from '@/actions/formSubmits';
import { ValidatorName } from '@/validators/util';
import { generateToken } from '@/actions/token';

export default function LoginPage() {
  const title = 'Login';

  return (
    <ContentContainer title={title}>
      <GlassPanel>
        <p className='text-center my-5'>
          Please enter your email and password to proceed
        </p>

        <FormWrapper
          schemaName={ValidatorName.LOGIN}
          submitAction={submitLogin}
          buttonLabel='Login'
          encrypt={generateToken}
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
          />
        </FormWrapper>
      </GlassPanel>
    </ContentContainer>
  );
}
