import { submitRequestPasswordResetEmail } from '@/actions/auth';
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
