import React from 'react';
import { ValidatorName } from '../get-form-data-validator/get-form-data-validator';
import { getKeysFromZodValidator } from '../get-keys-from-zod-schema/get-keys-from-zod-schema';

export const assertFormInputs = (
  children: React.ReactNode,
  schemaName: ValidatorName
) => {
  if (typeof children === 'undefined') return;

  const childrenIds = [children]
    .flat()
    .map((child) => React.isValidElement(child) && child?.props?.id);

  const schemaKeys = getKeysFromZodValidator(schemaName);

  const missingInputs = schemaKeys.filter((key) => !childrenIds.includes(key));
  const extraInputs = childrenIds.filter((id) => !schemaKeys.includes(id));
  const hasDuplicateInputs = childrenIds.some(
    (id, index, self) => self.indexOf(id) !== index
  );

  if (missingInputs.length) {
    throw Error(`Missing inputs according to schema: ${missingInputs}`);
  }
  if (extraInputs.length) {
    throw Error(`Extra inputs not according to schema: ${extraInputs}`);
  }
  if (hasDuplicateInputs) {
    throw Error('Duplicate inputs detected');
  }
};
