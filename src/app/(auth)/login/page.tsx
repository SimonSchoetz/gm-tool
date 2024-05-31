'use client';

import Input from '@/components/Input';
import { MaxWidthWrapper } from '@/components/wrapper';
import FormWrapper from '@/components/wrapper/FormWrapper';
import { LoginRequestData } from '@/types/requests';
import { LoginResponse } from '@/types/responses';
import { MappedPrototype, assertIsMappedDto } from '@/util';
import { makePost } from '@/util/api';
import { mapFormDataToDto } from '@/util/mapper';

const reqPrototype: MappedPrototype<LoginRequestData> = {
  email: { required: true, type: 'string' },
};

export default function NewAdventurePage() {
  const handleSubmit = async (data: FormData) => {
    const reqData = mapFormDataToDto<LoginRequestData>(data);

    assertIsMappedDto<LoginRequestData>(reqData, reqPrototype);

    makePost<LoginRequestData, LoginResponse>('/login/api', reqData).then(
      (res) => {
        console.log('Login Try', res);
      }
    );
  };

  return (
    <>
      <MaxWidthWrapper>
        <h2 className='text-center'>Welcome Back!</h2>
        <p className='text-center my-5'>Please enter your Email to proceed</p>
        <FormWrapper
          onSubmit={(data) => handleSubmit(data)}
          buttonLabel='Login'
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
        </FormWrapper>
      </MaxWidthWrapper>
    </>
  );
}
