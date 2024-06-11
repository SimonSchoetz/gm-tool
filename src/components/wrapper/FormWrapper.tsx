'use client';

import {
  DetailedHTMLProps,
  FormHTMLAttributes,
  PropsWithChildren,
} from 'react';
import Button from '../Button';
import { useFormState, useFormStatus } from 'react-dom';
import React from 'react';

type FormWrapperProps = DetailedHTMLProps<
  FormHTMLAttributes<HTMLFormElement>,
  HTMLFormElement
> & {
  buttonLabel: string;
  submitAction: (
    prevState: any,
    formData: unknown
  ) => Promise<
    { message: string } | { error: string | Record<string, string> }
  >;
};

const init = {
  message: '',
};

const FormWrapper = ({
  buttonLabel,
  children,
  submitAction,
}: PropsWithChildren<FormWrapperProps>) => {
  const [state, formAction] = useFormState(submitAction, init);

  const mapErrorToChildProps = (child: React.ReactNode) => {
    const hasChildRelatedError =
      'error' in state && typeof state.error !== 'string';

    if (!React.isValidElement(child) || !hasChildRelatedError) {
      return child;
    }

    const childName = child?.props?.name;

    const validationError = (state.error as Record<string, string>)?.[
      childName
    ];

    return validationError
      ? { ...child, props: { ...child.props, validationError } }
      : child;
  };

  return (
    <form action={formAction} className='flex flex-col gap-2'>
      {React.Children.map(children, (child: React.ReactNode) =>
        mapErrorToChildProps(child)
      )}
      <Button type='submit' label={buttonLabel} />
    </form>
  );
};

export default FormWrapper;
