import type { FC } from "react";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { ProfileHeroForm } from "@/features/profile/components/profile-hero-form";
import { getHeroTitlesEditorDto } from "@/features/profile/server/hero-titles";

interface Props {
  params: Promise<{ locale: string }>;
}

const ProfilePage: FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const [languages, header, aboutMe, heroTitles] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    db.cvHeader.findUnique({ where: { userId } }),
    db.cvAboutMe.findUnique({ where: { userId } }),
    getHeroTitlesEditorDto(db, userId),
  ]);

  return (
    <ProfileHeroForm
      languages={languages}
      header={header}
      aboutMe={aboutMe}
      heroTitles={heroTitles}
    />
  );
};

export default ProfilePage;
