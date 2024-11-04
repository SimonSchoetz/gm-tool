'use client';

import React, {
  DetailedHTMLProps,
  FormHTMLAttributes,
  PropsWithChildren,
  useEffect,
  useState,
  type JSX,
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
import { ServerActionResponse, SubmitData } from '@/types/app';
import { useRouter } from 'next/navigation';
import ConditionWrapper from './ConditionWrapper';

type FormWrapperProps = DetailedHTMLProps<
  FormHTMLAttributes<HTMLFormElement>,
  HTMLFormElement
> & {
  buttonLabel: string;
  schemaName: ValidatorName;
  submitAction: (data: SubmitData) => Promise<ServerActionResponse>;
  additionalFormData?: SubmitData;
};

const FormWrapper = ({
  buttonLabel,
  schemaName,
  submitAction,
  children,
  additionalFormData,
}: PropsWithChildren<FormWrapperProps>) => {
  const [hasRequiredFields, setHasRequiredFields] = useState(false);
  const [message, setMessage] = useState<string>('');

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

      const childId = (child as { props?: { id?: string } })?.props?.id;

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

    const res = await submitAction(data);

    if (res?.error) {
      handleServerErrors(res.error);
    }
    if (res?.redirectRoute) {
      router.push(res.redirectRoute);
    }
    if (res?.message) {
      setMessage(res.message);
    }
  };

  const handleServerErrors = (errors: ServerActionResponse['error']): void => {
    if (!errors) return;

    Object.keys(errors).forEach((key) => {
      setError(key, {
        message: errors[key],
        type: 'custom',
      });
    });
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

      <ConditionWrapper condition={!!message}>
        <p className='ml-4 text-sm'>{message}</p>
      </ConditionWrapper>
    </form>
  );
};

export default FormWrapper;
