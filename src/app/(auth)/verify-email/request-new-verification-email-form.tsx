import { submitRequestNewVerificationEmail } from '@/actions/auth';
import Input from '@/components/Input';
import { FormWrapper } from '@/components/wrapper';
import { ValidatorName } from '@/validators/util';

const RequestNewVerificationEmailForm = () => {
  return (
    <FormWrapper
      schemaName={ValidatorName.VERIFICATION_EMAIL}
      submitAction={submitRequestNewVerificationEmail}
      buttonLabel='Get verification email'
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

export default RequestNewVerificationEmailForm;
