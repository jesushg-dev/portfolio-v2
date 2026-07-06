import type { FC } from "react";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { AboutMeForm } from "@/features/profile/components/about-me-form";

interface Props {
  params: Promise<{ locale: string }>;
}

const AboutMePage: FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const aboutMe = await db.cvAboutMe.findUnique({ where: { userId } });

  return (
    <AboutMeForm
      locale={locale as Locale}
      initial={aboutMe?.aboutMe as Record<string, unknown> | null}
    />
  );
};

export default AboutMePage;
