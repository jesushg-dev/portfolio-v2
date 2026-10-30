import "server-only";

import {
  getTenantIntegrationConfig,
  type ILovePdfIntegrationConfig,
} from "@/lib/integrations/tenant-integrations-service";
import {
  convertHtmlToPdf,
  convertOfficeToPdf,
  type ConvertHtmlToPdfOptions,
  type ILovePdfApiKeys,
} from "./ilovepdf-service";

export class ILovePdfNotConfiguredError extends Error {
  constructor() {
    super(
      "iLovePDF is not configured for this portfolio. Connect your keys in Admin → Credentials.",
    );
    this.name = "ILovePdfNotConfiguredError";
  }
}

/** Whether the tenant has iLovePDF API keys saved. */
export async function isTenantILovePdfConfigured(
  userId: string,
): Promise<boolean> {
  const config = await getTenantIntegrationConfig(userId, "ilovepdf");
  return Boolean(config?.publicKey?.trim() && config?.secretKey?.trim());
}

/** Resolves decrypted iLovePDF API keys for a tenant. Returns null if not configured. */
export async function getTenantILovePdfKeys(
  userId: string,
): Promise<ILovePdfApiKeys | null> {
  const config: ILovePdfIntegrationConfig | null =
    await getTenantIntegrationConfig(userId, "ilovepdf");

  const publicKey = config?.publicKey?.trim();
  const secretKey = config?.secretKey?.trim();

  if (!publicKey || !secretKey) {
    return null;
  }

  return { publicKey, secretKey };
}

/**
 * Converts a DOCX buffer to a PDF buffer using the tenant's BYOK iLovePDF integration.
 * Throws ILovePdfNotConfiguredError if the integration is missing.
 */
export async function convertDocxToPdfForTenant(
  userId: string,
  docxBuffer: Buffer,
  fileName = "document.docx",
): Promise<Buffer> {
  const keys = await getTenantILovePdfKeys(userId);
  if (!keys) {
    throw new ILovePdfNotConfiguredError();
  }

  return convertOfficeToPdf(docxBuffer, keys, fileName);
}

/**
 * Converts a webpage URL or HTML string to PDF using the tenant's BYOK iLovePDF integration.
 * Throws ILovePdfNotConfiguredError if the integration is missing.
 */
export async function convertHtmlToPdfForTenant(
  userId: string,
  options: Omit<ConvertHtmlToPdfOptions, "keys">,
): Promise<Buffer> {
  const keys = await getTenantILovePdfKeys(userId);
  if (!keys) {
    throw new ILovePdfNotConfiguredError();
  }

  return convertHtmlToPdf({
    ...options,
    keys,
  });
}
