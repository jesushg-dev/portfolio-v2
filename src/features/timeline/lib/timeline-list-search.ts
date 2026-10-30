import type { Prisma } from "@prisma/client";

export function buildTimelineItemSearchConditions(
  query: string,
): Prisma.TimelineItemWhereInput[] {
  return query
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map<Prisma.TimelineItemWhereInput>((term) => ({
      OR: [
        { organization: { contains: term, mode: "insensitive" } },
        {
          TimelineItemTranslation: {
            some: {
              OR: [
                { title: { contains: term, mode: "insensitive" } },
                { description: { contains: term, mode: "insensitive" } },
              ],
            },
          },
        },
        {
          TimelineItemSkill: {
            some: {
              skill: { title: { contains: term, mode: "insensitive" } },
            },
          },
        },
      ],
    }));
}
