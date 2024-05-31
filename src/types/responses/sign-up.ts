import { HttpStatusCode } from '@/enums';

export type SignUpResponse = {
  message: string;
  status: HttpStatusCode;
};
