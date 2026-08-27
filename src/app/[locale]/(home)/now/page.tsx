import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { NowActivity } from "@/features/now/components/now-activity";
import { NowHero } from "@/features/now/components/now-hero";
import { NowList } from "@/features/now/components/now-list";
import { NowNote } from "@/features/now/components/now-note";
import { buildContributionYear } from "@/features/now/lib/contrib-year";
import { getNowPageData } from "@/features/now/server/now-public";
import { ProcessPageShell } from "@/features/process-pages/components/process-section-header";
import { type Locale as AppLocale, locales } from "@/i18n/config";
import { isPublicPageLive } from "@/lib/public-preview-pages";

export { generateMetadata } from "./metadata";

interface NowRouteProps {
  params: Promise<{ locale: AppLocale }>;
}

const isLocale = (value: string): value is AppLocale =>
  (locales as readonly string[]).includes(value);

export default async function NowPage({ params }: NowRouteProps) {
  if (!isPublicPageLive("now")) notFound();

  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const [t, data] = await Promise.all([
    getTranslations("main.now"),
    getNowPageData(locale),
  ]);

  if (!data) notFound();

  const { total: contribTotal } = buildContributionYear();
  const bookTitle = data.readingTitle ?? t("list.reading.book");
  const githubHref = data.githubHref ?? "#";
  const githubRepo = data.githubRepo ?? "";

  return (
    <ProcessPageShell>
      <NowHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        titleHighlight={t("hero.titleHighlight")}
        description={t("hero.description")}
      />

      <NowList
        localTimeLabel={t("list.localTimeLabel")}
        readingLabel={t("list.readingLabel")}
        book={bookTitle}
        focusesLabel={t("list.focusesLabel")}
        timezone={data.timezone}
        focuses={data.focuses}
      />

      <NowNote
        before={t("note.before")}
        linkLabel={t("note.linkLabel")}
        after={t("note.after")}
      />

      <NowActivity
        title={t("activity.title")}
        labels={{
          lastStatus: t("activity.lastStatus"),
          lastPlayed: t("activity.lastPlayed"),
          nowPlaying: t("activity.nowPlaying"),
          reading: t("activity.reading"),
          lastWatched: t("activity.lastWatched"),
          latestPhotos: t("activity.latestPhotos"),
          latestGithub: t("activity.latestGithub"),
          contributions: t("activity.contributions"),
          reply: t("activity.reply"),
          less: t("activity.less"),
          more: t("activity.more"),
          spotifyIdleTitle: t("activity.spotifyIdleTitle"),
          spotifyIdleSubtitle: t("activity.spotifyIdleSubtitle"),
        }}
        statusEmoji={data.statusEmoji}
        statusBody={data.statusBody}
        statusRelative={data.statusRelative}
        readingTitle={data.readingTitle ?? ""}
        readingAuthors={data.readingAuthors ?? ""}
        readingProgress={data.readingProgress}
        watchedTitle={data.watchedTitle ?? ""}
        watchedRating={data.watchedRating}
        photoUrls={data.photoUrls}
        githubBody={
          <>
            {data.githubBody}{" "}
            {githubRepo ? (
              <a
                href={githubHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline"
              >
                {githubRepo}
              </a>
            ) : null}
          </>
        }
        githubRelative={data.githubRelative}
        contributionsTotal={t("activity.contributionsTotal", {
          total: contribTotal.toLocaleString(locale),
        })}
        photosAlt={t("activity.photosAlt")}
        githubUsername={data.githubUsername}
      />
    </ProcessPageShell>
  );
}
