import { readFileSync } from "node:fs";
import type { PrismaClient } from "@prisma/client";

import type { LocaleMap } from "./lib/localized-text-seed";

interface TestimonialSeed {
  author: string;
  role: string;
  avatarUrl?: string;
  linkedInUrl?: string;
  quote: LocaleMap;
  order: number;
}

type LocaleCode = "es" | "en" | "nl";

const testimonials = JSON.parse(
  readFileSync(
    new URL("./data/portfolio-testimonials.json", import.meta.url),
    "utf8",
  ),
) as TestimonialSeed[];

export async function seedPortfolioTestimonials(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  await prisma.testimonial.deleteMany({ where: { userId } });

  const appLanguages = await prisma.appLanguage.findMany();

  for (const item of testimonials) {
    await prisma.testimonial.create({
      data: {
        userId,
        author: item.author,
        role: item.role,
        avatarUrl: item.avatarUrl ?? null,
        linkedInUrl: item.linkedInUrl ?? null,
        order: item.order,
        isVisible: true,
        TestimonialTranslation: {
          create: appLanguages.map((lang) => ({
            appLanguageId: lang.id,
            quote: item.quote[lang.code as LocaleCode] ?? item.quote.es ?? "",
          })),
        },
      },
    });
  }
}
