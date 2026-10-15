"use client";

import { useCallback, useEffect, useState, type FC } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRightIcon, Quote } from "lucide-react";

import { Link } from "@/i18n/routing";
import { MediaImage } from "@/components/shared/media-image";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicCvVisible } from "@/components/app-layout/public-cv-visible";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role?: string | null;
  avatarUrl?: string | null;
  linkedInUrl?: string | null;
}

interface SocialProofStats {
  yearsExperience: number;
  projectsCount: number;
  certificationsCount: number;
  engineersMentored: number;
}

interface SocialProofProps {
  stats: SocialProofStats;
  testimonials?: TestimonialItem[];
}

function AuthorName({
  author,
  linkedInUrl,
}: {
  author: string;
  linkedInUrl?: string | null;
}) {
  if (!linkedInUrl) {
    return (
      <b className="text-foreground block text-base font-bold">{author}</b>
    );
  }

  return (
    <a
      href={linkedInUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-foreground hover:text-primary block text-base font-bold underline-offset-2 transition-colors hover:underline"
    >
      {author}
    </a>
  );
}

function TestimonialSkeleton() {
  return (
    <div className="border-border/30 bg-card flex flex-col justify-between rounded-[2rem] border p-8 shadow-xs md:p-10">
      <Skeleton className="size-11 rounded-2xl" />
      <div className="my-8 space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-5 w-4/6" />
      </div>
      <div className="border-border/20 flex items-center gap-4 border-t pt-8">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    </div>
  );
}

function SocialProofWithQuery({ stats }: { stats: SocialProofStats }) {
  const locale = useLocale();
  const { data: items = [], isLoading } =
    api.portfolio.getTestimonialsPublic.useQuery({ locale, limit: 10 });

  return (
    <SocialProofContent
      stats={stats}
      items={items}
      isTestimonialsLoading={isLoading}
    />
  );
}

function SocialProofContent({
  stats: statsData,
  items,
  isTestimonialsLoading,
}: {
  stats: SocialProofStats;
  items: TestimonialItem[];
  isTestimonialsLoading: boolean;
}) {
  const t = useTranslations("main.socialProof");
  const cvPublic = usePublicCvVisible();

  const [currentIndex, setCurrentIndex] = useState(0);

  const hasItems = items.length > 0;
  const activeTestimonial = hasItems
    ? items[currentIndex % items.length]
    : null;

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  // Autoplay rotation every 8 seconds if multiple testimonials
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(handleNext, 8000);
    return () => clearInterval(interval);
  }, [handleNext, items.length]);

  const initials = activeTestimonial?.author
    ? activeTestimonial.author
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "TL";

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.removeProperty("--x");
    e.currentTarget.style.removeProperty("--y");
  };

  return (
    <div className="bg-card relative w-full overflow-hidden">
      <section
        id="testimonials"
        aria-label={t("title", { count: items.length })}
        className="mx-auto px-4 py-16 sm:px-6 lg:container lg:px-20 lg:py-20"
      >
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-primary text-sm font-semibold tracking-wide sm:text-base">
            {t("eyebrow")}
          </p>
          <h2 className="text-foreground mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
            {t("title", { count: items.length })}
          </h2>
          <p className="text-muted-foreground mt-2.5 text-sm leading-relaxed sm:mt-3 sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        {/* 12-Column Bento Layout */}
        <div className="mt-8 grid items-stretch gap-4 sm:mt-10 sm:gap-5 md:mt-12 md:grid-cols-12">
          {/* Left Column: Testimonial Figure Card */}
          <div className="flex flex-col md:col-span-7">
            {isTestimonialsLoading ? (
              <TestimonialSkeleton />
            ) : activeTestimonial ? (
              <figure
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                className="b-card-glow group border-border/80 bg-card hover:border-primary/30 relative flex flex-1 flex-col justify-between overflow-hidden rounded-[1.75rem] border p-6 shadow-xs transition-all duration-300 hover:shadow-lg sm:p-7 md:p-8"
              >
                {/* Large Background Watermark Quote Mark */}
                <svg
                  className="text-primary/5 pointer-events-none absolute -top-3 -right-3 size-28 select-none sm:size-36"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M7.2 6C4.9 6 3 7.9 3 10.2V18h7v-7.2H6.4c0-1.4 1-2.4 2.3-2.5L7.2 6zm9 0C13.9 6 12 7.9 12 10.2V18h7v-7.2h-3.6c0-1.4 1-2.4 2.3-2.5L16.2 6z" />
                </svg>

                {/* Branded Icon Tile */}
                <span className="border-primary/15 bg-primary/8 text-primary relative z-10 flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-xs">
                  <Quote className="size-4.5" aria-hidden="true" />
                </span>

                {/* Blockquote with Animated Key Transition */}
                <AnimatePresence mode="wait">
                  <motion.blockquote
                    key={activeTestimonial.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="text-foreground relative mt-4 text-base leading-relaxed font-medium sm:mt-5 sm:text-lg sm:leading-8"
                  >
                    &ldquo;{activeTestimonial.quote}&rdquo;
                  </motion.blockquote>
                </AnimatePresence>

                {/* Figcaption with Author Info & Slider Controls */}
                <figcaption className="border-border/60 relative mt-6 flex flex-wrap items-center gap-3 border-t pt-5">
                  {/* Avatar */}
                  {activeTestimonial.avatarUrl ? (
                    <div className="border-border/60 relative size-10 shrink-0 overflow-hidden rounded-full border shadow-xs sm:size-11">
                      <MediaImage
                        src={activeTestimonial.avatarUrl}
                        alt={activeTestimonial.author}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    </div>
                  ) : (
                    <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:size-11 sm:text-sm">
                      {initials}
                    </span>
                  )}

                  {/* Name and Role */}
                  <div className="mr-auto min-w-0">
                    <AuthorName
                      author={activeTestimonial.author}
                      linkedInUrl={activeTestimonial.linkedInUrl}
                    />
                    {activeTestimonial.role ? (
                      <span className="text-muted-foreground block text-xs">
                        {activeTestimonial.role}
                      </span>
                    ) : null}
                  </div>

                  {/* Slider Controls */}
                  {items.length > 1 ? (
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex items-center gap-1.5"
                        aria-label="Pagination"
                      >
                        {items.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            aria-label={`Go to slide ${idx + 1}`}
                            onClick={() => setCurrentIndex(idx)}
                            className={cn(
                              "h-1.5 cursor-pointer rounded-full transition-all duration-300",
                              idx === currentIndex % items.length
                                ? "bg-primary w-6"
                                : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-1.5",
                            )}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Previous testimonial"
                          onClick={handlePrev}
                          className="border-border/60 bg-card hover:border-primary/40 text-foreground flex size-7 cursor-pointer items-center justify-center rounded-full border text-sm shadow-2xs transition-colors"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          aria-label="Next testimonial"
                          onClick={handleNext}
                          className="border-border/60 bg-card hover:border-primary/40 text-foreground flex size-7 cursor-pointer items-center justify-center rounded-full border text-sm shadow-2xs transition-colors"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  ) : null}
                </figcaption>

                {/* Hire Me CTA Button */}
                <a
                  href="#contact"
                  id="hire-me-cta"
                  className="group bg-primary text-primary-foreground hover:bg-primary/95 relative mt-5 inline-flex cursor-pointer items-center gap-2.5 self-start rounded-full py-1.5 pr-1.5 pl-5 text-xs font-bold shadow-sm transition-all duration-200 hover:scale-[1.02] sm:mt-6 sm:text-sm"
                >
                  {t("cta")}
                  <span className="bg-primary-foreground text-primary flex size-8 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRightIcon className="size-3.5" />
                  </span>
                </a>
              </figure>
            ) : null}
          </div>

          {/* Right Column: 3 Bento Stat Cards */}
          <div className="flex flex-col justify-between gap-3.5 sm:gap-4 md:col-span-5">
            {/* Stat Card 1: Mentored */}
            <div
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              className="b-card-glow group border-border/80 bg-card hover:border-primary/40 relative flex items-center justify-between gap-4 rounded-2xl border p-4 shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
            >
              <div>
                <p className="text-primary font-mono text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
                  {statsData.engineersMentored}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs font-medium sm:text-sm">
                  {t("stats.engineersMentored.label")}
                </p>
              </div>

              {/* 4x2 Popping Squares Grid Visual */}
              <div
                className="grid grid-cols-4 gap-1 sm:gap-1.25"
                aria-hidden="true"
              >
                {[0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1].map((delay, i) => (
                  <span
                    key={i}
                    style={{ animationDelay: `${delay}s` }}
                    className="bento-pop size-3 rounded-[0.25rem] sm:size-3.5"
                  />
                ))}
              </div>
            </div>

            {/* Stat Card 2: Projects */}
            <a
              href="#portfolio"
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              className="b-card-glow group border-border/80 bg-card hover:border-primary/40 relative flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
            >
              <div>
                <p className="text-primary font-mono text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
                  {statsData?.projectsCount ?? 19}+
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs font-medium sm:text-sm">
                  {t("stats.projects.label")}
                </p>
              </div>

              {/* Rising Bars Chart Visual */}
              <div
                className="flex h-11 items-end gap-1 sm:h-12 sm:gap-1.25"
                aria-hidden="true"
              >
                {[
                  { height: "30%", delay: "0s", color: "bg-primary/20" },
                  { height: "45%", delay: "0.1s", color: "bg-primary/30" },
                  { height: "55%", delay: "0.2s", color: "bg-primary/45" },
                  { height: "72%", delay: "0.3s", color: "bg-primary/60" },
                  { height: "85%", delay: "0.4s", color: "bg-primary/80" },
                  { height: "100%", delay: "0.5s", color: "bg-primary" },
                ].map((bar, i) => (
                  <span
                    key={i}
                    style={{ height: bar.height, animationDelay: bar.delay }}
                    className={cn(
                      "bento-bar w-2 rounded-t-sm sm:w-2.5",
                      bar.color,
                    )}
                  />
                ))}
              </div>
            </a>

            {/* Stat Card 3: Years of Experience */}
            <Link
              href={
                cvPublic
                  ? { pathname: "/curriculum-vitae" }
                  : { pathname: "/", hash: "#experience" }
              }
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              className="b-card-glow group border-border/80 bg-card hover:border-primary/40 relative flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
            >
              <div>
                <p className="text-primary font-mono text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
                  {statsData?.yearsExperience ?? 6}+
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs font-medium sm:text-sm">
                  {t("stats.experience.label")}
                </p>
              </div>

              {/* Milestone Progress Track + Glowing Current Node Visual */}
              <div
                className="relative flex w-20 items-center justify-between sm:w-24"
                aria-hidden="true"
              >
                <span className="bg-border/60 absolute inset-x-1 top-1/2 h-0.5 -translate-y-1/2" />
                <span className="bg-primary/25 relative size-2 rounded-full" />
                <span className="bg-primary/40 relative size-2 rounded-full" />
                <span className="bg-primary/60 relative size-2 rounded-full" />
                <span className="bg-primary/80 relative size-2 rounded-full" />
                <span className="a-ring bg-primary ring-card relative size-3 rounded-full shadow-xs ring-2" />
              </div>
            </Link>

            {/* Note below cards */}
            <p className="text-muted-foreground px-2 text-center text-xs">
              {t("statsNote")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

const SocialProof: FC<SocialProofProps> = ({
  stats,
  testimonials: testimonialsFromServer,
}) => {
  if (testimonialsFromServer !== undefined) {
    return (
      <SocialProofContent
        stats={stats}
        items={testimonialsFromServer}
        isTestimonialsLoading={false}
      />
    );
  }

  return <SocialProofWithQuery stats={stats} />;
};

export default SocialProof;
