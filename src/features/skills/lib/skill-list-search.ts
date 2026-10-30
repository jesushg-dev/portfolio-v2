import { StackType, type Prisma } from "@prisma/client";

export function buildSkillSearchConditions(
  query: string,
): Prisma.SkillWhereInput[] {
  return query
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map<Prisma.SkillWhereInput>((term) => ({
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        {
          SkillTranslation: {
            some: { description: { contains: term, mode: "insensitive" } },
          },
        },
        {
          type: {
            in: Object.values(StackType).filter((type) =>
              type
                .replaceAll("_", " ")
                .toLowerCase()
                .includes(term.toLowerCase()),
            ),
          },
        },
      ],
    }));
}
