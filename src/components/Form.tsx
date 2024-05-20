import { useEffect, useState } from 'react';
import Input, { InputProps } from './Input';
import Button from './Button';

export type FormInputFields = Omit<InputProps, 'onChange'> & {
  name: string;
};

export type FormProps<T> = {
  formInputFields: T;
  formSubmit: (formData: { [key: string]: string }) => any;
};

const Form = ({
  formInputFields,
  formSubmit,
}: FormProps<FormInputFields[]>) => {
  const [formData, setFormData] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const formDataInit =
      formInputFields?.reduce((acc, inputField) => {
        return { ...acc, [inputField.name]: inputField.value };
      }, {}) || {};
    setFormData(formDataInit);
  }, [formInputFields]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    formSubmit(formData);
  };

  const getMappedInputs = (): React.ReactNode => (
    <>
      {formInputFields.map((field) => (
        <Input
          key={field.name}
          {...field}
          value={formData[field.name]}
          onChange={(value) =>
            setFormData({ ...formData, [field.name]: value })
          }
        />
      ))}
    </>
  );

  const hasValidFormData = Object.keys(formData).length;

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
      {hasValidFormData ? getMappedInputs() : null}
      <Button type='submit' label='Create Account' />
    </form>
  );
};

export default Form;
