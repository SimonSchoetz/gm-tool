'use client';

import Input from '@/components/Input';
import { mapFormDataToDto } from '@/util/mapper';
import { createAdventure } from './api';
import { FormWrapper } from '@/components/wrapper';
import { MappedPrototype, assertIsMappedDto } from '@/util';
import { NewAdventureRequestData } from '@/types/requests';

const requestPrototype: MappedPrototype<NewAdventureRequestData> = {
  name: { required: true, type: 'string' },
  description: { required: false, type: 'string' },
};

export default function NewAdventurePage() {
  const handleSubmit = async (data: FormData) => {
    const reqData = mapFormDataToDto<NewAdventureRequestData>(data);
    assertIsMappedDto<NewAdventureRequestData>(reqData, requestPrototype);
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
