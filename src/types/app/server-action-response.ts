import { HttpStatusCode, Route } from '@/enums';

export type ServerActionResponse = {
  status: HttpStatusCode;
  error?: Record<string, string>;
  message?: string;
  redirectRoute?: Route;
};
