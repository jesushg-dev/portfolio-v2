import type { FC } from "react";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { ConsoleForm } from "@/features/profile/components/console-form";

interface Props {
  params: Promise<{ locale: string }>;
}

const ConsolePage: FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const aboutMe = await db.cvAboutMe.findUnique({ where: { userId } });

  return (
    <ConsoleForm initial={aboutMe?.aboutMe as Record<string, unknown> | null} />
  );
};

export default ConsolePage;
