import "server-only";

import { getTranslations } from "next-intl/server";
import { getPublicLocale } from "@/lib/public-site/locale";
import { ProjectCatalogItem } from "@/features/projects/components/project-catalog-item";
import type { SkillDetailType } from "@/utils/interfaces/types";

const KIND_KEYS = ["PROFESSIONAL", "PERSONAL", "LEARNING"] as const;
type ProjectKindKey = (typeof KIND_KEYS)[number];
const isProjectKindKey = (k: unknown): k is ProjectKindKey =>
  typeof k === "string" && KIND_KEYS.includes(k as ProjectKindKey);

interface SkillProjectCardProps {
  project: SkillDetailType["projects"][number];
}

export async function SkillProjectCard({ project }: SkillProjectCardProps) {
  const t = await getTranslations({
    locale: await getPublicLocale(),
    namespace: "main.skills",
  });

  const kindLabel =
    project.kind && isProjectKindKey(project.kind)
      ? t(`page.kind.${project.kind}`)
      : (project.kind ?? "");

  return (
    <ProjectCatalogItem
      project={project}
      readCaseStudyLabel={t("page.caseStudy")}
      kindLabel={kindLabel}
    />
  );
}
