import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import HeaderArticle from "@/components/shared/header-article";
import { TimelineVertical } from "@/features/timeline/components/timeline-vertical";
import { api } from "@/trpc/server";
import { type Locale as AppLocale, locales } from "@/i18n/config";

import { generateMetadata } from "./metadata";

export { generateMetadata };

interface TimelinePageProps {
  params: Promise<{
    locale: AppLocale;
  }>;
}

const isLocale = (value: string): value is AppLocale =>
  (locales as readonly string[]).includes(value);

export default async function TimelinePage({ params }: TimelinePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = await getTranslations("main.timeline");

  const items = await api.portfolio.getTimelinePublic({ locale });

  return (
    <section className="bg-background-50 min-h-screen pt-24 pb-16">
      <div className="mx-auto px-4 lg:container lg:px-20">
        <HeaderArticle
          title={t("title")}
          subtitle={t("subtitle")}
          description=""
        />

        {items.length > 0 ? (
          <TimelineVertical items={items} />
        ) : (
          <p className="text-primaryText-500 text-center text-base">
            {t("empty")}
          </p>
        )}
      </div>
    </section>
  );
}
