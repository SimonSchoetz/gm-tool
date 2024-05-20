'use client';

import { useEffect, useState } from 'react';
import Input, { InputProps } from './Input';

export type FormInputFields = Omit<InputProps, 'onValueChange'> & {
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

  const handleInputChange = (name: string, value: string): void => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    formSubmit(formData);
  };

  const mappedInputs = formInputFields.map((inputField) => (
    <Input
      key={inputField.name}
      {...inputField}
      value={formData[inputField.name]}
      onValueChange={(value) => handleInputChange(inputField.name, value)}
    />
  ));

  return (
    <form onSubmit={handleSubmit}>
      {!!Object.keys(formData).length ? mappedInputs : null}
      <button type='submit'>Submit</button>
    </form>
  );
};

export default Form;
