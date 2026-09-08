import { Book, Film, ImageIcon, Zap } from "lucide-react";
import { MediaImage } from "@/components/shared/media-image";
import type { ReactNode } from "react";
import { FaGithub } from "react-icons/fa";

import { ProcessReveal } from "@/features/process-pages/components/process-reveal";
import { cn } from "@/lib/utils";

import { NowContribGraph } from "./now-contrib-graph";
import { NowLastPlayed } from "./now-last-played";
import { nowContainerClassName, nowSectionClassName } from "./now-layout";

interface NowActivityProps {
  title: string;
  labels: {
    lastStatus: string;
    lastPlayed: string;
    nowPlaying: string;
    reading: string;
    lastWatched: string;
    latestPhotos: string;
    latestGithub: string;
    contributions: string;
    reply: string;
    less: string;
    more: string;
    spotifyIdleTitle: string;
    spotifyIdleSubtitle: string;
  };
  statusEmoji: string;
  statusBody: string;
  statusRelative: string;
  readingTitle: string;
  readingAuthors: string;
  readingProgress: number;
  watchedTitle: string;
  watchedRating: number;
  photoUrls: string[];
  githubBody: ReactNode;
  githubRelative: string;
  contributionsTotal: string;
  photosAlt: string;
  githubUsername?: string | null;
}

export function NowActivity({
  title,
  labels,
  statusEmoji,
  statusBody,
  statusRelative,
  readingTitle,
  readingAuthors,
  readingProgress,
  watchedTitle,
  watchedRating,
  photoUrls,
  githubBody,
  githubRelative,
  contributionsTotal,
  photosAlt,
  githubUsername: _githubUsername,
}: NowActivityProps) {
  void _githubUsername;

  const photos =
    photoUrls.length > 0 ? photoUrls.slice(0, 3) : [null, null, null];

  return (
    <section className={cn(nowSectionClassName(true), "py-16 md:py-20")}>
      <div className={nowContainerClassName}>
        <ProcessReveal className="mb-8">
          <h2 className="text-foreground flex items-center gap-3.5 text-2xl font-extrabold tracking-tight sm:text-[27px]">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
              <Zap aria-hidden className="size-4" />
            </span>
            {title}
          </h2>
        </ProcessReveal>

        <div className="space-y-9">
          <ProcessReveal>
            <h3 className="text-muted-foreground mb-3 text-xs font-bold tracking-wide uppercase">
              {labels.lastStatus}
            </h3>
            <div className="flex items-start gap-4">
              <div
                className="bg-primary/10 flex size-11 shrink-0 items-center justify-center rounded-full text-xl"
                aria-hidden
              >
                {statusEmoji}
              </div>
              <div>
                <p className="text-muted-foreground text-sm">{statusBody}</p>
                <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
                  <span>{statusRelative}</span>
                  <span aria-hidden>·</span>
                  <span className="text-primary font-semibold">
                    {labels.reply}
                  </span>
                </div>
              </div>
            </div>
          </ProcessReveal>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <ProcessReveal>
              <NowLastPlayed
                headingPlaying={labels.nowPlaying}
                headingLast={labels.lastPlayed}
                idleTitle={labels.spotifyIdleTitle}
                idleSubtitle={labels.spotifyIdleSubtitle}
              />
            </ProcessReveal>

            <ProcessReveal delay={0.05}>
              <h3 className="text-muted-foreground mb-3 text-xs font-bold tracking-wide uppercase">
                {labels.reading}
              </h3>
              <div className="flex items-center gap-3.5">
                <div className="from-foreground/80 to-foreground flex size-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white">
                  <Book aria-hidden className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-foreground truncate text-sm font-bold">
                    {readingTitle}
                  </div>
                  <div className="text-muted-foreground truncate text-xs">
                    {readingAuthors}
                  </div>
                  <div className="bg-border mt-1.5 h-1 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${readingProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </ProcessReveal>

            <ProcessReveal delay={0.08}>
              <h3 className="text-muted-foreground mb-3 text-xs font-bold tracking-wide uppercase">
                {labels.lastWatched}
              </h3>
              <div className="flex items-center gap-3.5">
                <div className="from-muted-foreground to-foreground flex size-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white">
                  <Film aria-hidden className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-foreground truncate text-sm font-bold">
                    {watchedTitle}
                  </div>
                  <div
                    className="text-primary text-xs"
                    aria-label={`${watchedRating} of 5`}
                  >
                    {"★".repeat(Math.max(0, Math.min(5, watchedRating)))}
                    <span className="text-border">
                      {"★".repeat(Math.max(0, 5 - watchedRating))}
                    </span>
                  </div>
                </div>
              </div>
            </ProcessReveal>

            <ProcessReveal delay={0.1}>
              <h3 className="text-muted-foreground mb-3 text-xs font-bold tracking-wide uppercase">
                {labels.latestPhotos}
              </h3>
              <div
                className="grid grid-cols-3 gap-2"
                role="img"
                aria-label={photosAlt}
              >
                {photos.map((url, index) =>
                  url ? (
                    <div
                      key={url}
                      className="relative aspect-square overflow-hidden rounded-lg"
                    >
                      <MediaImage
                        src={url}
                        alt=""
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      key={`placeholder-${index}`}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-lg bg-linear-to-br text-white/70",
                        index === 0 && "from-primary to-muted-foreground",
                        index === 1 && "from-foreground to-primary",
                        index === 2 && "from-primary/80 to-foreground",
                      )}
                    >
                      <ImageIcon aria-hidden className="size-5" />
                    </div>
                  ),
                )}
              </div>
            </ProcessReveal>
          </div>

          <ProcessReveal>
            <h3 className="text-muted-foreground mb-3 text-xs font-bold tracking-wide uppercase">
              {labels.latestGithub}
            </h3>
            <div className="flex items-center gap-4">
              <div className="bg-foreground text-background flex size-9 shrink-0 items-center justify-center rounded-full">
                <FaGithub aria-hidden className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-sm">{githubBody}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {githubRelative}
                </p>
              </div>
            </div>
          </ProcessReveal>

          <ProcessReveal>
            <h3 className="text-muted-foreground mb-3 text-xs font-bold tracking-wide uppercase">
              {labels.contributions}
            </h3>
            <NowContribGraph
              totalLabel={contributionsTotal}
              lessLabel={labels.less}
              moreLabel={labels.more}
            />
          </ProcessReveal>
        </div>
      </div>
    </section>
  );
}
