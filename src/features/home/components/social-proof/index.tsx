"use client";

import { useCallback, useEffect, useState, type FC } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { ShowcaseSection, ShowcaseHeading } from "@/components/shared/showcase";

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
  testimonials: TestimonialItem[];
}

function AuthorName({
  author,
  linkedInUrl,
}: {
  author: string;
  linkedInUrl?: string | null;
}) {
  if (!linkedInUrl) {
    return <span className="text-foreground font-semibold">{author}</span>;
  }

  return (
    <a
      href={linkedInUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-foreground hover:text-primary font-semibold underline-offset-2 transition-colors hover:underline"
    >
      {author}
    </a>
  );
}

function SocialProofContent({
  stats: statsData,
  items,
}: {
  stats: SocialProofStats;
  items: TestimonialItem[];
}) {
  const t = useTranslations("main.socialProof");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const hasItems = items.length > 0;
  const activeTestimonial = hasItems
    ? items[currentIndex % items.length]
    : null;

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    setIsExpanded(false);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    setIsExpanded(false);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  // Autoplay rotation every 8 seconds if multiple testimonials and not expanded or hovered
  useEffect(() => {
    if (items.length <= 1 || isExpanded || isPaused) return;
    const interval = setInterval(handleNext, 8000);
    return () => clearInterval(interval);
  }, [handleNext, isExpanded, isPaused, items.length]);

  return (
    <ShowcaseSection id="testimonials" ariaLabelledBy="testimonials-heading">
      <ShowcaseHeading
        sectionId="testimonials"
        eyebrow={t("eyebrow")}
        title={t("title", { count: items.length })}
        description={t("subtitle")}
      />

      <div
        className="mx-auto mt-12 max-w-4xl text-center"
        onPointerEnter={() => setIsPaused(true)}
        onPointerLeave={() => setIsPaused(false)}
      >
        {activeTestimonial ? (
          <figure className="relative">
            <blockquote
              className={cn(
                "text-foreground mx-auto max-w-3xl text-xl leading-snug font-medium tracking-tight transition-all duration-300 sm:text-2xl sm:leading-tight lg:text-[2rem]",
                !isExpanded && "line-clamp-4 sm:line-clamp-none",
              )}
            >
              &ldquo;{activeTestimonial.quote}&rdquo;
            </blockquote>

            {activeTestimonial.quote.length > 140 ? (
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                aria-expanded={isExpanded}
                className="text-primary hover:text-primary/80 mt-3 inline-flex min-h-11 cursor-pointer items-center gap-1.5 py-2 text-sm font-semibold transition-colors sm:hidden"
              >
                <span>{isExpanded ? t("readLess") : t("readMore")}</span>
                {isExpanded ? (
                  <ChevronUp className="size-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="size-4" aria-hidden="true" />
                )}
              </button>
            ) : null}

            <figcaption className="text-muted-foreground mt-7 text-sm font-normal sm:text-base">
              <AuthorName
                author={activeTestimonial.author}
                linkedInUrl={activeTestimonial.linkedInUrl}
              />
              {activeTestimonial.role ? (
                <span className="text-muted-foreground before:mx-2 before:content-['·']">
                  {activeTestimonial.role}
                </span>
              ) : null}
            </figcaption>

            {items.length > 1 ? (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  aria-label="Previous testimonial"
                  onClick={handlePrev}
                  className="border-border/80 bg-card text-foreground hover:border-primary/50 flex size-9 items-center justify-center rounded-full border text-sm shadow-2xs transition"
                >
                  ‹
                </button>
                <div className="flex items-center gap-1.5">
                  {items.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      aria-label={`Go to slide ${idx + 1}`}
                      onClick={() => {
                        setIsExpanded(false);
                        setCurrentIndex(idx);
                      }}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        idx === currentIndex % items.length
                          ? "bg-primary w-6"
                          : "bg-muted-foreground/40 hover:bg-muted-foreground/60 w-1.5",
                      )}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  aria-label="Next testimonial"
                  onClick={handleNext}
                  className="border-border/80 bg-card text-foreground hover:border-primary/50 flex size-9 items-center justify-center rounded-full border text-sm shadow-2xs transition"
                >
                  ›
                </button>
              </div>
            ) : null}
          </figure>
        ) : null}

        {/* Centered 3-column stats matching prototype: .nums.mini.ct */}
        <div className="border-border/80 mt-14 flex flex-wrap items-center justify-center gap-10 border-t pt-10 text-center sm:mt-18 sm:gap-16">
          <div>
            <b className="text-foreground block text-3xl font-bold tracking-tight tabular-nums sm:text-4xl lg:text-5xl">
              {statsData.engineersMentored}
            </b>
            <span className="text-muted-foreground mt-2 block text-sm sm:text-base">
              {t("stats.engineersMentored.label") || "Engineers led"}
            </span>
          </div>
          <div>
            <b className="text-foreground block text-3xl font-bold tracking-tight tabular-nums sm:text-4xl lg:text-5xl">
              {statsData?.projectsCount ?? 25}+
            </b>
            <span className="text-muted-foreground mt-2 block text-sm sm:text-base">
              {t("stats.projects.label") || "Projects"}
            </span>
          </div>
          <div>
            <b className="text-foreground block text-3xl font-bold tracking-tight tabular-nums sm:text-4xl lg:text-5xl">
              {statsData?.yearsExperience ?? 7}+
            </b>
            <span className="text-muted-foreground mt-2 block text-sm sm:text-base">
              {t("stats.experience.label") || "Years of experience"}
            </span>
          </div>
        </div>
      </div>
    </ShowcaseSection>
  );
}

const SocialProof: FC<SocialProofProps> = ({ stats, testimonials }) => (
  <SocialProofContent stats={stats} items={testimonials} />
);

export default SocialProof;
