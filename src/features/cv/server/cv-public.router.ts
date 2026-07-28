import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";

import { createTRPCRouter, tenantProcedure } from "@/server/api/trpc";
import {
  getPortfolioEmailClient,
  getPortfolioCvTemplateId,
  getPortfolioContactTemplateId,
  canDeliverPortfolioCvEmail,
} from "@/lib/email/resend";
import { resolveCvPdfAsset } from "@/features/cv/lib/resolve-cv-pdf-asset";
import {
  assertCvEmailRateLimit,
  getClientIpFromHeaders,
  hashClientIp,
  logCvEmailRequest,
} from "@/features/cv/lib/rate-limit-cv-email";
import { loadCvStructuredDraft } from "@/features/cv/lib/load-cv-structured-draft";

function sanitizeFileName(value: string): string {
  return value.replace(/[^\w.-]+/g, "_");
}

const localeSchema = z.enum(["en", "es", "nl"]);
type Locale = z.infer<typeof localeSchema>;

export const cvPublicRouter = createTRPCRouter({
  getPdfDeliveryStatus: tenantProcedure.query(async ({ ctx }) => {
    const [draft, canSendByEmail] = await Promise.all([
      loadCvStructuredDraft(ctx.db, ctx.tenant.userId, {
        locale: ctx.tenant.defaultLocale,
        fallbackLocale: ctx.tenant.defaultLocale,
      }),
      canDeliverPortfolioCvEmail(
        ctx.tenant.userId,
        ctx.tenant.defaultLocale ?? "en",
      ),
    ]);

    return {
      canSendByEmail,
      hasCvData: Boolean(draft),
    };
  }),

  sendPdfByEmail: tenantProcedure
    .input(
      z.object({
        email: z.string().trim().email().max(120),
        locale: localeSchema,
        paginatePages: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const emailClient = await getPortfolioEmailClient(ctx.tenant.userId);

      if (
        !emailClient.isConfigured ||
        !emailClient.resend ||
        !emailClient.fromEmail
      ) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Email delivery is not configured for this portfolio",
        });
      }

      const locale: Locale = input.locale;

      const cvTemplateId = await getPortfolioCvTemplateId(
        locale,
        ctx.tenant.userId,
      );
      if (!cvTemplateId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `CV email template is not configured for locale "${locale}".`,
        });
      }

      const draft = await loadCvStructuredDraft(ctx.db, ctx.tenant.userId, {
        locale,
        fallbackLocale: ctx.tenant.defaultLocale,
      });

      if (!draft) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "CV data is not available",
        });
      }

      const ip = getClientIpFromHeaders(ctx.headers);
      const ipHash = hashClientIp(ip);
      const recipientEmail = input.email.toLowerCase();

      await assertCvEmailRateLimit(
        ctx.db,
        ctx.tenant.userId,
        ipHash,
        recipientEmail,
      );

      const pdfAsset = await resolveCvPdfAsset(
        ctx.tenant.userId,
        ctx.tenant.username,
        locale,
        ctx.tenant.defaultLocale,
        {
          paginatePages: input.paginatePages ?? false,
          includeBuffer: true,
        },
      );

      if (!pdfAsset?.buffer) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to prepare CV PDF",
        });
      }

      const pdfBuffer = pdfAsset.buffer;
      const fullName = draft.header.fullName;
      const fileName = `CV-${sanitizeFileName(fullName)}.pdf`;

      // --- CV delivery to visitor (in visitor's locale) ---
      const { error: cvError } = await emailClient.resend.emails.send(
        {
          from: emailClient.fromEmail,
          to: recipientEmail,
          template: {
            id: cvTemplateId,
            variables: { RECIPIENT_NAME: "there" },
          },
          attachments: [
            {
              filename: fileName,
              content: pdfBuffer,
            },
          ],
        },
        {
          idempotencyKey: `cv-pdf/${ctx.tenant.userId}/${recipientEmail}/${randomUUID()}`,
        },
      );

      if (cvError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: cvError.message || "Failed to send CV email",
        });
      }

      await logCvEmailRequest(ctx.db, {
        userId: ctx.tenant.userId,
        ipHash,
        recipientEmail,
        locale,
      });

      // --- Owner notification (in the owner's default locale) ---
      const owner = await ctx.db.user.findUnique({
        where: { id: ctx.tenant.userId },
        select: { email: true, name: true },
      });

      if (owner?.email) {
        const ownerLocale: Locale = ctx.tenant.defaultLocale ?? "en";
        const contactTemplateId = await getPortfolioContactTemplateId(
          ownerLocale,
          ctx.tenant.userId,
        );

        if (contactTemplateId) {
          const sentAt = new Date().toLocaleString(ownerLocale, {
            dateStyle: "medium",
            timeStyle: "short",
          });

          await emailClient.resend.emails.send(
            {
              from: emailClient.fromEmail,
              to: owner.email,
              replyTo: recipientEmail,
              template: {
                id: contactTemplateId,
                variables: {
                  SENDER_NAME: recipientEmail,
                  SENDER_EMAIL: recipientEmail,
                  MESSAGE: `📎 CV requested — ${fileName} was sent to this address.`,
                  SENT_AT: sentAt,
                },
              },
            },
            {
              idempotencyKey: `cv-pdf-owner/${ctx.tenant.userId}/${recipientEmail}/${randomUUID()}`,
            },
          );
        }
      }

      return { ok: true };
    }),
});
