import { Resend } from "resend";

import { env } from "@/env";
import { getTenantIntegrationConfig } from "@/lib/integrations/tenant-integrations-service";

const systemResendApiKey = env.RESEND_API_KEY;
const systemResendEmailDomain = env.RESEND_EMAIL_DOMAIN;

export const resend = systemResendApiKey
  ? new Resend(systemResendApiKey)
  : null;

export const resendFromEmail = systemResendEmailDomain
  ? `Portfolio <no-reply@${systemResendEmailDomain}>`
  : undefined;

/** Whether system (.env) Resend is configured for auth / platform emails. */
export function isSystemResendConfigured(): boolean {
  return Boolean(resend && systemResendEmailDomain && resendFromEmail);
}

export type Locale = "en" | "es" | "nl";

export interface ResolvedEmailClient {
  resend: Resend | null;
  fromEmail: string | undefined;
  isConfigured: boolean;
}

/** Resolves the platform Resend client from .env (password reset, verification, etc.). */
export function getSystemEmailClient(): ResolvedEmailClient {
  return {
    resend,
    fromEmail: resendFromEmail,
    isConfigured: isSystemResendConfigured(),
  };
}

/** Resolves a tenant's Resend client for portfolio features (CV delivery, contact form). No .env fallback. */
export async function getPortfolioEmailClient(
  userId: string,
): Promise<ResolvedEmailClient> {
  const config = await getTenantIntegrationConfig(userId, "resend");
  if (config?.apiKey && config.emailDomain) {
    const client = new Resend(config.apiKey);
    const from =
      config.fromEmail ?? `Portfolio <no-reply@${config.emailDomain}>`;
    return {
      resend: client,
      fromEmail: from,
      isConfigured: true,
    };
  }

  return {
    resend: null,
    fromEmail: undefined,
    isConfigured: false,
  };
}

const SYSTEM_RESET_TEMPLATE_IDS: Record<Locale, string | undefined> = {
  en: env.RESEND_TEMPLATE_RESET_EN,
  es: env.RESEND_TEMPLATE_RESET_ES,
  nl: env.RESEND_TEMPLATE_RESET_NL,
};

function resolveTenantTemplate(
  templates: Record<string, string> | undefined,
  baseName: string,
  locale: Locale,
  fallbackLocale?: Locale,
): string | undefined {
  return (
    templates?.[`${baseName}-${locale}`] ??
    (fallbackLocale
      ? templates?.[`${baseName}-${fallbackLocale}`]
      : undefined) ??
    templates?.[`${baseName}-en`]
  );
}

/** Reset-password template from .env only (system auth emails). */
export function getSystemResetPasswordTemplateId(
  locale: Locale,
): string | undefined {
  return SYSTEM_RESET_TEMPLATE_IDS[locale] ?? SYSTEM_RESET_TEMPLATE_IDS.en;
}

/** CV delivery template from tenant integration only. */
export async function getPortfolioCvTemplateId(
  locale: Locale,
  userId: string,
): Promise<string | undefined> {
  const config = await getTenantIntegrationConfig(userId, "resend");
  return resolveTenantTemplate(config?.templates, "cv-delivery", locale);
}

/** Contact notification template from tenant integration only. */
export async function getPortfolioContactTemplateId(
  locale: Locale,
  userId: string,
): Promise<string | undefined> {
  const config = await getTenantIntegrationConfig(userId, "resend");
  return resolveTenantTemplate(
    config?.templates,
    "contact-notification",
    locale,
  );
}

/** Whether the tenant can send CV PDFs by email (Resend + template for locale). */
export async function canDeliverPortfolioCvEmail(
  userId: string,
  locale: Locale,
): Promise<boolean> {
  const client = await getPortfolioEmailClient(userId);
  if (!client.isConfigured) return false;
  const templateId = await getPortfolioCvTemplateId(locale, userId);
  return Boolean(templateId);
}

/** Whether the tenant contact form can deliver messages (Resend + template). */
export async function canDeliverPortfolioContactEmail(
  userId: string,
  locale: Locale,
): Promise<boolean> {
  const client = await getPortfolioEmailClient(userId);
  if (!client.isConfigured) return false;
  const templateId = await getPortfolioContactTemplateId(locale, userId);
  return Boolean(templateId);
}
