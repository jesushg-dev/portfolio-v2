import type { FC } from "react";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { HeroForm } from "@/features/profile/components/hero-form";

interface Props {
  params: Promise<{ locale: string }>;
}

const ProfilePage: FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const header = await db.cvHeader.findUnique({ where: { userId } });

  return (
    <HeroForm
      locale={locale as Locale}
      initial={
        header
          ? {
              fullName: header.fullName,
              photoUrl: header.photoUrl ?? "",
              degree: header.degree as {
                default: string;
                translations?: Record<string, string>;
              },
              clientImageAlt: (header.clientImageAlt ?? {
                default: "",
              }) as {
                default: string;
                translations?: Record<string, string>;
              },
            }
          : undefined
      }
    />
  );
};

export default ProfilePage;
