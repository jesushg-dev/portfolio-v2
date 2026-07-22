import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { getTranslations } from "next-intl/server";

import { createTRPCRouter, tenantProcedure } from "@/server/api/trpc";
import {
  isResendConfigured,
  resend,
  resendFromEmail,
} from "@/lib/email/resend";
import { generateCvPdfFromPreview } from "@/features/cv/lib/generate-cv-pdf-from-preview";
import {
  assertCvEmailRateLimit,
  getClientIpFromHeaders,
  hashClientIp,
  logCvEmailRequest,
} from "@/features/cv/lib/rate-limit-cv-email";
import { loadCvStructuredDraft } from "@/features/cv/lib/load-cv-structured-draft";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^\w.-]+/g, "_");
}

const localeSchema = z.enum(["en", "es", "nl"]);

export const cvPublicRouter = createTRPCRouter({
  getPdfDeliveryStatus: tenantProcedure.query(async ({ ctx }) => {
    const draft = await loadCvStructuredDraft(ctx.db, ctx.tenant.userId, {
      locale: ctx.tenant.defaultLocale,
      fallbackLocale: ctx.tenant.defaultLocale,
    });

    return {
      canSendByEmail: isResendConfigured(),
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
      if (!isResendConfigured() || !resend || !resendFromEmail) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Email delivery is not configured",
        });
      }

      const locale = input.locale;
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

      const pdfBuffer = await generateCvPdfFromPreview({
        locale,
        tenantUsername: ctx.tenant.username,
        paginatePages: input.paginatePages ?? false,
      });

      const t = await getTranslations({
        locale,
        namespace: "curriculum.pdfDelivery",
      });

      const owner = await ctx.db.user.findUnique({
        where: { id: ctx.tenant.userId },
        select: { email: true, name: true },
      });

      const fullName = draft.header.fullName;
      const safeRecipientEmail = escapeHtml(recipientEmail);
      const fileName = `CV-${sanitizeFileName(fullName)}.pdf`;

      const { error } = await resend.emails.send(
        {
          from: resendFromEmail,
          to: recipientEmail,
          subject: t("email.subject", { fullName }),
          html: `
            <div style="font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.5;">
              <p style="margin: 0 0 12px;">${t("email.bodyHtml", { fullName })}</p>
            </div>
          `,
          text: t("email.bodyText", { fullName }),
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

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to send CV email",
        });
      }

      await logCvEmailRequest(ctx.db, {
        userId: ctx.tenant.userId,
        ipHash,
        recipientEmail,
        locale,
      });

      if (owner?.email) {
        const ownerT = await getTranslations({
          locale: ctx.tenant.defaultLocale,
          namespace: "curriculum.pdfDelivery",
        });

        await resend.emails.send(
          {
            from: resendFromEmail,
            to: owner.email,
            subject: ownerT("ownerNotification.subject", { fullName }),
            html: `
              <div style="font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.5;">
                <p style="margin: 0 0 8px;">${ownerT(
                  "ownerNotification.bodyHtml",
                  {
                    fullName,
                    recipientEmail: safeRecipientEmail,
                  },
                )}</p>
              </div>
            `,
            text: ownerT("ownerNotification.bodyText", {
              fullName,
              recipientEmail,
            }),
          },
          {
            idempotencyKey: `cv-pdf-owner/${ctx.tenant.userId}/${recipientEmail}/${randomUUID()}`,
          },
        );
      }

      return { ok: true as const };
    }),
});
