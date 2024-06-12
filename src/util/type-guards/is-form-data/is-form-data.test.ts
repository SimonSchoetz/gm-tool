import { isFormData } from './is-form-data';

describe('isFormData', () => {
  it('should return false if input is not of type FormData', () => {
    const formDataDto = {};
    expect(isFormData(formDataDto)).toBe(false);
  });
  it('should return true if input is FormData', () => {
    const formDataDto = new FormData();
    expect(isFormData(formDataDto)).toBe(true);
  });
});
