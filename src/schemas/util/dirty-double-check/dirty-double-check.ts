import React from 'react';
import { SchemaName } from '../get-schema/get-schema';
import { getKeysFromZodSchema } from '../get-keys-from-zod-schema/get-keys-from-zod-schema';

export const dirtyDoubleCheck = (
  children: React.ReactNode,
  schemaName: SchemaName
) => {
  if (!Array.isArray(children)) return;
  const childrenIds = children?.map(
    // @ts-ignore
    (child) => React.isValidElement(child) && child?.props?.id
  );
  const schemaKeys = getKeysFromZodSchema(schemaName);

  if (!schemaKeys?.every((key) => childrenIds?.includes(key))) {
    // show missing inputs in console
    console.warn(
      'Missing inputs:',
      schemaKeys.filter((key) => !childrenIds.includes(key))
    );
  }
};
