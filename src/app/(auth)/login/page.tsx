import Input from '@/components/Input';
import { MaxWidthWrapper, FormWrapper } from '@/components/wrapper';
import { submitLogin } from '@/actions/formSubmits';
import { SchemaName } from '@/schemas/util';
import { generateToken } from '@/actions/token';

export default function LoginPage() {
  return (
    <MaxWidthWrapper>
      <h2 className='text-center'>Welcome Back!</h2>
      <p className='text-center my-5'>
        Please enter your email and password to proceed
      </p>
      <FormWrapper
        schemaName={SchemaName.LOGIN}
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
          autoFocus
        />
        <Input
          name='password'
          id='password'
          placeholder='Password'
          label='Password'
          type='password'
        />
      </FormWrapper>
    </MaxWidthWrapper>
  );
}
