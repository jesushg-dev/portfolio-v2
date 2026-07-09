import { Resend } from "resend";

import { env } from "@/env";

const resendApiKey = env.RESEND_API_KEY;
const resendEmailDomain = env.RESEND_EMAIL_DOMAIN;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const resendFromEmail = resendEmailDomain
  ? `Portfolio <no-reply@${resendEmailDomain}>`
  : undefined;

export function isResendConfigured(): boolean {
  return Boolean(resend && resendEmailDomain && resendFromEmail);
}
