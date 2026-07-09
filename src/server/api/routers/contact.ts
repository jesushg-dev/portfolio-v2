import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { randomUUID } from "crypto";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  isResendConfigured,
  resend,
  resendFromEmail,
} from "@/lib/email/resend";

const ContactMessageSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(120),
  message: z.string().trim().min(10).max(2000),
});

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export const contactRouter = createTRPCRouter({
  getPublic: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.tenant) {
      return { contacts: [], recipientReady: false };
    }

    const [contacts, user] = await Promise.all([
      ctx.db.cvContact.findMany({
        where: { userId: ctx.tenant.userId },
        orderBy: { order: "asc" },
        select: { type: true, value: true, label: true },
      }),
      ctx.db.user.findUnique({
        where: { id: ctx.tenant.userId },
        select: { email: true, name: true },
      }),
    ]);

    return {
      contacts,
      displayName: user?.name ?? ctx.tenant.username,
      recipientReady: Boolean(user?.email),
    };
  }),

  sendMessage: publicProcedure
    .input(ContactMessageSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Portfolio owner not found",
        });
      }

      if (!isResendConfigured() || !resend || !resendFromEmail) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Email delivery is not configured",
        });
      }

      const owner = await ctx.db.user.findUnique({
        where: { id: ctx.tenant.userId },
        select: { email: true, name: true },
      });

      if (!owner?.email) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Portfolio owner has no email",
        });
      }

      const safeName = escapeHtml(input.name);
      const safeEmail = escapeHtml(input.email);
      const safeMessage = escapeHtml(input.message).replaceAll("\n", "<br />");

      const { error } = await resend.emails.send(
        {
          from: resendFromEmail,
          to: owner.email,
          replyTo: input.email,
          subject: `New message from ${input.name}`,
          html: `
            <div style="font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.5;">
              <h2 style="margin: 0 0 12px;">New portfolio contact message</h2>
              <p style="margin: 0 0 8px;"><strong>From:</strong> ${safeName}</p>
              <p style="margin: 0 0 16px;"><strong>Email:</strong> ${safeEmail}</p>
              <p style="margin: 0 0 8px;"><strong>Message:</strong></p>
              <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
            </div>
          `,
          text: `New portfolio contact message\n\nFrom: ${input.name}\nEmail: ${input.email}\n\n${input.message}`,
        },
        {
          idempotencyKey: `contact-message/${ctx.tenant.userId}/${randomUUID()}`,
        },
      );

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to send message",
        });
      }

      return { ok: true as const };
    }),
});
