import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NowActivity } from "@/features/now/components/now-activity";
import { NowHero } from "@/features/now/components/now-hero";
import { NowList } from "@/features/now/components/now-list";
import { NowNote } from "@/features/now/components/now-note";
import { NowRoutine } from "@/features/now/components/now-routine";
import { getNowPageData } from "@/features/now/server/now-public";
import { type Locale as AppLocale, locales } from "@/i18n/config";

export { generateMetadata } from "./metadata";
interface NowRouteProps {
  params: Promise<{ locale: AppLocale }>;
}
const isLocale = (value: string): value is AppLocale =>
  (locales as readonly string[]).includes(value);

export default async function NowPage({ params }: NowRouteProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [t, data] = await Promise.all([
    getTranslations({ locale, namespace: "main.now" }),
    getNowPageData(locale),
  ]);
  if (!data) notFound();
  const topics = new Intl.ListFormat(locale, {
    style: "long",
    type: "conjunction",
  }).format(data.focuses.map((focus) => focus.label));
  return (
    <main className="bg-background text-foreground min-h-screen pb-8">
      <NowHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        titleHighlight={t("hero.titleHighlight")}
        description={t("hero.description")}
      >
        <NowRoutine
          schedule={data.statusSchedule}
          timezone={data.timezone}
          initialNow={new Date().toISOString()}
        />
      </NowHero>
      <NowList
        heading={
          topics ? t("list.focusSummary", { topics }) : t("list.focusesLabel")
        }
        focuses={data.focuses}
        statusBody={data.statusBody}
        statusEmoji={data.statusEmoji}
        statusRelative={data.statusRelative}
      />
      <NowActivity data={data} locale={locale} />
      <NowNote
        description={t("note.description")}
        linkLabel={t("note.linkLabel")}
        inspiredBy={t("note.inspiredBy")}
      />
    </main>
  );
}
