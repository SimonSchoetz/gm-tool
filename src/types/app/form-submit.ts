import { HttpStatusCode, Route } from '@/enums';

export type FormSubmitResponse = {
  status: HttpStatusCode;
  error?: Record<string, string>;
  redirectRoute?: Route;
};
