import type { FC } from "react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { ProfileHeroForm } from "@/features/profile/components/profile-hero-form";
import { getProfileHeroEditorDto } from "@/features/profile/server/profile-admin.router";

const ProfilePage: FC = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const [languages, initialData] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    getProfileHeroEditorDto(db, userId),
  ]);

  return <ProfileHeroForm languages={languages} initialData={initialData} />;
};

export default ProfilePage;
