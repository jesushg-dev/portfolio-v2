import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import { SoftSkillsSectionForm } from "@/features/soft-skills/components/soft-skills-section-form";
import {
  DEFAULT_SOFT_SKILLS_POSTER_URL,
  DEFAULT_SOFT_SKILLS_VIDEO_URL,
} from "@/features/soft-skills/lib/soft-skills-media";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";

export default async function SoftSkillsSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;
  const t = await getTranslations("admin.softSkills");

  const sectionRecord = await db.softSkillsSection.findUnique({
    where: { userId },
  });

  const section =
    sectionRecord ??
    (await db.softSkillsSection.create({
      data: {
        userId,
        mediaType: "VIDEO",
        videoUrl: DEFAULT_SOFT_SKILLS_VIDEO_URL,
        posterUrl: DEFAULT_SOFT_SKILLS_POSTER_URL,
      },
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("sectionSettings")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("sectionSettingsDescription")}
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <SoftSkillsSectionForm initialData={section} />
      </div>
    </div>
  );
}
