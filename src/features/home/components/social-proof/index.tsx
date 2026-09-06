"use client";

import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MediaImage } from "@/components/shared/media-image";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import Autoplay from "embla-carousel-autoplay";
import { api } from "@/trpc/react";
import { QuoteIcon, ArrowRightIcon } from "lucide-react";

import { Link } from "@/i18n/routing";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicCvVisible } from "@/components/app-layout/public-cv-visible";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const statKeys = ["certifications", "projects", "experience"] as const;

interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role?: string | null;
  avatarUrl?: string | null;
  linkedInUrl?: string | null;
}

function TestimonialSkeleton() {
  return (
    <div className="border-border bg-card/50 rounded-xl border p-5">
      <Skeleton className="mb-3 h-3 w-3/4" />
      <Skeleton className="mb-2 h-3 w-full" />
      <Skeleton className="mb-2 h-3 w-full" />
      <Skeleton className="mb-4 h-3 w-5/6" />
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-32" />
        </div>
      </div>
    </div>
  );
}

function AuthorName({
  author,
  linkedInUrl,
}: {
  author: string;
  linkedInUrl?: string | null;
}) {
  if (!linkedInUrl) {
    return <p className="text-foreground text-sm font-semibold">{author}</p>;
  }

  return (
    <a
      href={linkedInUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-foreground hover:text-primary text-sm font-semibold underline-offset-2 transition-colors hover:underline"
    >
      {author}
    </a>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
  avatarUrl,
  linkedInUrl,
}: TestimonialItem) {
  return (
    <div className="border-border bg-card/50 relative flex h-full w-full flex-col rounded-xl border p-5 backdrop-blur-sm">
      <QuoteIcon
        className="text-primary/20 absolute top-3 right-4 h-8 w-8"
        aria-hidden
      />
      <blockquote className="text-foreground pr-6 text-sm leading-relaxed">
        {quote}
      </blockquote>
      <footer className="mt-4 flex items-center gap-2.5">
        {avatarUrl ? (
          <div className="border-border relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border shadow-sm">
            <MediaImage
              src={avatarUrl}
              alt={author}
              fill
              className="object-cover"
              sizes="36px"
            />
          </div>
        ) : (
          <span className="bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold">
            {author
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase()}
          </span>
        )}
        <div>
          <AuthorName author={author} linkedInUrl={linkedInUrl} />
          {role ? (
            <p className="text-muted-foreground text-sm leading-tight">
              {role}
            </p>
          ) : null}
        </div>
      </footer>
    </div>
  );
}

function TestimonialsCarousel({ items }: { items: TestimonialItem[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const autoplayPlugin = useMemo(
    () =>
      Autoplay({
        delay: 7000,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
      }),
    [],
  );

  const onSelect = useCallback(() => {
    if (!api) return;
    setSelectedIndex(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;

    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  if (items.length === 0) return null;

  const showControls = items.length > 1;

  return (
    <div className="flex w-full flex-col gap-4">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: showControls }}
        plugins={showControls ? [autoplayPlugin] : undefined}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {items.map((item) => (
            <CarouselItem key={item.id} className="basis-full pl-0">
              <TestimonialCard {...item} />
            </CarouselItem>
          ))}
        </CarouselContent>

        {showControls ? (
          <div
            className="mt-3 flex items-center justify-center gap-1.5"
            aria-label="Testimonial slides"
          >
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Go to testimonial ${index + 1}`}
                aria-current={selectedIndex === index}
                onClick={() => api?.scrollTo(index)}
                className="focus-visible:ring-ring inline-flex h-9 items-center justify-center rounded-full px-1 transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:outline-hidden"
              >
                <span
                  className={cn(
                    "rounded-full transition-all duration-300",
                    selectedIndex === index
                      ? "bg-primary h-2 w-6"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50 h-2 w-2",
                  )}
                />
              </button>
            ))}
          </div>
        ) : null}
      </Carousel>
    </div>
  );
}

function StatCard({
  value,
  label,
  index,
  href,
}: {
  value: string;
  label: string;
  index: number;
  href: string;
}) {
  const isHash = href.startsWith("#");

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: 0.1 + index * 0.1 }}
      className="bg-card text-card-foreground border-border group relative h-full w-full overflow-hidden rounded-2xl border p-6 text-center shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <span
        aria-hidden
        className="bg-primary/5 absolute inset-0 translate-y-full rounded-2xl transition-transform duration-500 group-hover:translate-y-0"
      />
      <p className="text-primary relative text-4xl font-extrabold tracking-tight">
        {value}
      </p>
      <p className="text-muted-foreground relative mt-1.5 text-sm leading-snug font-medium">
        {label}
      </p>
    </motion.div>
  );

  if (isHash) {
    return (
      <a href={href} className="block w-full">
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href as React.ComponentProps<typeof Link>["href"]}
      className="block w-full"
    >
      {content}
    </Link>
  );
}

interface SocialProofStats {
  yearsExperience: number;
  projectsCount: number;
  certificationsCount: number;
}

interface SocialProofProps {
  stats: SocialProofStats;
  testimonials?: TestimonialItem[];
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

  const statMapping: Record<string, string | number> = {
    certifications: statsData?.certificationsCount ?? 0,
    projects: (statsData?.projectsCount ?? 0) + "+",
    experience: (statsData?.yearsExperience ?? 0) + "+",
  };

  const statLinks: Record<string, string> = {
    certifications: "/certificates",
    projects: "#projects",
    experience: cvPublic ? "/curriculum-vitae" : "#experience",
  };

  const hasTestimonials = !isTestimonialsLoading && items.length > 0;
  const showTestimonialsColumn = isTestimonialsLoading || hasTestimonials;

  return (
    <div className="bg-muted/50 relative w-full overflow-hidden">
      <section
        id="social-proof"
        className="mx-auto px-4 py-16 sm:px-6 lg:container lg:px-20 lg:py-20"
      >
        <div
          className={cn(
            "grid grid-cols-1 items-center gap-12",
            showTestimonialsColumn
              ? "lg:grid-cols-2 lg:gap-20"
              : "lg:grid-cols-1",
          )}
        >
          {showTestimonialsColumn ? (
            <div className="flex w-full min-w-0 flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="flex flex-col gap-2"
              >
                <span className="text-primary text-sm font-semibold tracking-widest uppercase">
                  {t("eyebrow")}
                </span>
                <h2 className="text-foreground text-3xl leading-tight font-extrabold tracking-tight lg:text-4xl">
                  {t("title", { count: items.length })}
                </h2>
                <p className="text-muted-foreground mt-1 max-w-sm text-base leading-relaxed">
                  {t("subtitle")}
                </p>
              </motion.div>

              {isTestimonialsLoading ? (
                <TestimonialSkeleton />
              ) : (
                <TestimonialsCarousel items={items} />
              )}

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.4 }}
              >
                <a
                  href="#contact"
                  id="hire-me-cta"
                  className="bg-primary text-primary-foreground group inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-semibold shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg active:translate-y-0 active:shadow-md"
                >
                  {t("cta")}
                  <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </motion.div>
            </div>
          ) : null}

          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 text-center">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="text-muted-foreground text-sm font-medium tracking-widest uppercase"
            >
              {t("statsLabel")}
            </motion.p>

            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
              {statKeys.map((key, i) => (
                <StatCard
                  key={key}
                  value={String(statMapping[key] ?? "0")}
                  label={t(`stats.${key}.label`)}
                  index={i}
                  href={statLinks[key]}
                />
              ))}
            </div>

            {!showTestimonialsColumn ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.4 }}
              >
                <a
                  href="#contact"
                  id="hire-me-cta"
                  className="bg-primary text-primary-foreground group inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-semibold shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg active:translate-y-0 active:shadow-md"
                >
                  {t("cta")}
                  <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </motion.div>
            ) : null}

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-muted-foreground max-w-xs text-sm leading-relaxed"
            >
              {t("statsNote")}
            </motion.p>
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
