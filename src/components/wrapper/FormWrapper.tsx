'use client';

import {
  DetailedHTMLProps,
  FormHTMLAttributes,
  PropsWithChildren,
  useEffect,
  useState,
} from 'react';
import Button from '../Button';
import { useFormState } from 'react-dom';
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
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if ('error' in state) {
      setHasError(true);
    }
  }, [state]);

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
    <form
      action={formAction}
      onChange={() => setHasError(false)}
      className='flex flex-col gap-2'
    >
      {React.Children.map(children, (child: React.ReactNode) =>
        mapErrorToChildProps(child)
      )}

      <Button
        classNames='mt-4'
        type='submit'
        label={buttonLabel}
        disabled={hasError}
      />
    </form>
  );
};

export default FormWrapper;
