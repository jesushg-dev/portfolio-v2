import { setRequestLocale } from "next-intl/server";
import type { Locale } from "next-intl";

export { generateMetadata } from "./metadata";

import { redirect } from "@/i18n/routing";
import { SchedulePage } from "@/features/home/components/schedule/schedule-page";
import { getScheduleCalendlyUrl } from "@/features/home/components/schedule/get-schedule-calendly-url";

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
