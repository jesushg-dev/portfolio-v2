import {
  StackType,
  type CvSkillCategory,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";

type CatalogDb = PrismaClient | Prisma.TransactionClient;
const categoryTypes: Record<CvSkillCategory, StackType> = {
  FRONTEND: StackType.FRONTEND,
  BACKEND: StackType.BACKEND,
  DATABASE: StackType.DATA,
  TOOLS: StackType.TOOLS,
  MOBILE: StackType.MOBILE,
  DESKTOP: StackType.DESKTOP,
  DEVOPS: StackType.DEVOPS,
  CYBERSECURITY: StackType.CYBERSECURITY,
  OTHER: StackType.TOOLS,
};
export function normalizeSkillTitle(title: string): string {
  const normalized = title
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  if (normalized === "tailwind") return "tailwind css";
  if (normalized === "node-js" || normalized === "nodejs") return "node.js";
  return normalized;
}

/** Imports/seeds resolve names once. Persisted CV selections contain IDs only. */
export async function ensureCvSkillIds(
  db: CatalogDb,
  userId: string,
  titles: string[],
  category: CvSkillCategory,
): Promise<string[]> {
  const catalog = await db.skill.findMany({ where: { userId } });
  const ids: string[] = [];
  for (const value of titles) {
    const title = value.trim();
    if (!title) continue;
    const matches = catalog.filter(
      (skill) =>
        normalizeSkillTitle(skill.title) === normalizeSkillTitle(title),
    );
    let skill =
      matches.find((item) => item.title === title) ??
      (matches.length === 1 ? matches[0] : undefined);
    if (!skill && matches.length > 1)
      throw new Error(`Ambiguous catalogue skill: ${title}`);
    if (!skill) {
      skill = await db.skill.upsert({
        where: { userId_title: { userId, title } },
        update: {},
        create: { userId, title, type: categoryTypes[category], image: "" },
      });
      catalog.push(skill);
    }
    if (!ids.includes(skill.id)) ids.push(skill.id);
  }
  return ids;
}
