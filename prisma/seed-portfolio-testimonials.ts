import { readFileSync } from "node:fs";
import type { Prisma, PrismaClient } from "@prisma/client";

import { toLocalizedText, type LocaleMap } from "./lib/localized-text-seed";

interface TestimonialSeed {
  author: string;
  role: string;
  quote: LocaleMap;
  order: number;
}

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

  for (const item of testimonials) {
    await prisma.testimonial.create({
      data: {
        userId,
        author: item.author,
        role: item.role,
        quote: toLocalizedText(item.quote) as unknown as Prisma.InputJsonValue,
        order: item.order,
        isVisible: true,
      },
    });
  }
}
