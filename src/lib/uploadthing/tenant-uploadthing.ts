import "server-only";

import { UTApi } from "uploadthing/server";

import {
  getTenantIntegrationConfig,
  type UploadThingIntegrationConfig,
} from "@/lib/integrations/tenant-integrations-service";

export class UploadThingNotConfiguredError extends Error {
  constructor() {
    super("UploadThing is not configured for this portfolio");
    this.name = "UploadThingNotConfiguredError";
  }
}

export interface TenantUploadThingClient {
  token: string;
  utapi: UTApi;
}

function createUtApiFromConfig(
  config: UploadThingIntegrationConfig,
): UTApi | null {
  const token = config.token?.trim();
  if (token) {
    return new UTApi({ token });
  }

  return null;
}

/** Whether the tenant has UploadThing credentials saved (no .env fallback). */
export async function isTenantUploadThingConfigured(
  userId: string,
): Promise<boolean> {
  const config = await getTenantIntegrationConfig(userId, "uploadthing");
  if (!config) return false;
  return Boolean(createUtApiFromConfig(config));
}

/** Resolves a tenant UploadThing client. Returns null when not integrated. */
export async function getTenantUploadThingClient(
  userId: string,
): Promise<TenantUploadThingClient | null> {
  const config = await getTenantIntegrationConfig(userId, "uploadthing");
  if (!config) return null;

  const utapi = createUtApiFromConfig(config);
  if (!utapi) return null;

  const token = config.token?.trim();
  if (!token) return null;

  return { token, utapi };
}

/** Returns a tenant UTApi or throws when storage is not integrated. */
export async function requireTenantUploadThingClient(
  userId: string,
): Promise<TenantUploadThingClient> {
  const client = await getTenantUploadThingClient(userId);
  if (!client) {
    throw new UploadThingNotConfiguredError();
  }
  return client;
}

export interface UploadThingTestResult {
  success: boolean;
  error?: string;
}

/** Verifies that a token can authenticate against the UploadThing API. */
export async function testUploadThingConnection(
  token: string,
): Promise<UploadThingTestResult> {
  const trimmed = token.trim();
  if (!trimmed) {
    return { success: false, error: "UploadThing token is required." };
  }

  try {
    const utapi = new UTApi({ token: trimmed });
    await utapi.listFiles({ limit: 1 });
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to authenticate with UploadThing.";
    return { success: false, error: message };
  }
}
