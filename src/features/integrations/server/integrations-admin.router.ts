import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  deleteTenantIntegration,
  getTenantIntegrationConfig,
  saveTenantIntegrationConfig,
  type AiIntegrationConfig,
  type ResendIntegrationConfig,
  type SpotifyIntegrationConfig,
  type UploadThingIntegrationConfig,
} from "@/lib/integrations/tenant-integrations-service";
import { syncResendTemplatesForTenant } from "@/lib/integrations/resend-tenant-publisher";
import { uploadBufferToUploadThing } from "@/lib/uploadthing/upload-buffer";
import { UploadThingNotConfiguredError } from "@/lib/uploadthing/tenant-uploadthing";

function maskSecret(value?: string | null): string {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export const integrationsAdminRouter = createTRPCRouter({
  /** Returns the status and masked credential info for all integrations for the active user. */
  getConfigs: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const [resendConfig, spotifyConfig, uploadthingConfig, aiConfig] =
      await Promise.all([
        getTenantIntegrationConfig(userId, "resend"),
        getTenantIntegrationConfig(userId, "spotify"),
        getTenantIntegrationConfig(userId, "uploadthing"),
        getTenantIntegrationConfig(userId, "ai"),
      ]);

    const resendIntegration = await ctx.db.tenantIntegration.findUnique({
      where: { userId_provider: { userId, provider: "resend" } },
      select: { lastSyncedAt: true, lastError: true },
    });

    return {
      resend: {
        isConfigured: Boolean(
          resendConfig?.apiKey && resendConfig?.emailDomain,
        ),
        emailDomain: resendConfig?.emailDomain ?? "",
        fromEmail: resendConfig?.fromEmail ?? "",
        emailSignatureHtml: resendConfig?.emailSignatureHtml ?? "",
        maskedApiKey: maskSecret(resendConfig?.apiKey),
        syncedTemplatesCount: Object.keys(resendConfig?.templates ?? {}).length,
        lastSyncedAt: resendIntegration?.lastSyncedAt ?? null,
        lastError: resendIntegration?.lastError ?? null,
      },
      spotify: {
        isConfigured: Boolean(
          spotifyConfig?.clientId &&
          spotifyConfig?.clientSecret &&
          spotifyConfig?.refreshToken,
        ),
        clientId: spotifyConfig?.clientId ?? "",
        maskedClientSecret: maskSecret(spotifyConfig?.clientSecret),
        maskedRefreshToken: maskSecret(spotifyConfig?.refreshToken),
      },
      uploadthing: {
        isConfigured: Boolean(
          uploadthingConfig?.token ??
          (uploadthingConfig?.appId && uploadthingConfig?.secret),
        ),
        appId: uploadthingConfig?.appId ?? "",
        maskedToken: maskSecret(uploadthingConfig?.token),
        maskedSecret: maskSecret(uploadthingConfig?.secret),
      },
      ai: {
        isConfigured: Boolean(
          aiConfig?.geminiApiKey ??
          aiConfig?.openaiApiKey ??
          aiConfig?.anthropicApiKey,
        ),
        hasGemini: Boolean(aiConfig?.geminiApiKey),
        hasOpenAi: Boolean(aiConfig?.openaiApiKey),
        hasAnthropic: Boolean(aiConfig?.anthropicApiKey),
        defaultProvider: aiConfig?.defaultProvider ?? "gemini",
        maskedGeminiApiKey: maskSecret(aiConfig?.geminiApiKey),
        maskedOpenAiApiKey: maskSecret(aiConfig?.openaiApiKey),
        maskedAnthropicApiKey: maskSecret(aiConfig?.anthropicApiKey),
      },
    };
  }),

  /** Saves Resend credentials and triggers automatic Resend template deployment. */
  saveResend: protectedProcedure
    .input(
      z.object({
        apiKey: z.string().trim().optional(),
        emailDomain: z.string().trim().optional(),
        fromEmail: z.string().trim().optional(),
        emailSignatureHtml: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const current = (await getTenantIntegrationConfig(userId, "resend")) ?? {
        apiKey: "",
        emailDomain: "",
      };

      const nextApiKey = input.apiKey?.trim() ?? current.apiKey;
      const nextDomain = input.emailDomain?.trim() ?? current.emailDomain;

      if (!nextApiKey || !nextDomain) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Resend API key and email domain are required.",
        });
      }

      const credentialsChanged =
        nextApiKey !== current.apiKey || nextDomain !== current.emailDomain;

      const updatedConfig: ResendIntegrationConfig = {
        ...current,
        apiKey: nextApiKey,
        emailDomain: nextDomain,
        fromEmail: input.fromEmail?.trim() ?? current.fromEmail,
        emailSignatureHtml:
          input.emailSignatureHtml !== undefined
            ? input.emailSignatureHtml.trim() || undefined
            : current.emailSignatureHtml,
      };

      await saveTenantIntegrationConfig(userId, "resend", updatedConfig);

      if (!credentialsChanged && current.templates) {
        return {
          ok: true as const,
          syncedCount: Object.keys(current.templates).length,
        };
      }

      try {
        const syncedTemplates = await syncResendTemplatesForTenant(
          userId,
          updatedConfig,
        );

        return {
          ok: true as const,
          syncedCount: Object.keys(syncedTemplates).length,
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Failed to publish templates to Resend using provided API key.",
        });
      }
    }),

  /** Triggers explicit manual template publication for Resend. */
  syncResendTemplates: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    try {
      const syncedTemplates = await syncResendTemplatesForTenant(userId);
      return {
        ok: true as const,
        syncedCount: Object.keys(syncedTemplates).length,
      };
    } catch (error) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          error instanceof Error
            ? error.message
            : "Failed to sync templates with Resend.",
      });
    }
  }),

  /** Saves Spotify OAuth client credentials. */
  saveSpotify: protectedProcedure
    .input(
      z.object({
        clientId: z.string().trim().min(1),
        clientSecret: z.string().trim().min(1),
        refreshToken: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const config: SpotifyIntegrationConfig = {
        clientId: input.clientId,
        clientSecret: input.clientSecret,
        refreshToken: input.refreshToken,
      };

      await saveTenantIntegrationConfig(userId, "spotify", config);
      return { ok: true as const };
    }),

  /** Saves UploadThing credentials. */
  saveUploadThing: protectedProcedure
    .input(
      z.object({
        token: z.string().trim().optional(),
        appId: z.string().trim().optional(),
        secret: z.string().trim().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const config: UploadThingIntegrationConfig = {
        token: input.token ?? undefined,
        appId: input.appId ?? undefined,
        secret: input.secret ?? undefined,
      };

      await saveTenantIntegrationConfig(userId, "uploadthing", config);
      return { ok: true as const };
    }),

  /** Uploads a file using the tenant's UploadThing integration. */
  uploadFile: protectedProcedure
    .input(
      z.object({
        fileName: z.string().trim().min(1).max(255),
        mimeType: z.string().trim().min(1).max(120),
        dataBase64: z
          .string()
          .min(1)
          .max(12 * 1024 * 1024),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const buffer = Buffer.from(input.dataBase64, "base64");
        if (buffer.byteLength === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File payload is empty",
          });
        }

        if (buffer.byteLength > 8 * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File exceeds the 8MB limit",
          });
        }

        return await uploadBufferToUploadThing(
          ctx.user.id,
          buffer,
          input.fileName,
          input.mimeType,
        );
      } catch (error) {
        if (error instanceof UploadThingNotConfiguredError) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "UploadThing is not configured. Connect it in Admin → Credentials first.",
          });
        }

        throw error;
      }
    }),

  /** Saves AI model credentials (Gemini, OpenAI, Anthropic). Empty fields keep current keys. */
  saveAi: protectedProcedure
    .input(
      z.object({
        geminiApiKey: z.string().trim().optional(),
        openaiApiKey: z.string().trim().optional(),
        anthropicApiKey: z.string().trim().optional(),
        defaultProvider: z
          .enum(["gemini", "openai", "anthropic"])
          .default("gemini"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const current =
        (await getTenantIntegrationConfig(userId, "ai")) ??
        ({});

      const config: AiIntegrationConfig = {
        geminiApiKey: input.geminiApiKey?.trim()
          ? input.geminiApiKey.trim()
          : current.geminiApiKey,
        openaiApiKey: input.openaiApiKey?.trim()
          ? input.openaiApiKey.trim()
          : current.openaiApiKey,
        anthropicApiKey: input.anthropicApiKey?.trim()
          ? input.anthropicApiKey.trim()
          : current.anthropicApiKey,
        deepseekApiKey: current.deepseekApiKey,
        defaultProvider: input.defaultProvider,
      };

      if (
        !config.geminiApiKey &&
        !config.openaiApiKey &&
        !config.anthropicApiKey &&
        !config.deepseekApiKey
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "At least one AI API key is required.",
        });
      }

      await saveTenantIntegrationConfig(userId, "ai", config);
      return { ok: true as const };
    }),

  /** Deletes an integration provider for the tenant. */
  deleteIntegration: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["resend", "spotify", "uploadthing", "ai"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      await deleteTenantIntegration(userId, input.provider);
      return { ok: true as const };
    }),
});
