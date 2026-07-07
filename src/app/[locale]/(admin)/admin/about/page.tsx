import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/routing";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function LegacyAboutRedirect({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  redirect({ href: "/admin/profile/about-me", locale: locale as Locale });
}
