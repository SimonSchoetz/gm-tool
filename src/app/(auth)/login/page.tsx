'use client';

import Input from '@/components/Input';
import FormWrapper from '@/components/wrapper/FormWrapper';
import { makePost } from '@/util/api';
import { mapFormDataToDto } from '@/util/mapper';

export default function NewAdventurePage() {
  const handleSubmit = async (data: FormData) => {
    const reqData = mapFormDataToDto(data);
    console.log('TODO', reqData);

    makePost('/login/api', reqData).then((res) => {
      console.log('Login Try', res);
    });
  };

  return (
    <>
      <h2 className='text-center'>Welcome Back!</h2>
      <p>Please enter your Email to proceed</p>
      <FormWrapper onSubmit={(data) => handleSubmit(data)} buttonLabel='Login'>
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
    </>
  );
}
