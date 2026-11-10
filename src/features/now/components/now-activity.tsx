import { Book, Film } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/shared/media-image";
import { ProcessReveal } from "@/features/process-pages/components/process-reveal";
import type { Locale } from "@/i18n/config";
import type { NowPublicPageData } from "../server/now-public";
import { NowContribGraph } from "./now-contrib-graph";
import { NowGithubActivity } from "./now-github-activity";
import { NowLastPlayed } from "./now-last-played";
import { NowHover } from "./now-hover";
import { NowPhotoStrip } from "./now-photo-strip";
import {
  nowContainerClassName,
  nowHeadingClassName,
  nowSectionClassName,
} from "./now-layout";
import { Link } from "@/i18n/routing";

function ActivityCover({
  src,
  title,
  kind,
}: {
  src: string | null;
  title: string;
  kind: "book" | "film";
}) {
  return (
    <NowHover
      cover
      className="bg-muted relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-xl shadow-md"
    >
      {src ? (
        <MediaImage
          src={src}
          alt={title}
          fill
          sizes="4rem"
          className="object-cover"
        />
      ) : (
        <span className="text-primary flex size-full items-center justify-center">
          {kind === "book" ? (
            <Book aria-hidden className="size-6" />
          ) : (
            <Film aria-hidden className="size-6" />
          )}
        </span>
      )}
    </NowHover>
  );
}

export async function NowActivity({
  data,
  locale,
}: {
  data: NowPublicPageData;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "main.now.activity" });

  return (
    <>
      {/* Away From The Keyboard */}
      <section className={nowSectionClassName}>
        <div className={nowContainerClassName}>
          <ProcessReveal>
            <h2 className={nowHeadingClassName}>{t("awayHeading")}</h2>
          </ProcessReveal>

          {/* 3 Border-Divided Columns from Redesign Prototype */}
          <div className="border-border/80 divide-border/80 mt-14 grid grid-cols-1 divide-y border-t md:grid-cols-3 md:divide-x md:divide-y-0">
            {/* Listening / Spotify */}
            <div className="flex min-w-0 items-center justify-between gap-4 py-8 first:pl-0 last:pr-0 md:px-8">
              <NowLastPlayed
                headingPlaying={t("nowPlaying")}
                headingLast={t("lastPlayed")}
                idleTitle={t("spotifyIdleTitle")}
                idleSubtitle={t("spotifyIdleSubtitle")}
              />
            </div>

            {/* Reading */}
            <div className="flex min-w-0 items-center justify-between gap-4 py-8 first:pl-0 last:pr-0 md:px-8">
              <div className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-xs font-semibold tracking-wider uppercase">
                  {t("reading")}
                </span>
                <p className="text-foreground mt-2 truncate text-xl font-semibold tracking-tight">
                  {data.readingTitle ?? t("noReading")}
                </p>
                {data.readingAuthors ? (
                  <p className="text-muted-foreground mt-1 truncate text-sm">
                    {data.readingAuthors}
                    {data.readingTitle ? ` · ${data.readingProgress}%` : ""}
                  </p>
                ) : null}
                {data.readingTitle ? (
                  <div className="bg-border/60 mt-3 h-1 w-full max-w-36 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${data.readingProgress}%` }}
                    />
                  </div>
                ) : null}
              </div>
              <ActivityCover
                src={data.readingCoverUrl}
                title={data.readingTitle ?? ""}
                kind="book"
              />
            </div>

            {/* Watched */}
            <div className="flex min-w-0 items-center justify-between gap-4 py-8 first:pl-0 last:pr-0 md:px-8">
              <div className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-xs font-semibold tracking-wider uppercase">
                  {t("lastWatched")}
                </span>
                <p className="text-foreground mt-2 truncate text-xl font-semibold tracking-tight">
                  {data.watchedTitle ?? t("noWatching")}
                </p>
                {data.watchedRating > 0 ? (
                  <p className="text-primary mt-1 text-sm tracking-widest">
                    <span aria-hidden>
                      {"★".repeat(Math.min(5, data.watchedRating))}
                      {"☆".repeat(Math.max(0, 5 - data.watchedRating))}
                    </span>
                    <span className="sr-only">{data.watchedRating}/5</span>
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t("noWatching")}
                  </p>
                )}
              </div>
              <ActivityCover
                src={data.watchedCoverUrl}
                title={data.watchedTitle ?? ""}
                kind="film"
              />
            </div>
          </div>

          {data.photoUrls.length ? (
            <div className="mt-14">
              <h3 className="text-muted-foreground mb-5 text-sm font-semibold tracking-wider uppercase">
                {t("latestPhotos")}
              </h3>
              <NowPhotoStrip
                photos={data.photoUrls.slice(0, 3)}
                alt={t("photosAlt")}
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* Shipping, in public */}
      <section className={nowSectionClassName}>
        <div className={nowContainerClassName}>
          <ProcessReveal>
            <div className="flex flex-col gap-2">
              <h2 className={nowHeadingClassName}>{t("shippingHeading")}</h2>
              <p className="text-muted-foreground text-base">
                {t("shippingDescription")}
              </p>
            </div>
          </ProcessReveal>
          <div className="mt-8 max-w-xl">
            <NowGithubActivity activity={data.githubActivity} />
          </div>
          <div className="mt-12 md:mt-16">
            <NowContribGraph calendar={data.githubContributions} />
          </div>
        </div>
      </section>

      {/* CTA Section from Prototype */}
      <section className="border-border/80 border-t bg-[radial-gradient(ellipse_60%_70%_at_50%_100%,color-mix(in_srgb,var(--primary)_22%,transparent),transparent_70%)] py-28 text-center">
        <div className={nowContainerClassName}>
          <ProcessReveal>
            <h2 className="text-foreground mx-auto max-w-xl text-3xl leading-tight font-bold tracking-tight sm:text-4xl md:text-5xl">
              {t("collaborateTitle")}
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 mb-8 max-w-md text-base leading-relaxed sm:text-lg">
              {t("collaborateSubtitle")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/schedule"
                className="bg-primary text-primary-foreground inline-flex min-h-11 items-center justify-center rounded-full px-8 py-3 text-sm font-medium transition-all hover:brightness-110"
              >
                {t("scheduleCall")}
              </Link>
              <a
                href="mailto:jesus.hernandez@jesushg.com"
                className="border-border text-foreground hover:bg-muted/40 inline-flex min-h-11 items-center justify-center rounded-full border bg-transparent px-8 py-3 text-sm font-medium transition-all"
              >
                {t("sendEmail")}
              </a>
            </div>
          </ProcessReveal>
        </div>
      </section>
    </>
  );
}
