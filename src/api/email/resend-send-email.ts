'use server';

import { EmailConfig } from '@/types/api/email';
import { EmailResponse } from '@/types/api/email';
import { assertIsString } from '@/util/asserts';
import { parsedEnv } from '@/util/helper';
import { Resend } from 'resend';

const resend = new Resend(parsedEnv.RESEND_API_KEY);

export const sendEmail = async ({
  from,
  to,
  subject,
  template,
}: EmailConfig): Promise<EmailResponse> => {
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    react: template,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  assertIsString(data?.id);
  return { success: true, createdEmailId: data.id };
};
