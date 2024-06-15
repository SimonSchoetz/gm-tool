'use client';

import React, {
  DetailedHTMLProps,
  FormHTMLAttributes,
  PropsWithChildren,
} from 'react';
import Button from '../Button';
import { FieldValues, useForm } from 'react-hook-form';
import { z } from 'zod';
import { SchemaName, getKeysFromZodSchema, getSchema } from '@/schemas/util';
import { zodResolver } from '@hookform/resolvers/zod';
import { isString } from '@/util/type-guards';
import { FormSubmitResponse } from '@/types/responses';

type FormWrapperProps = DetailedHTMLProps<
  FormHTMLAttributes<HTMLFormElement>,
  HTMLFormElement
> & {
  buttonLabel: string;
  schemaName: SchemaName;
  submitAction: (formData: unknown) => Promise<FormSubmitResponse>;
};

type ReactChild =
  | React.ReactPortal
  | React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;

const FormWrapper = ({
  buttonLabel,
  schemaName,
  submitAction,
  children,
}: PropsWithChildren<FormWrapperProps>) => {
  const schemaInstance = getSchema(schemaName);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<z.infer<typeof schemaInstance>>({
    resolver: zodResolver(schemaInstance),
  });

  const mapChildren = (child: React.ReactNode) => {
    if (React.isValidElement(child)) {
      const schemaKeys = getKeysFromZodSchema(schemaName);
      const childId: unknown = child?.props?.id;

      if (isString(childId) && schemaKeys?.includes(childId)) {
        return mapFormValidationProps(child, childId);
      }
    }

    return child;
  };

  const mapFormValidationProps = (child: ReactChild, childId: string) => {
    return {
      ...child,
      props: {
        ...child.props,
        ...register(childId),
        validationError: errors[childId]?.message,
      },
    };
  };

  const onSubmit = async (values: FieldValues): Promise<void> => {
    const res = await submitAction(values);
    if ('error' in res) {
      handleServerErrors(res.error);
    }
    // TODO: handle success
  };
  const handleServerErrors = (errors: FormSubmitResponse['error']): void => {
    if (!errors) return;

    Object.keys(errors).forEach((key) => {
      setError(key, {
        message: errors[key],
        type: 'custom',
      });
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-2'>
      {React.Children.map(children, (child: React.ReactNode) =>
        mapChildren(child)
      )}

      <Button
        classNames='mt-4'
        type='submit'
        label={buttonLabel}
        disabled={!!Object.keys(errors).length}
        isLoading={isSubmitting}
      />
    </form>
  );
};

export default FormWrapper;
