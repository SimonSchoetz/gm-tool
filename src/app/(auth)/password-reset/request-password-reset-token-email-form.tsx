import { submitRequestPasswordResetEmail } from '@/actions/formSubmits';
import { generateToken } from '@/actions/token';
import Input from '@/components/Input';
import { FormWrapper } from '@/components/wrapper';
import { FCProps } from '@/types/app';
import { ValidatorName } from '@/validators/util';

const RequestPasswordResetTokenEmailForm: FCProps = () => {
  return (
    <FormWrapper
      schemaName={ValidatorName.PASSWORD_RESET_EMAIL}
      submitAction={submitRequestPasswordResetEmail}
      buttonLabel='Get password reset token'
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
    </FormWrapper>
  );
};

export default RequestPasswordResetTokenEmailForm;
