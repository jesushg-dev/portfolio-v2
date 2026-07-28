import "server-only";

import { Resend } from "resend";
import { locales, type Locale } from "@/i18n/config";
import { db } from "@/server/db";
import { COMPILED_TEMPLATES } from "../../../email-templates/src/compiled-templates";

import {
  getTenantIntegrationConfig,
  saveTenantIntegrationConfig,
  updateTenantIntegrationStatus,
  type ResendIntegrationConfig,
} from "./tenant-integrations-service";

function getCvSubject(locale: Locale, ownerName: string): string {
  switch (locale) {
    case "es":
      return `Aquí está mi CV — ${ownerName}`;
    case "nl":
      return `Hier is mijn cv — ${ownerName}`;
    case "en":
    default:
      return `Here is my CV — ${ownerName}`;
  }
}

function getContactSubject(locale: Locale, domain: string): string {
  switch (locale) {
    case "es":
      return `Nuevo mensaje de {{{SENDER_NAME}}} vía ${domain}`;
    case "nl":
      return `Nieuw bericht van {{{SENDER_NAME}}} via ${domain}`;
    case "en":
    default:
      return `New message from {{{SENDER_NAME}}} via ${domain}`;
  }
}

function getResetPasswordSubject(locale: Locale, domain: string): string {
  switch (locale) {
    case "es":
      return `Restablece tu contraseña — ${domain}`;
    case "nl":
      return `Herstel je wachtwoord — ${domain}`;
    case "en":
    default:
      return `Reset your password — ${domain}`;
  }
}

interface Variable {
  key: string;
  type: "string";
  fallbackValue: string;
}

interface TemplateInput {
  name: string;
  from: string;
  subject: string;
  html: string;
  variables: Variable[];
}

async function upsertResendTemplate(
  resend: Resend,
  input: TemplateInput,
): Promise<string> {
  const { data: list, error: listError } = await resend.templates.list();
  if (listError) {
    throw new Error(listError.message || "Failed to list Resend templates");
  }

  const existing = list?.data.find((t) => t.name === input.name);

  if (existing) {
    const { error } = await resend.templates.update(existing.id, input);
    if (error) {
      throw new Error(
        error.message || `Failed to update template ${input.name}`,
      );
    }
    await resend.templates.publish(existing.id);
    return existing.id;
  }

  const { data, error } = await resend.templates.create(input);
  if (error ?? !data) {
    throw new Error(
      error?.message ?? `Failed to create template ${input.name}`,
    );
  }

  await resend.templates.publish(data.id);
  return data.id;
}

/**
 * Server-side service to publish all 9 React Email templates (3 email types x 3 locales)
 * to Resend using the tenant's own Resend API Key, and save template IDs to DB.
 */
export async function syncResendTemplatesForTenant(
  userId: string,
  configOverride?: ResendIntegrationConfig,
): Promise<Record<string, string>> {
  const config =
    configOverride ?? (await getTenantIntegrationConfig(userId, "resend"));

  if (!config?.apiKey || !config?.emailDomain) {
    throw new Error(
      "Resend credentials (API key & domain) are not configured for this tenant.",
    );
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const rawName = user?.name?.trim();
  const ownerName = rawName && rawName.length > 0 ? rawName : "Portfolio Owner";
  const domain = config.emailDomain;

  const resend = new Resend(config.apiKey);
  const fromAddress = config.fromEmail ?? `${ownerName} <no-reply@${domain}>`;

  const templateMap: Record<string, string> = {};

  try {
    for (const locale of locales) {
      // 1. CV Delivery Template
      const cvName = `cv-delivery-${locale}`;
      const cvHtml = COMPILED_TEMPLATES[cvName];
      if (!cvHtml) {
        throw new Error(`Missing compiled template for ${cvName}`);
      }

      const cvId = await upsertResendTemplate(resend, {
        name: cvName,
        from: fromAddress,
        subject: getCvSubject(locale, ownerName),
        html: cvHtml,
        variables: [
          { key: "RECIPIENT_NAME", type: "string", fallbackValue: "there" },
        ],
      });
      templateMap[cvName] = cvId;

      // 2. Contact Notification Template
      const contactName = `contact-notification-${locale}`;
      const contactHtml = COMPILED_TEMPLATES[contactName];
      if (!contactHtml) {
        throw new Error(`Missing compiled template for ${contactName}`);
      }

      const contactId = await upsertResendTemplate(resend, {
        name: contactName,
        from: fromAddress,
        subject: getContactSubject(locale, domain),
        html: contactHtml,
        variables: [
          { key: "SENDER_NAME", type: "string", fallbackValue: "a visitor" },
          {
            key: "SENDER_EMAIL",
            type: "string",
            fallbackValue: "[email protected]",
          },
          { key: "MESSAGE", type: "string", fallbackValue: "" },
          { key: "SENT_AT", type: "string", fallbackValue: "" },
        ],
      });
      templateMap[contactName] = contactId;

      // 3. Reset Password Template
      const resetName = `reset-password-${locale}`;
      const resetHtml = COMPILED_TEMPLATES[resetName];
      if (!resetHtml) {
        throw new Error(`Missing compiled template for ${resetName}`);
      }

      const resetId = await upsertResendTemplate(resend, {
        name: resetName,
        from: fromAddress,
        subject: getResetPasswordSubject(locale, domain),
        html: resetHtml,
        variables: [
          {
            key: "RESET_URL",
            type: "string",
            fallbackValue: `https://${domain}`,
          },
        ],
      });
      templateMap[resetName] = resetId;
    }

    // Update DB record with the synced template IDs
    const updatedConfig: ResendIntegrationConfig = {
      ...config,
      templates: templateMap,
    };

    await saveTenantIntegrationConfig(userId, "resend", updatedConfig, {
      lastError: null,
    });

    return templateMap;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync templates";

    await updateTenantIntegrationStatus(userId, "resend", {
      lastError: message,
    });

    throw error;
  }
}
