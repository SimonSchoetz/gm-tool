'use client';

import Input from '@/components/Input';
import FormWrapper from '@/components/wrapper/FormWrapper';
import { mapFormDataToDto } from '@/util/mapper';
import { assertIsNewAdventureRequestData } from './util';
import { createAdventure } from './api';

export default function NewAdventurePage() {
  const handleSubmit = async (data: FormData) => {
    const reqData = mapFormDataToDto(data);
    assertIsNewAdventureRequestData(reqData);
    await createAdventure(reqData).then((res) => {
      //go to adventure page
      console.log('New adventure created:', res);
    });
  };

  return (
    <>
      <h2 className='text-center'>Create a new adventure!</h2>
      <p>How do you want to call your new adventure?</p>
      <FormWrapper
        onSubmit={(data) => handleSubmit(data)}
        buttonLabel='Create adventure'
      >
        <Input
          name={'name'}
          id='name'
          placeholder='Adventure Name'
          label='Adventure Name'
          type='text'
          required
          autoFocus
        />
        <Input
          name={'test'}
          id='test'
          placeholder='Test'
          label='Test'
          type='text'
        />
        <Input
          name={'description'}
          id='description'
          placeholder='Description'
          label='Description'
          type='text'
        />
      </FormWrapper>
    </>
  );
}
