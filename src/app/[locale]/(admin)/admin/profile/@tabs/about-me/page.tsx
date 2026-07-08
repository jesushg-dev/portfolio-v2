import type { FC } from "react";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/routing";

interface Props {
  params: Promise<{ locale: string }>;
}

const LegacyAboutMeRedirect: FC<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  redirect({ href: "/admin/profile", locale: locale as Locale });
};

export default LegacyAboutMeRedirect;
