import { submitPasswordReset } from '@/actions/formSubmits';
import { generateToken } from '@/actions/token';
import Input from '@/components/Input';
import { GlassPanel, FormWrapper } from '@/components/wrapper';
import { FCProps } from '@/types/app';
import { ValidatorName } from '@/validators/util';

const RequestPasswordResetTokenEmailForm: FCProps = () => {
  return (
    <GlassPanel>
      <FormWrapper
        schemaName={ValidatorName.PASSWORD_RESET}
        submitAction={submitPasswordReset}
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
    </GlassPanel>
  );
};

export default RequestPasswordResetTokenEmailForm;
