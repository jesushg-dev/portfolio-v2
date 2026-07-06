import type { FC } from "react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import AboutForm from "./about-form";

interface Props {
  params: Promise<{ locale: string }>;
}

const AboutPage: FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("admin.about");

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const [aboutMe, experiences] = await Promise.all([
    db.cvAboutMe.findUnique({ where: { userId } }),
    db.cvExperience.findMany({
      where: { userId },
      include: { responsibilities: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>
      <AboutForm
        locale={locale as Locale}
        initialAboutMe={aboutMe?.aboutMe as Record<string, unknown> | null}
        initialExperiences={experiences}
      />
    </div>
  );
};

export default AboutPage;
