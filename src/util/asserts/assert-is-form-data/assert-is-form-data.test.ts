import { assertIsFormData } from './assert-is-form-data';

describe('assertIsFormData', () => {
  it('should throw an error if input is not of type FormData', () => {
    const formDataDto = {};

    expect(() => assertIsFormData(formDataDto)).toThrow();
  });
  it('should throw not an error if input is not of type FormData', () => {
    const formDataDto = new FormData();

    expect(() => assertIsFormData(formDataDto)).not.toThrow();
  });
});
