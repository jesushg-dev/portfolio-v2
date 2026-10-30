import type { PrismaClient } from "@prisma/client";
import type { CvSkillCategory } from "@prisma/client";
import type { CvImportSkillDraft } from "@/features/cv/lib/cv-import-draft";

export interface ResolvedUserTechnicalSkill extends CvImportSkillDraft {
  id: string;
  category: CvSkillCategory;
  items: string[];
  order: number;
  skillIds: string[];
}

/** Resolves only explicitly visible catalogue selections, in the saved order. */
export async function resolveUserTechnicalSkills(
  db: PrismaClient,
  userId: string,
  includeEmpty = false,
): Promise<ResolvedUserTechnicalSkill[]> {
  const groups = await db.cvTechnicalSkill.findMany({
    where: { userId },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    include: {
      selections: {
        where: { visible: true },
        include: { skill: true },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      },
    },
  });
  return groups
    .map((group) => ({
      id: group.id,
      category: group.category,
      order: group.order,
      items: group.selections
        .filter((selection) => selection.skill.userId === userId)
        .map((selection) => selection.skill.title),
      skillIds: group.selections
        .filter((selection) => selection.skill.userId === userId)
        .map((selection) => selection.skillId),
    }))
    .filter((group) => includeEmpty || group.items.length > 0);
}
