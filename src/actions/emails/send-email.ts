'use server';

import { EmailSender } from '@/enums';
import { assertIsString } from '@/util/asserts';
import { parsedEnv } from '@/util/helper';
import { ReactNode } from 'react';
import { Resend } from 'resend';

type SendEmailResponse = {
  success: boolean;
  createdEmailId?: string;
  error?: string;
};

export type EmailData = {
  from: EmailSender;
  to: string;
  subject: string;
  template: ReactNode;
};

const resend = new Resend(parsedEnv.RESEND_API_KEY);

export const sendEmail = async ({
  from,
  to,
  subject,
  template,
}: EmailData): Promise<SendEmailResponse> => {
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
