import React from 'react';
import { SchemaName } from '../get-schema/get-schema';
import { getKeysFromZodSchema } from '../get-keys-from-zod-schema/get-keys-from-zod-schema';

export const assertFormInputs = (
  children: React.ReactNode,
  schemaName: SchemaName
) => {
  if (typeof children === 'undefined') return;

  const childrenIds = [children]
    .flat()
    .map((child) => React.isValidElement(child) && child?.props?.id);

  const schemaKeys = getKeysFromZodSchema(schemaName);

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
