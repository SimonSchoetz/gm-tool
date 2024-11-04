'use server';

import { HttpStatusCode, Route } from '@/enums';
import { ValidatorName, parseDataWithZodValidator } from '@/validators/util';
import { ServerActionResponse, SubmitData } from '@/types/app';
import { ZodError } from 'zod';
import { VerificationEmailFormData } from '@/types/actions';
import { sendEmailVerificationEmail } from '../_util/emails';

export const submitRequestNewVerificationEmail = async (
  data: SubmitData
): Promise<ServerActionResponse> => {
  try {
    const { email } = parseDataWithZodValidator<VerificationEmailFormData>(
      data,
      ValidatorName.VERIFICATION_EMAIL
    );

    const res = await sendEmailVerificationEmail(email);

    if (res.status !== HttpStatusCode.OK) {
      return res;
    }

    return {
      status: HttpStatusCode.OK,
      redirectRoute: Route.VERIFY_EMAIL,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: HttpStatusCode.BAD_REQUEST,
        message: 'Could not validate input data',
      };
    }

    return {
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      message: `Unknown error during verification email request: "${error}"`,
    };
  }
};
