import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { FaqItemsSchema } from "../../src/features/home/lib/faq-content";

const FaqSeedSchema = z.object({
  translations: z.array(
    z.object({
      locale: z.enum(["es", "en", "nl"]),
      items: FaqItemsSchema,
    }),
  ),
});

/** Restores a tenant's FAQ without touching other translated profile fields. */
export async function restorePortfolioFaq(
  prisma: PrismaClient,
  userId: string,
  langIds: Record<"es" | "en" | "nl", string>,
  source: unknown,
) {
  const data = FaqSeedSchema.parse(source);
  if (data.translations.length === 0) return;
  const header = await prisma.portfolioHeader.upsert({
    where: { userId },
    create: { userId, fullName: "" },
    update: {},
  });
  for (const translation of data.translations) {
    const appLanguageId = langIds[translation.locale];
    await prisma.portfolioHeaderTranslation.upsert({
      where: {
        portfolioHeaderId_appLanguageId: {
          portfolioHeaderId: header.id,
          appLanguageId,
        },
      },
      create: {
        portfolioHeaderId: header.id,
        appLanguageId,
        faqItems: translation.items,
      },
      update: { faqItems: translation.items },
    });
  }
}
