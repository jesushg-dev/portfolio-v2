import { StackType, type Prisma } from "@prisma/client";
import { extractStringFilter } from "@/lib/admin/filter-utils";
import type { DataTableFilter } from "@/lib/admin/data-table-schemas";

export function buildServiceListWhere(
  userId: string,
  filters: DataTableFilter[] | undefined,
): Prisma.ServiceWhereInput {
  const where: Prisma.ServiceWhereInput = { userId };
  const title = extractStringFilter(filters, "title");
  if (title) {
    where.ServiceTranslation = {
      some: { title: { contains: title, mode: "insensitive" } },
    };
  }
  const category = extractStringFilter(filters, "type");
  if (category) {
    where.type = Object.values(StackType).find((type) => type === category) ?? {
      in: [],
    };
  }
  const terms = extractStringFilter(filters, "search")
    ?.trim()
    .split(/\s+/u)
    .filter(Boolean);
  if (terms?.length) {
    where.AND = terms.map<Prisma.ServiceWhereInput>((term) => ({
      OR: [
        {
          ServiceTranslation: {
            some: {
              OR: [
                { title: { contains: term, mode: "insensitive" } },
                { description: { contains: term, mode: "insensitive" } },
                { badge: { contains: term, mode: "insensitive" } },
              ],
            },
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
        {
          ServiceSkill: {
            some: { Skill: { title: { contains: term, mode: "insensitive" } } },
          },
        },
      ],
    }));
  }
  return where;
}
