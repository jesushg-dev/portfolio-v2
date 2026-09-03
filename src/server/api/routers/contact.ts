import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { randomUUID } from "crypto";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  getPortfolioEmailClient,
  getPortfolioContactTemplateId,
  canDeliverPortfolioContactEmail,
  type Locale,
} from "@/lib/email/resend";
import { getTenantPublicUrl } from "@/lib/tenant/public-url";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";
import {
  locationQueryFromContacts,
  resolveOwnerMapLocation,
} from "@/lib/geo/geocode-place";

const ContactMessageSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(120),
  message: z.string().trim().min(10).max(2000),
});

export const contactRouter = createTRPCRouter({
  getPublic: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.tenant) {
      return {
        contacts: [],
        recipientReady: false,
        emailFormEnabled: false,
        mapLocation: null,
      };
    }

    const ownerLocale: Locale = ctx.tenant.defaultLocale ?? "en";

    const [appLanguages, rawContacts, profile, user, emailFormEnabled] =
      await Promise.all([
        ctx.db.appLanguage.findMany(),
        ctx.db.cvContact.findMany({
          where: { userId: ctx.tenant.userId },
          include: { translations: true },
          orderBy: { order: "asc" },
        }),
        ctx.db.profile.findUnique({
          where: { userId: ctx.tenant.userId },
          select: {
            username: true,
            isPrimary: true,
            customDomain: true,
            mapLocationLabel: true,
            mapLatitude: true,
            mapLongitude: true,
          },
        }),
        ctx.db.user.findUnique({
          where: { id: ctx.tenant.userId },
          select: { email: true, name: true },
        }),
        canDeliverPortfolioContactEmail(ctx.tenant.userId, ownerLocale),
      ]);

    const field = createLocalizedFieldResolver(appLanguages, ownerLocale);

    const contacts = rawContacts.map((contact) => ({
      type: contact.type,
      value: contact.value,
      label: field(contact.translations, "label"),
    }));

    const locationQuery = locationQueryFromContacts(contacts);
    const mapLocation = await resolveOwnerMapLocation({
      mapLatitude: profile?.mapLatitude,
      mapLongitude: profile?.mapLongitude,
      mapLocationLabel: profile?.mapLocationLabel,
      contactQuery: locationQuery,
    });

    return {
      contacts,
      portfolioUrl: profile ? getTenantPublicUrl(profile) : null,
      displayName: user?.name ?? ctx.tenant.username,
      recipientReady: Boolean(user?.email),
      emailFormEnabled,
      mapLocation,
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

      const emailClient = await getPortfolioEmailClient(ctx.tenant.userId);

      if (
        !emailClient.isConfigured ||
        !emailClient.resend ||
        !emailClient.fromEmail
      ) {
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

      // Use the owner's preferred locale for the notification
      const ownerLocale: Locale = ctx.tenant.defaultLocale ?? "en";

      const contactTemplateId = await getPortfolioContactTemplateId(
        ownerLocale,
        ctx.tenant.userId,
      );

      if (!contactTemplateId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Contact email template is not configured for locale "${ownerLocale}".`,
        });
      }

      const sentAt = new Date().toLocaleString(ownerLocale, {
        dateStyle: "medium",
        timeStyle: "short",
      });

      const { error } = await emailClient.resend.emails.send(
        {
          from: emailClient.fromEmail,
          to: owner.email,
          replyTo: input.email,
          template: {
            id: contactTemplateId,
            variables: {
              SENDER_NAME: input.name,
              SENDER_EMAIL: input.email,
              MESSAGE: input.message,
              SENT_AT: sentAt,
            },
          },
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

      return { ok: true };
    }),
});
