'use client';

import Input from '@/components/Input';
import FormWrapper from '@/components/wrapper/FormWrapper';
import { createNewAdventure } from './util';
import { useRouter } from 'next/navigation';

export default function NewAdventurePage() {
  const router = useRouter();
  return (
    <>
      <h2 className='text-center'>Create a new adventure!</h2>
      <p>How do you want to call your new adventure?</p>
      <FormWrapper
        onSubmit={(data) => createNewAdventure(data, router)}
        buttonLabel='Create adventure'
      >
        <Input
          name={'name'}
          id='name'
          placeholder='Adventure Name'
          label='Adventure Name'
          type='text'
          required
        />
      </FormWrapper>
    </>
  );
}
