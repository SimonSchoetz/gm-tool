import Input from '@/components/Input';
import { MaxWidthWrapper, FormWrapper } from '@/components/wrapper';

import { submitSignUp } from '@/actions/formSubmits';

export default function SignUpPage() {
  return (
    <MaxWidthWrapper>
      <h2 className='text-center'>Sign Up!</h2>
      <p className='text-center my-5'>
        Please enter your date to create an account
      </p>
      <FormWrapper submitAction={submitSignUp} buttonLabel='Sign Up'>
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
          name='displayName'
          id='displayName'
          placeholder='Display Name'
          label='Display Name'
          type='text'
          required
        />
      </FormWrapper>
    </MaxWidthWrapper>
  );
}
