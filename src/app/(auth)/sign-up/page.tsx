import Input from '@/components/Input';
import { MaxWidthWrapper, FormWrapper } from '@/components/wrapper';

import { submitSignUp } from '@/actions/formSubmits';
import { SchemaName } from '@/schemas/util';

export default function SignUpPage() {
  return (
    <MaxWidthWrapper>
      <h2 className='text-center'>Sign Up!</h2>
      <p className='text-center my-5'>
        Please fill in your data to create an account
      </p>
      <FormWrapper
        schemaName={SchemaName.SIGN_UP}
        submitAction={submitSignUp}
        buttonLabel='Sign Up'
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
    </MaxWidthWrapper>
  );
}
