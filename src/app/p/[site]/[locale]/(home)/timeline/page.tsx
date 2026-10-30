import { notFound } from "next/navigation";

import { TimelineView } from "@/features/timeline/components/timeline-view";
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

  const items = await api.portfolio.getTimelinePublic({ locale });

  return (
    <main className="bg-background min-h-screen pt-24 pb-20">
      <div className="mx-auto px-4 sm:px-6 lg:container lg:px-8">
        <TimelineView items={items} />
      </div>
    </main>
  );
}
