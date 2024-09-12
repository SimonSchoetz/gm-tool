import Input from '@/components/Input';
import { FormWrapper } from '@/components/wrapper';

import { submitSignUp } from '@/actions/formSubmits';
import { SchemaName } from '@/schemas/util';
import { generateToken } from '@/actions/token';
import { InputLabelUnderline } from '@/components/animations';

export default function SignUpPage() {
  const title = 'Sign Up';

  return (
    <>
      <div className='mb-2 ml-8'>
        <h2>{title}</h2>
        <InputLabelUnderline focused={true} text={title} textSize='text-4xl' />
      </div>
      <div
        className='light-source-dim'
        //todo: make light-source a wrapper component that animates the light in in the same speed as the underline animation
      >
        <div className='glass-fx p-8 pb-12'>
          <p className='text-center my-5'>
            Please fill in your data to create an account
          </p>
          <FormWrapper
            schemaName={SchemaName.SIGN_UP}
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
        </div>
      </div>
    </>
  );
}
