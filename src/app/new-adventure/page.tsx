'use client';

import Input from '@/components/Input';
import FormWrapper from '@/components/wrapper/FormWrapper';

export default function NewAdventurePage() {
  const onSubmit = async (data: FormData): Promise<string> => {
    console.log('>>>>>>>>> | onSubmit | data:', data.get('name'));
    // await fetch('/sign-up/api', {
    //   method: 'POST',
    //   body: JSON.stringify(data),
    // })
    //   .then((response) => response.json())
    //   .then((data) => {
    //     // Use the data here
    //     console.log(data);
    //   })
    //   .catch((error) => {
    //     // Handle the error here
    //     console.error('Error:', error);
    //     return 'error';
    //   });
    return 'success';
  };

  return (
    <>
      <h2 className='text-center'>Create a new adventure!</h2>
      <p>How do you want to call your new adventure??</p>
      <FormWrapper onSubmit={onSubmit} buttonLabel='Create adventure'>
        <Input
          name={'name'}
          id='name'
          placeholder='Adventure Name'
          label='Adventure Name'
        />
      </FormWrapper>
    </>
  );
}
