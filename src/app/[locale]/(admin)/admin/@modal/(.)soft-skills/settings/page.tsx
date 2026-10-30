export { generateMetadata } from "../../../soft-skills/settings/metadata";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import { ModalWrapper } from "@/components/shared/modal-wrapper";
import { SoftSkillsSectionForm } from "@/features/soft-skills/components/soft-skills-section-form";
import {
  DEFAULT_SOFT_SKILLS_POSTER_URL,
  DEFAULT_SOFT_SKILLS_VIDEO_URL,
} from "@/features/soft-skills/lib/soft-skills-media";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";

export default async function SoftSkillsSettingsModal() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;
  const t = await getTranslations("admin.softSkills");

  const [sectionRecord, languages] = await Promise.all([
    db.softSkillsSection.findUnique({
      where: { userId },
      include: {
        metrics: {
          include: { SoftSkillsMetricTranslation: true },
          orderBy: { order: "asc" },
        },
      },
    }),
    db.appLanguage.findMany({
      orderBy: { code: "asc" },
    }),
  ]);

  const section =
    sectionRecord ??
    (await db.softSkillsSection.create({
      data: {
        userId,
        mediaType: "VIDEO",
        videoUrl: DEFAULT_SOFT_SKILLS_VIDEO_URL,
        posterUrl: DEFAULT_SOFT_SKILLS_POSTER_URL,
      },
      include: {
        metrics: {
          include: { SoftSkillsMetricTranslation: true },
          orderBy: { order: "asc" },
        },
      },
    }));

  return (
    <ModalWrapper
      title={t("sectionSettings")}
      description={t("sectionSettingsDescription")}
    >
      <SoftSkillsSectionForm initialData={section} languages={languages} />
    </ModalWrapper>
  );
}
