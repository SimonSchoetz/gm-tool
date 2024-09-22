import React from 'react';

import { assertFormShape, ValidatorName } from '@/validators/util';

describe('assertFormShape', () => {
  const emailInput = React.createElement('input', { id: 'email' });
  const passwordInput = React.createElement('input', { id: 'password' });
  const exampleValidator = ValidatorName.LOGIN;

  it('should not throw an error when inputs are corresponding to schema', () => {
    const children = [emailInput, passwordInput];
    expect(() => assertFormShape(children, exampleValidator)).not.toThrow();
  });

  it('should throw an error when input is missing', () => {
    const children = [passwordInput];
    expect(() => assertFormShape(children, exampleValidator)).toThrow(
      'Missing inputs according to schema: email'
    );
  });

  it('should not an error when missing input is in additionalFormData', () => {
    const password = React.createElement('password', { id: 'password' });
    const confirmPassword = React.createElement('confirmPassword', {
      id: 'confirmPassword',
    });
    const children = [password, confirmPassword];
    expect(() =>
      assertFormShape(children, ValidatorName.NEW_PASSWORD, ['token'])
    ).not.toThrow();
  });

  it('should work even if there is only one child (not an array))', () => {
    const children = passwordInput;
    expect(() => assertFormShape(children, exampleValidator)).toThrow(
      'Missing inputs according to schema: email'
    );
  });

  it('should throw an error when input has unknown children', () => {
    const unknownToValidator = React.createElement('input', {
      id: 'unknownToValidator',
    });
    const children = [emailInput, passwordInput, unknownToValidator];
    expect(() => assertFormShape(children, exampleValidator)).toThrow(
      'Extra inputs not according to schema: unknownToValidator'
    );
  });

  it('should throw an error when input has children with duplicate ids', () => {
    const children = [emailInput, emailInput, passwordInput];
    expect(() => assertFormShape(children, exampleValidator)).toThrow(
      'Duplicate inputs detected'
    );
  });
});
