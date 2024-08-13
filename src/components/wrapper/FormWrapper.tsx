'use client';

import React, {
  DetailedHTMLProps,
  FormHTMLAttributes,
  PropsWithChildren,
  useEffect,
} from 'react';
import Button from '../Button';
import { FieldValues, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  SchemaName,
  dirtyDoubleCheck,
  getKeysFromZodSchema,
  getSchema,
} from '@/schemas/util';
import { zodResolver } from '@hookform/resolvers/zod';
import { isString } from '@/util/type-guards';
import { FormSubmitResponse } from '@/types/responses';
import { TokenPayload } from '@/actions/token';
import { useRouter } from 'next/navigation';
import { assertIsString } from '@/util/asserts';
import { isInDevMode } from '@/util/helper';

type FormWrapperProps = DetailedHTMLProps<
  FormHTMLAttributes<HTMLFormElement>,
  HTMLFormElement
> & {
  buttonLabel: string;
  schemaName: SchemaName;
  submitAction: (data: unknown) => Promise<FormSubmitResponse>;
  encrypt?: (data: TokenPayload, lifeSpan: string) => Promise<string>;
};

type ReactChild =
  | React.ReactPortal
  | React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;

const FormWrapper = ({
  buttonLabel,
  schemaName,
  submitAction,
  children,
  encrypt,
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
  const router = useRouter();

  const mapChild = (child: React.ReactNode) => {
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
    let data: FieldValues | string = values;
    if (encrypt) {
      data = await encrypt(values, '1s');
    }
    const res = await submitAction(data);

    if (res?.error) {
      handleServerErrors(res.error);
    }
    if (res?.redirectRoute) {
      handleRedirect(res.redirectRoute);
    }
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

  const handleRedirect = (
    redirectRoute: FormSubmitResponse['redirectRoute']
  ): void => {
    assertIsString(redirectRoute);
    router.push(redirectRoute);
  };

  useEffect(() => {
    if (isInDevMode()) {
      dirtyDoubleCheck(children, schemaName);
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-2'>
      {React.Children.map(children, (child) => mapChild(child))}

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
