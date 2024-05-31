'use client';

import Input from '@/components/Input';
import { MaxWidthWrapper } from '@/components/wrapper';
import FormWrapper from '@/components/wrapper/FormWrapper';
import { SignUpRequestData } from '@/types/requests';
import { SignUpResponse } from '@/types/responses';
import { MappedPrototype, assertIsMappedDto } from '@/util';
import { makePost } from '@/util/api';
import { mapFormDataToDto } from '@/util/mapper';

const reqPrototype: MappedPrototype<SignUpRequestData> = {
  email: { required: true, type: 'string' },
  displayName: { required: true, type: 'string' },
  createdAt: { required: true, type: 'string' },
};

export default function SignUpPage() {
  const handleSubmit = async (data: FormData) => {
    const reqData = mapFormDataToDto<SignUpRequestData>(data);

    reqData.createdAt = new Date().toISOString();

    assertIsMappedDto<SignUpRequestData>(reqData, reqPrototype);

    makePost<SignUpRequestData, SignUpResponse>('/sign-up/api', reqData).then(
      (res) => {
        console.log('SignUp Try', res);
      }
    );
  };

  return (
    <MaxWidthWrapper>
      <h2 className='text-center'>Sign Up!</h2>
      <p className='text-center my-5'>
        Please enter your date to create an account
      </p>
      <FormWrapper
        onSubmit={(data) => handleSubmit(data)}
        buttonLabel='Sign Up'
      >
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
