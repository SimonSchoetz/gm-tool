'use client';

import { submitNewPassword } from '@/actions/auth';
import Input from '@/components/Input';
import { FormWrapper } from '@/components/wrapper';
import { FCProps } from '@/types/app';
import { ValidatorName } from '@/validators/util';

type Props = { token: string };

const NewPasswordForm: FCProps<Props> = ({ token }) => {
  return (
    <FormWrapper
      schemaName={ValidatorName.NEW_PASSWORD}
      submitAction={submitNewPassword}
      buttonLabel='Reset password'
      additionalFormData={{ token }}
    >
      <Input
        name='password'
        id='password'
        placeholder='Password'
        label='Password'
        type='password'
        required
      />
      <Input
        name='confirmPassword'
        id='confirmPassword'
        placeholder='Confirm password'
        label='Confirm password'
        type='password'
        required
      />
    </FormWrapper>
  );
};

export default NewPasswordForm;
