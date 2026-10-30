import type { Prisma } from "@prisma/client";
import { extractStringFilter } from "@/lib/admin/filter-utils";
import type { DataTableFilter } from "@/lib/admin/data-table-schemas";

export function buildCertificationListWhere(
  userId: string,
  filters: DataTableFilter[] | undefined,
): Prisma.CertificationWhereInput {
  const where: Prisma.CertificationWhereInput = { userId };
  const title = extractStringFilter(filters, "title");
  if (title) {
    where.CertificationTranslation = {
      some: { title: { contains: title, mode: "insensitive" } },
    };
  }
  const company = extractStringFilter(filters, "company");
  if (company) where.company = { contains: company, mode: "insensitive" };
  const terms = extractStringFilter(filters, "search")
    ?.trim()
    .split(/\s+/u)
    .filter(Boolean);
  if (terms?.length) {
    where.AND = terms.map<Prisma.CertificationWhereInput>((term) => ({
      OR: [
        {
          CertificationTranslation: {
            some: { title: { contains: term, mode: "insensitive" } },
          },
        },
        { company: { contains: term, mode: "insensitive" } },
        { idCredential: { contains: term, mode: "insensitive" } },
        {
          CertificateSkill: {
            some: { Skill: { title: { contains: term, mode: "insensitive" } } },
          },
        },
      ],
    }));
  }
  return where;
}
