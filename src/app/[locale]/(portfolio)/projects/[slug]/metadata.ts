import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { type Locale } from "@/i18n/config";
import { api } from "@/trpc/server";

interface ProjectMetadataProps {
  params: Promise<{
    locale: Locale;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProjectMetadataProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "main.portfolio" });
  const project = await api.portfolio.getProjectBySlug({ slug, locale });

  if (!project) {
    return { title: t("private.title") };
  }

  const title = project.title?.trim() || t("private.title");

  return {
    title: `${title} · ${t("subtitle")}`,
    description: project.description ?? undefined,
  };
}
