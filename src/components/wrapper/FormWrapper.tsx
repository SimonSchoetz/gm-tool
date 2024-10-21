'use client';

import React, {
  DetailedHTMLProps,
  FormHTMLAttributes,
  PropsWithChildren,
  useEffect,
  useState,
} from 'react';
import Button from '../Button';
import { FieldValues, useForm } from 'react-hook-form';
import {
  ValidatorName,
  assertFormShape,
  getKeysFromZodValidator,
  getFormDataValidator,
} from '@/validators/util';
import { zodResolver } from '@hookform/resolvers/zod';
import { isString } from '@/util/type-guards';
import { FormSubmitResponse } from '@/types/app';
import { TokenPayload, TokenLifeSpan } from '@/types/actions';
import { useRouter } from 'next/navigation';
import { assertIsString } from '@/util/asserts';
import ConditionWrapper from './ConditionWrapper';
import { generateToken } from '@/actions/token';

type FormWrapperProps = DetailedHTMLProps<
  FormHTMLAttributes<HTMLFormElement>,
  HTMLFormElement
> & {
  buttonLabel: string;
  schemaName: ValidatorName;
  submitAction: (data: unknown) => Promise<FormSubmitResponse>;
  encrypt: (data: TokenPayload, lifeSpan: TokenLifeSpan) => Promise<string>;
  additionalFormData?: Record<string, unknown>;
};

const FormWrapper = ({
  buttonLabel,
  schemaName,
  submitAction,
  children,
  encrypt,
  additionalFormData,
}: PropsWithChildren<FormWrapperProps>) => {
  const [hasRequiredFields, setHasRequiredFields] = useState(false);

  const router = useRouter();

  const validator = getFormDataValidator(schemaName);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(validator),
  });

  const mapChild = (child: React.ReactNode) => {
    if (React.isValidElement(child)) {
      const schemaKeys = getKeysFromZodValidator(schemaName);
      const childId: unknown = child?.props?.id;

      if (isString(childId) && schemaKeys?.includes(childId)) {
        return mapFormValidationProps(child, childId);
      }
    }

    return child;
  };

  const mapFormValidationProps = (child: JSX.Element, childId: string) => {
    const isRequired = child.props.required;

    if (isRequired && !hasRequiredFields) {
      setHasRequiredFields(true);
    }

    return {
      ...child,
      props: {
        ...child.props,
        ...register(childId),
        errorMsg: errors[childId]?.message,
      },
    };
  };

  const onSubmit = async (values: FieldValues): Promise<void> => {
    const data: FieldValues = { ...values, ...additionalFormData };

    const encryptedData = await generateToken({ ...data }, '5s');

    const res = await submitAction(encryptedData);

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
    //eslint-disable-next-line no-process-env
    if (process.env.NODE_ENV === 'development') {
      assertFormShape(
        children,
        schemaName,
        Object.keys(additionalFormData || {})
      );
    }
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className='flex flex-col gap-2'
      aria-live='assertive'
    >
      {React.Children.map(children, (child) => mapChild(child))}

      <ConditionWrapper condition={hasRequiredFields}>
        <p className='ml-4 text-sm text-gm-error'>Required*</p>
      </ConditionWrapper>

      <Button
        className='mt-4'
        type='submit'
        label={buttonLabel}
        disabled={!!Object.keys(errors).length}
        isLoading={isSubmitting}
      />
    </form>
  );
};

export default FormWrapper;
