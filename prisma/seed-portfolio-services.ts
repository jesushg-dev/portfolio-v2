import { readFileSync } from "node:fs";
import type { PrismaClient, Service, StackType } from "@prisma/client";
import type {
  ServiceVisualNode,
  ServiceVisualType,
} from "../src/features/services/lib/service-visual";

export interface PortfolioServiceSeed {
  key: string;
  type: StackType;
  icon?: string;
  visualType?: ServiceVisualType;
  skillTitles?: string[];
  statsValue?: string;
  featured?: boolean;
  isActive?: boolean;
  order?: number;
  image: string;
  translations: {
    locale: "es" | "en" | "nl";
    title: string;
    description: string;
    badge?: string;
    statsLabel?: string;
    practicePoints?: string;
    visualNodes?: ServiceVisualNode[];
  }[];
}

const portfolioServices = JSON.parse(
  readFileSync(
    new URL("./data/portfolio-services.json", import.meta.url),
    "utf8",
  ),
) as PortfolioServiceSeed[];

/** Add the owner's curated service content without deleting services, translations or skill links. */
export async function seedPortfolioServices(
  prisma: PrismaClient,
  langIds: Record<"es" | "en" | "nl", string>,
  userId: string,
): Promise<Record<string, Service>> {
  const result: Record<string, Service> = {};
  const [existingServices, skills] = await Promise.all([
    prisma.service.findMany({
      where: { userId },
      include: { ServiceTranslation: true, ServiceSkill: true },
    }),
    prisma.skill.findMany({
      where: { userId },
      select: { id: true, title: true },
    }),
  ]);

  for (const service of portfolioServices) {
    const titles = service.translations.map((translation) => translation.title);
    const sameType = existingServices.filter(
      (existing) => existing.type === service.type,
    );
    const existing =
      sameType.find((candidate) =>
        candidate.ServiceTranslation.some((translation) =>
          titles.includes(translation.title),
        ),
      ) ?? (sameType.length === 1 ? sameType[0] : undefined);
    if (!existing && sameType.length > 1)
      throw new Error(
        `Ambiguous service type: ${service.type}. Select the service in the administrator before importing.`,
      );

    const record = existing
      ? await prisma.service.update({
          where: { id: existing.id, userId },
          data: {
            visualType:
              existing.visualType && existing.visualType !== "network"
                ? existing.visualType
                : (service.visualType ?? "network"),
          },
        })
      : await prisma.service.create({
          data: {
            userId,
            type: service.type,
            image: service.image,
            icon: service.icon ?? "code",
            visualType: service.visualType ?? "network",
            statsValue: service.statsValue ?? "",
            featured: service.featured ?? false,
            isActive: service.isActive ?? true,
            order: service.order ?? 0,
          },
        });

    for (const translation of service.translations) {
      const appLanguageId = langIds[translation.locale];
      const current = existing?.ServiceTranslation.find(
        (row) => row.appLanguageId === appLanguageId,
      );
      if (current) {
        await prisma.serviceTranslation.update({
          where: { id: current.id },
          data: {
            practicePoints: current.practicePoints?.trim()
              ? current.practicePoints
              : (translation.practicePoints ?? ""),
            visualNodes:
              Array.isArray(current.visualNodes) && current.visualNodes.length
                ? current.visualNodes
                : (translation.visualNodes ?? []),
          },
        });
      } else {
        await prisma.serviceTranslation.create({
          data: {
            serviceId: record.id,
            appLanguageId,
            title: translation.title,
            description: translation.description,
            badge: translation.badge ?? "",
            statsLabel: translation.statsLabel ?? "",
            practicePoints: translation.practicePoints ?? "",
            visualNodes: translation.visualNodes ?? [],
          },
        });
      }
    }

    const skillIds = skills
      .filter((skill) =>
        service.skillTitles?.some(
          (title) =>
            title.toLocaleLowerCase() === skill.title.toLocaleLowerCase(),
        ),
      )
      .map((skill) => skill.id);
    const linkedIds = new Set(
      existing?.ServiceSkill.map((link) => link.skillId) ?? [],
    );
    const missing = skillIds.filter((skillId) => !linkedIds.has(skillId));
    if (missing.length)
      await prisma.serviceSkill.createMany({
        data: missing.map((skillId) => ({ serviceId: record.id, skillId })),
      });
    result[service.key] = record;
  }
  return result;
}
