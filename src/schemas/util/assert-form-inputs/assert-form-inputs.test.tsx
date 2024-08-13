import React from 'react';

import { assertFormInputs, SchemaName } from '@/schemas/util';

describe('assertFormInputs', () => {
  const emailInput = React.createElement('input', { id: 'email' });
  const passwordInput = React.createElement('input', { id: 'password' });
  const exampleSchema = SchemaName.LOGIN;

  it('should not throw an error when inputs are corresponding to schema', () => {
    const children = [emailInput, passwordInput];
    expect(() => assertFormInputs(children, exampleSchema)).not.toThrow();
  });

  it('should throw an error when input is missing', () => {
    const children = [passwordInput];
    expect(() => assertFormInputs(children, exampleSchema)).toThrow(
      'Missing inputs according to schema: email'
    );
  });

  it('should work even if there is only one child (not an array))', () => {
    const children = passwordInput;
    expect(() => assertFormInputs(children, exampleSchema)).toThrow(
      'Missing inputs according to schema: email'
    );
  });

  it('should throw an error when input has unknown children', () => {
    const unknownToSchema = React.createElement('input', {
      id: 'unknownToSchema',
    });
    const children = [emailInput, passwordInput, unknownToSchema];
    expect(() => assertFormInputs(children, exampleSchema)).toThrow(
      'Extra inputs not according to schema: unknownToSchema'
    );
  });

  it('should throw an error when input has children with duplicate ids', () => {
    const children = [emailInput, emailInput, passwordInput];
    expect(() => assertFormInputs(children, exampleSchema)).toThrow(
      'Duplicate inputs detected'
    );
  });
});
