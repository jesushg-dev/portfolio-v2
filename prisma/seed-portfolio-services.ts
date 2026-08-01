import { readFileSync } from "node:fs";
import type { PrismaClient, Service, StackType } from "@prisma/client";

export interface PortfolioServiceSeed {
  key: string;
  type: StackType;
  icon?: string;
  statsValue?: string;
  featured?: boolean;
  order?: number;
  image: string;
  translations: {
    locale: "es" | "en" | "nl";
    title: string;
    description: string;
    badge?: string;
    statsLabel?: string;
  }[];
}

const portfolioServices = JSON.parse(
  readFileSync(
    new URL("./data/portfolio-services.json", import.meta.url),
    "utf8",
  ),
) as PortfolioServiceSeed[];

export async function seedPortfolioServices(
  prisma: PrismaClient,
  langIds: Record<"es" | "en" | "nl", string>,
  userId: string,
): Promise<Record<string, Service>> {
  const result: Record<string, Service> = {};

  await prisma.service.deleteMany({ where: { userId } });

  for (const service of portfolioServices) {
    const created = await prisma.service.create({
      data: {
        userId,
        type: service.type,
        image: service.image,
        icon: service.icon ?? "code",
        statsValue: service.statsValue ?? "",
        featured: service.featured ?? false,
        order: service.order ?? 0,
        ServiceTranslation: {
          createMany: {
            data: service.translations.map((translation) => ({
              title: translation.title,
              description: translation.description,
              badge: translation.badge ?? "",
              statsLabel: translation.statsLabel ?? "",
              appLanguageId: langIds[translation.locale],
            })),
          },
        },
      },
    });

    result[service.key] = created;
  }

  return result;
}
