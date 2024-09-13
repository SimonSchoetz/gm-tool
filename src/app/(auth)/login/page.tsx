import Input from '@/components/Input';
import { FormWrapper, GlassPanel } from '@/components/wrapper';
import { submitLogin } from '@/actions/formSubmits';
import { SchemaName } from '@/schemas/util';
import { generateToken } from '@/actions/token';
import { InputLabelUnderline } from '@/components/animations';

export default function LoginPage() {
  const title = 'Login';

  return (
    <>
      <div className='mb-2 ml-8'>
        <h2>{title}</h2>
        <InputLabelUnderline focused={true} text={title} textSize='text-4xl' />
      </div>

      <GlassPanel>
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
    </>
  );
}
