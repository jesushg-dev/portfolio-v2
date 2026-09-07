jest.mock("@/lib/integrations/tenant-integrations-service", () => ({
  getTenantIntegrationConfig: jest.fn(),
  saveTenantIntegrationConfig: jest.fn(),
  deleteTenantIntegration: jest.fn(),
}));
jest.mock("@/lib/integrations/resend-tenant-publisher", () => ({
  syncResendTemplatesForTenant: jest.fn(),
}));
jest.mock("@/lib/uploadthing/upload-buffer", () => ({
  uploadBufferToUploadThing: jest.fn(),
}));
jest.mock("@/lib/uploadthing/tenant-uploadthing", () => ({
  UploadThingNotConfiguredError: class UploadThingNotConfiguredError extends Error {},
}));

import {
  deleteTenantIntegration,
  getTenantIntegrationConfig,
  saveTenantIntegrationConfig,
} from "@/lib/integrations/tenant-integrations-service";
import { syncResendTemplatesForTenant } from "@/lib/integrations/resend-tenant-publisher";
import { uploadBufferToUploadThing } from "@/lib/uploadthing/upload-buffer";
import { integrationsAdminRouter } from "./integrations-admin.router";
import {
  createRouterCaller,
  createTrpcTestContext,
} from "@/test-utils/trpc-caller";

function createDb() {
  return {
    tenantIntegration: {
      findUnique: jest.fn().mockResolvedValue({
        lastSyncedAt: new Date("2026-01-01"),
        lastError: null,
      }),
    },
  };
}

describe("integrationsAdminRouter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getTenantIntegrationConfig).mockResolvedValue(null);
    jest.mocked(saveTenantIntegrationConfig).mockResolvedValue(undefined);
    jest.mocked(deleteTenantIntegration).mockResolvedValue(undefined);
    jest.mocked(syncResendTemplatesForTenant).mockResolvedValue({
      "cv-delivery-en": "tmpl-1",
    });
  });

  it("returns masked empty configs by default", async () => {
    const caller = createRouterCaller(
      integrationsAdminRouter,
      createTrpcTestContext({ db: createDb() }),
    );
    const configs = await caller.getConfigs();
    expect(configs.resend.isConfigured).toBe(false);
    expect(configs.spotify.isConfigured).toBe(false);
    expect(configs.ai.isConfigured).toBe(false);
  });

  it("masks secrets when Resend is configured", async () => {
    jest
      .mocked(getTenantIntegrationConfig)
      .mockImplementation(async (_id, provider) => {
        if (provider === "resend") {
          return {
            apiKey: "re_abcdefghijklmnop",
            emailDomain: "jesushg.com",
            fromEmail: "hi@jesushg.com",
            emailSignatureHtml: "<p>Hi</p>",
            templates: { "cv-delivery-en": "tmpl-1" },
          };
        }
        return null;
      });
    const caller = createRouterCaller(
      integrationsAdminRouter,
      createTrpcTestContext({ db: createDb() }),
    );
    const configs = await caller.getConfigs();
    expect(configs.resend.isConfigured).toBe(true);
    expect(configs.resend.maskedApiKey).toMatch(/^re_a/);
    expect(configs.resend.maskedApiKey).toContain("••••");
    expect(configs.resend.syncedTemplatesCount).toBe(1);
  });

  it("rejects saving Resend without a key and domain", async () => {
    const caller = createRouterCaller(
      integrationsAdminRouter,
      createTrpcTestContext({ db: createDb() }),
    );
    await expect(caller.saveResend({})).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("saves Resend credentials and syncs templates", async () => {
    const caller = createRouterCaller(
      integrationsAdminRouter,
      createTrpcTestContext({ db: createDb() }),
    );
    const result = await caller.saveResend({
      apiKey: "re_test_key",
      emailDomain: "jesushg.com",
      fromEmail: "hi@jesushg.com",
    });
    expect(result.ok).toBe(true);
    expect(saveTenantIntegrationConfig).toHaveBeenCalled();
    expect(syncResendTemplatesForTenant).toHaveBeenCalled();
  });

  it("saves Spotify, UploadThing, and AI credentials", async () => {
    const caller = createRouterCaller(
      integrationsAdminRouter,
      createTrpcTestContext({ db: createDb() }),
    );
    await caller.saveSpotify({
      clientId: "cid",
      clientSecret: "secret",
      refreshToken: "refresh",
    });
    await caller.saveUploadThing({
      token: "ut_token",
      appId: "app",
      secret: "secret",
    });
    await caller.saveAi({
      geminiApiKey: "gem-key",
      defaultProvider: "gemini",
    });
    expect(saveTenantIntegrationConfig).toHaveBeenCalledTimes(3);
  });

  it("rejects AI save when no keys are present", async () => {
    const caller = createRouterCaller(
      integrationsAdminRouter,
      createTrpcTestContext({ db: createDb() }),
    );
    await expect(
      caller.saveAi({ defaultProvider: "gemini" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("uploads a file through UploadThing", async () => {
    jest.mocked(uploadBufferToUploadThing).mockResolvedValue({
      url: "https://utfs.io/f/abc",
      key: "abc",
    });
    const caller = createRouterCaller(
      integrationsAdminRouter,
      createTrpcTestContext({ db: createDb() }),
    );
    const payload = Buffer.from("hello").toString("base64");
    const result = await caller.uploadFile({
      fileName: "note.txt",
      mimeType: "text/plain",
      dataBase64: payload,
    });
    expect(result).toMatchObject({ url: "https://utfs.io/f/abc" });
  });

  it("rejects an empty upload payload", async () => {
    const caller = createRouterCaller(
      integrationsAdminRouter,
      createTrpcTestContext({ db: createDb() }),
    );
    await expect(
      caller.uploadFile({
        fileName: "empty.txt",
        mimeType: "text/plain",
        dataBase64: "",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("deletes an integration", async () => {
    const caller = createRouterCaller(
      integrationsAdminRouter,
      createTrpcTestContext({ db: createDb() }),
    );
    await expect(
      caller.deleteIntegration({ provider: "spotify" }),
    ).resolves.toEqual({ ok: true });
    expect(deleteTenantIntegration).toHaveBeenCalled();
  });
});
