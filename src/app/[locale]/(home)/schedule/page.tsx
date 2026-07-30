import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "next-intl";
import type { Metadata } from "next";

import { redirect } from "@/i18n/routing";
import { SchedulePage } from "@/features/home/components/schedule/schedule-page";
import { getScheduleCalendlyUrl } from "@/features/home/components/schedule/get-schedule-calendly-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "main.contact",
  });

  return {
    title: t("schedulePageTitle"),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const calendlyUrl = await getScheduleCalendlyUrl();
  if (!calendlyUrl) {
    redirect({ href: "/", locale: locale as Locale });
    return null;
  }

  return <SchedulePage calendlyUrl={calendlyUrl} />;
}
