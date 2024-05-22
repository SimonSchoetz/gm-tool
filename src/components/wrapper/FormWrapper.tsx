'use client';

import { PropsWithChildren, useState } from 'react';
import Button from '../Button';
import { useRouter } from 'next/router';

type FormWrapperProps = {
  onSubmit: (formData: FormData) => Promise<void>;
  buttonLabel: string;
};

const FormWrapper = ({
  onSubmit,
  buttonLabel,
  children,
}: PropsWithChildren<FormWrapperProps>) => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(new FormData(e.currentTarget));
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
      {children}
      <Button type='submit' label={buttonLabel} isLoading={submitting} />
    </form>
  );
};

export default FormWrapper;
