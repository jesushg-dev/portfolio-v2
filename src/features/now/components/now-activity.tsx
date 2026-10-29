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
      className="bg-muted relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg shadow-lg"
    >
      {src ? (
        <MediaImage
          src={src}
          alt={title}
          fill
          sizes="3.5rem"
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
      <section className={nowSectionClassName}>
        <div className={nowContainerClassName}>
          <ProcessReveal>
            <h2 className={nowHeadingClassName}>{t("awayHeading")}</h2>
          </ProcessReveal>
          <div className="border-border mt-14 grid border-t md:grid-cols-3">
            <div className="border-border min-w-0 border-b py-8 md:border-r md:border-b-0 md:pr-8">
              <NowLastPlayed
                headingPlaying={t("nowPlaying")}
                headingLast={t("lastPlayed")}
                idleTitle={t("spotifyIdleTitle")}
                idleSubtitle={t("spotifyIdleSubtitle")}
              />
            </div>
            <div className="border-border flex min-w-0 items-center justify-between gap-5 border-b py-8 md:border-r md:border-b-0 md:px-8">
              <div className="min-w-0">
                <h3 className="text-muted-foreground text-sm">
                  {t("reading")}
                </h3>
                <p className="text-foreground mt-2 text-xl leading-tight font-semibold tracking-tight">
                  {data.readingTitle ?? t("noReading")}
                </p>
                {data.readingAuthors ? (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {data.readingAuthors}
                  </p>
                ) : null}
                {data.readingTitle ? (
                  <>
                    <p className="text-muted-foreground mt-1 text-sm tabular-nums">
                      {data.readingProgress}%
                    </p>
                    <div className="bg-border mt-4 h-0.5 max-w-48 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full"
                        style={{ width: String(data.readingProgress) + "%" }}
                      />
                    </div>
                  </>
                ) : null}
              </div>
              <ActivityCover
                src={data.readingCoverUrl}
                title={data.readingTitle ?? ""}
                kind="book"
              />
            </div>
            <div className="flex min-w-0 items-center justify-between gap-5 py-8 md:pl-8">
              <div className="min-w-0">
                <h3 className="text-muted-foreground text-sm">
                  {t("lastWatched")}
                </h3>
                <p className="text-foreground mt-2 text-xl leading-tight font-semibold tracking-tight">
                  {data.watchedTitle ?? t("noWatching")}
                </p>
                {data.watchedRating > 0 ? (
                  <p className="text-primary mt-2 text-sm tracking-widest">
                    <span aria-hidden>
                      {"★".repeat(Math.min(5, data.watchedRating))}
                      {"☆".repeat(Math.max(0, 5 - data.watchedRating))}
                    </span>
                    <span className="sr-only">{data.watchedRating}/5</span>
                  </p>
                ) : null}
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
              <h3 className="text-muted-foreground mb-5 text-sm">
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
      <section className={nowSectionClassName}>
        <div className={nowContainerClassName}>
          <ProcessReveal>
            <h2 className={nowHeadingClassName}>{t("shippingHeading")}</h2>
          </ProcessReveal>
          <div className="mt-12 max-w-xl">
            <NowGithubActivity activity={data.githubActivity} />
          </div>
          <div className="mt-16 md:mt-20">
            <NowContribGraph calendar={data.githubContributions} />
          </div>
        </div>
      </section>
    </>
  );
}
