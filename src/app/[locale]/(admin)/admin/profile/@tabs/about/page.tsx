import type { FC } from "react";
import { headers } from "next/headers";

export { generateMetadata } from "./metadata";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { AboutBioForm } from "@/features/profile/components/about-bio-form";
import { ConsoleForm } from "@/features/profile/components/console-form";
import { getProfileAboutEditorDto } from "@/features/profile/server/profile-admin.router";

const AboutSectionPage: FC = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const [languages, aboutData] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    getProfileAboutEditorDto(db, userId),
  ]);

  return (
    <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-2">
      <div className="border-border/60 bg-muted/10 rounded-xl border p-5 shadow-xs sm:p-6">
        <AboutBioForm languages={languages} initialData={aboutData} />
      </div>
      <div className="border-border/60 bg-muted/10 rounded-xl border p-5 shadow-xs sm:p-6">
        <ConsoleForm languages={languages} />
      </div>
    </div>
  );
};

export default AboutSectionPage;
