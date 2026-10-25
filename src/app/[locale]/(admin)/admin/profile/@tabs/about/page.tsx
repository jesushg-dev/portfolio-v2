import type { FC } from "react";
import { headers } from "next/headers";

export { generateMetadata } from "./metadata";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { ProfileUnifiedEditor } from "@/features/profile/components/profile-unified-editor";
import {
  getProfileAboutEditorDto,
  getProfileHeroEditorDto,
} from "@/features/profile/server/profile-admin.router";
import { getTerminalEditorDto } from "@/features/terminal/server/terminal.router";

const AboutSectionPage: FC = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const [languages, initialHero, initialAbout, initialTerminal] =
    await Promise.all([
      db.appLanguage.findMany({ orderBy: { code: "asc" } }),
      getProfileHeroEditorDto(db, userId),
      getProfileAboutEditorDto(db, userId),
      getTerminalEditorDto(db, userId),
    ]);

  return (
    <ProfileUnifiedEditor
      languages={languages}
      initialHero={initialHero}
      initialAbout={initialAbout}
      initialTerminal={initialTerminal}
      initialTab="about"
    />
  );
};

export default AboutSectionPage;
