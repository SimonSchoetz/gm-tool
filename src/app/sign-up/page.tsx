'use client';

import Form, { FormInputFields } from '@/components/Form';

export default function RegistrationPage() {
  const onSubmit = (data: any): void => {
    console.log(data);
  };

  return (
    <>
      <h2 className='text-center'>Create a new account</h2>
      <p>Please enter your email and the name you want to be displayed with:</p>
      <Form formSubmit={onSubmit} formInputFields={formInputFields} />
    </>
  );
}

const formInputFields: FormInputFields[] = [
  {
    name: 'email',
    label: 'Email',
    placeholder: 'Email',
    type: 'email',
    value: '',
  },
  {
    name: 'displayName',
    label: 'Display Name',
    placeholder: 'Display Name',
    type: 'text',
    value: '',
  },
];
