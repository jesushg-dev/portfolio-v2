import type { PrismaClient } from "@prisma/client";
import { CvSkillCategory, StackType } from "@prisma/client";
import type { CvImportSkillDraft } from "@/features/cv/lib/cv-import-draft";

export function mapStackTypeToCvCategory(
  type: StackType,
): CvSkillCategory | null {
  switch (type) {
    case StackType.FRONTEND:
      return CvSkillCategory.FRONTEND;
    case StackType.BACKEND:
    case StackType.ARCHITECTURE:
      return CvSkillCategory.BACKEND;
    case StackType.DATA:
      return CvSkillCategory.DATABASE;
    case StackType.DEVOPS:
      return CvSkillCategory.DEVOPS;
    case StackType.TOOLS:
    case StackType.QUALITY_DELIVERY:
    case StackType.AI:
      return CvSkillCategory.TOOLS;
    case StackType.MOBILE:
      return CvSkillCategory.MOBILE;
    case StackType.DESKTOP:
      return CvSkillCategory.DESKTOP;
    case StackType.CYBERSECURITY:
      return CvSkillCategory.CYBERSECURITY;
    case StackType.SOFTSKILLS:
      return null;
    default:
      return CvSkillCategory.OTHER;
  }
}

const CANONICAL_CATEGORY_ORDER: CvSkillCategory[] = [
  CvSkillCategory.FRONTEND,
  CvSkillCategory.BACKEND,
  CvSkillCategory.DATABASE,
  CvSkillCategory.DEVOPS,
  CvSkillCategory.TOOLS,
  CvSkillCategory.MOBILE,
  CvSkillCategory.CYBERSECURITY,
  CvSkillCategory.DESKTOP,
  CvSkillCategory.OTHER,
];

export interface ResolvedUserTechnicalSkill extends CvImportSkillDraft {
  id: string;
  category: CvSkillCategory;
  items: string[];
  order: number;
}

/**
 * Resolves technical skills for a user by merging portfolio skills (`db.skill`)
 * with any custom/existing CV technical skills (`db.cvTechnicalSkill`).
 * Portfolio skills that the user added are prioritized and grouped by category.
 */
export async function resolveUserTechnicalSkills(
  db: PrismaClient,
  userId: string,
): Promise<ResolvedUserTechnicalSkill[]> {
  const [cvTechnicalSkills, portfolioSkills] = await Promise.all([
    db.cvTechnicalSkill.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    db.skill?.findMany
      ? db.skill.findMany({
          where: { userId },
          orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  if (portfolioSkills.length === 0 && cvTechnicalSkills.length > 0) {
    return cvTechnicalSkills.map((s, index) => ({
      id: s.id,
      category: s.category,
      items: s.items,
      order: s.order ?? index,
    }));
  }

  const categoryItemsMap = new Map<CvSkillCategory, string[]>();
  const existingCategoryMap = new Map<CvSkillCategory, string>();

  // 1. Add portfolio skills first
  for (const s of portfolioSkills) {
    const cat = mapStackTypeToCvCategory(s.type);
    if (!cat) continue;

    if (!categoryItemsMap.has(cat)) {
      categoryItemsMap.set(cat, []);
    }
    const list = categoryItemsMap.get(cat)!;
    if (
      !list.some((existing) => existing.toLowerCase() === s.title.toLowerCase())
    ) {
      list.push(s.title);
    }
  }

  // 2. Merge existing cvTechnicalSkill items if not already present
  for (const cvSkill of cvTechnicalSkills) {
    existingCategoryMap.set(cvSkill.category, cvSkill.id);

    if (!categoryItemsMap.has(cvSkill.category)) {
      categoryItemsMap.set(cvSkill.category, []);
    }
    const list = categoryItemsMap.get(cvSkill.category)!;
    for (const item of cvSkill.items) {
      if (
        !list.some((existing) => existing.toLowerCase() === item.toLowerCase())
      ) {
        list.push(item);
      }
    }
  }

  const result: ResolvedUserTechnicalSkill[] = [];
  let order = 0;
  for (const cat of CANONICAL_CATEGORY_ORDER) {
    const items = categoryItemsMap.get(cat);
    if (items && items.length > 0) {
      result.push({
        id: existingCategoryMap.get(cat) ?? `tech-skill-${cat.toLowerCase()}`,
        category: cat,
        items,
        order: order++,
      });
    }
  }

  // Any remaining categories not in CANONICAL_CATEGORY_ORDER
  for (const [cat, items] of categoryItemsMap.entries()) {
    if (!CANONICAL_CATEGORY_ORDER.includes(cat) && items.length > 0) {
      result.push({
        id: existingCategoryMap.get(cat) ?? `tech-skill-${cat.toLowerCase()}`,
        category: cat,
        items,
        order: order++,
      });
    }
  }

  return result;
}
