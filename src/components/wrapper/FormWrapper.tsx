'use client';

import { PropsWithChildren, useState } from 'react';
import Button from '../Button';

type FormWrapperProps = {
  onSubmit: (formData: FormData) => Promise<string>;
  buttonLabel: string;
};

const FormWrapper = ({
  onSubmit,
  buttonLabel,
  children,
}: PropsWithChildren<FormWrapperProps>) => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setSubmitting(true);
    onSubmit(new FormData(e.currentTarget));
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
      {children}
      <Button type='submit' label={buttonLabel} />
    </form>
  );
};

export default FormWrapper;
