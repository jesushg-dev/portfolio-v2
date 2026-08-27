import "server-only";

import { db } from "@/server/db";
import {
  decryptJsonSecret,
  encryptJsonSecret,
} from "@/lib/crypto/secret-encryption";

export type IntegrationProvider = "resend" | "spotify" | "uploadthing" | "ai";

export interface ResendIntegrationConfig {
  apiKey: string;
  emailDomain: string;
  fromEmail?: string;
  /** Optional HTML email signature appended to outbound application emails. */
  emailSignatureHtml?: string;
  /** Maps template names (e.g. cv-delivery-en) to Resend Template UUIDs */
  templates?: Record<string, string>;
}

export interface SpotifyIntegrationConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface UploadThingIntegrationConfig {
  token?: string;
  appId?: string;
  secret?: string;
}

export interface AiIntegrationConfig {
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  defaultProvider?: "gemini" | "openai" | "anthropic";
}

export interface IntegrationConfigMap {
  resend: ResendIntegrationConfig;
  spotify: SpotifyIntegrationConfig;
  uploadthing: UploadThingIntegrationConfig;
  ai: AiIntegrationConfig;
}

/** Reads and decrypts a tenant's integration configuration for a specific provider. */
export async function getTenantIntegrationConfig<P extends IntegrationProvider>(
  userId: string,
  provider: P,
): Promise<IntegrationConfigMap[P] | null> {
  const integration = await db.tenantIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
  });

  if (!integration || !integration.enabled || !integration.credentialsEnc) {
    return null;
  }

  return decryptJsonSecret<IntegrationConfigMap[P]>(integration.credentialsEnc);
}

/** Saves and encrypts a tenant's integration configuration for a provider. */
export async function saveTenantIntegrationConfig<
  P extends IntegrationProvider,
>(
  userId: string,
  provider: P,
  config: IntegrationConfigMap[P],
  options?: { lastError?: string | null },
): Promise<void> {
  const encrypted = encryptJsonSecret(config);

  await db.tenantIntegration.upsert({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
    create: {
      userId,
      provider,
      enabled: true,
      credentialsEnc: encrypted,
      lastSyncedAt: new Date(),
      lastError: options?.lastError ?? null,
    },
    update: {
      enabled: true,
      credentialsEnc: encrypted,
      lastSyncedAt: new Date(),
      lastError: options?.lastError ?? null,
    },
  });
}

/** Updates errors or metadata for a tenant integration. */
export async function updateTenantIntegrationStatus(
  userId: string,
  provider: IntegrationProvider,
  status: { lastError?: string | null; lastSyncedAt?: Date },
): Promise<void> {
  await db.tenantIntegration.update({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
    data: {
      ...(status.lastError !== undefined
        ? { lastError: status.lastError }
        : {}),
      ...(status.lastSyncedAt ? { lastSyncedAt: status.lastSyncedAt } : {}),
    },
  });
}

/** Deletes/disables a tenant integration. */
export async function deleteTenantIntegration(
  userId: string,
  provider: IntegrationProvider,
): Promise<void> {
  await db.tenantIntegration.deleteMany({
    where: {
      userId,
      provider,
    },
  });
}
