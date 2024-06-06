import Input from '@/components/Input';
import { MaxWidthWrapper } from '@/components/wrapper';
import FormWrapper from '@/components/wrapper/FormWrapper';

import { submitLogin } from '@/actions/formSubmits';

export default function LoginPage() {
  return (
    <MaxWidthWrapper>
      <h2 className='text-center'>Welcome Back!</h2>
      <p className='text-center my-5'>Please enter your Email to proceed</p>
      <FormWrapper submitAction={submitLogin} buttonLabel='Login'>
        <Input
          name='email'
          id='email'
          placeholder='Email'
          label='Email'
          type='email'
          required
          autoFocus
        />
      </FormWrapper>
    </MaxWidthWrapper>
  );
}
