"use client";

import type { FC } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { api } from "@/trpc/react";
import { QuoteIcon, ArrowRightIcon } from "lucide-react";

import { Link } from "@/i18n/routing";
import { Skeleton } from "@/components/ui/skeleton";

const statKeys = ["certifications", "projects", "experience"] as const;

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function TestimonialSkeleton() {
  return (
    <li className="border-border bg-card/50 rounded-xl border p-5">
      <Skeleton className="mb-3 h-3 w-3/4" />
      <Skeleton className="mb-2 h-3 w-full" />
      <Skeleton className="mb-4 h-3 w-5/6" />
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
    </li>
  );
}

// ─── Testimonial card ─────────────────────────────────────────────────────────
function TestimonialCard({
  quote,
  author,
  role,
  avatarUrl,
  index,
}: {
  quote: string;
  author: string;
  role?: string | null;
  avatarUrl?: string | null;
  index: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: 0.15 + index * 0.12 }}
      className="border-border bg-card/50 relative rounded-xl border p-5 backdrop-blur-sm"
    >
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
            <Image
              src={avatarUrl}
              alt={author}
              fill
              className="object-cover"
              sizes="36px"
              unoptimized
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
          <p className="text-foreground text-sm font-semibold">{author}</p>
          {role && (
            <p className="text-muted-foreground text-xs leading-tight">
              {role}
            </p>
          )}
        </div>
      </footer>
    </motion.li>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
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
      className="bg-card text-card-foreground border-border group relative h-full overflow-hidden rounded-2xl border p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
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
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href as React.ComponentProps<typeof Link>["href"]}
      className="block"
    >
      {content}
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const SocialProof: FC = () => {
  const locale = useLocale();
  const t = useTranslations("main.socialProof");

  const { data: items = [], isLoading } =
    api.portfolio.getTestimonialsPublic.useQuery({ locale, limit: 3 });

  const hasTestimonials = !isLoading && items.length > 0;
  const showTestimonialsColumn = isLoading || hasTestimonials;

  const { data: statsData } = api.portfolio.getStatsPublic.useQuery({ locale });

  const statMapping: Record<string, string | number> = {
    certifications: statsData?.certificationsCount ?? 0,
    projects: (statsData?.projectsCount ?? 0) + "+",
    experience: (statsData?.yearsExperience ?? 0) + "+",
  };

  const statLinks: Record<string, string> = {
    certifications: "/certificates",
    projects: "#projects",
    experience: "/curriculum-vitae",
  };

  return (
    <section
      id="social-proof"
      className="mx-auto px-4 py-16 lg:container lg:px-20 lg:py-20"
    >
      <div
        className={`grid grid-cols-1 items-start gap-12 ${
          showTestimonialsColumn ? "lg:grid-cols-2 lg:gap-20" : "lg:grid-cols-1"
        }`}
      >
        {/* ── LEFT: Testimonials + CTA ───────────────────────────────── */}
        {showTestimonialsColumn && (
          <div className="flex flex-col gap-6">
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

            <ul className="flex flex-col gap-4">
              {isLoading ? (
                <>
                  <TestimonialSkeleton />
                  <TestimonialSkeleton />
                  <TestimonialSkeleton />
                </>
              ) : (
                items.map((item, i) => (
                  <TestimonialCard
                    key={item.id}
                    quote={item.quote}
                    author={item.author}
                    role={item.role}
                    avatarUrl={item.avatarUrl}
                    index={i}
                  />
                ))
              )}
            </ul>

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
        )}

        {/* ── RIGHT (or full-width): Stats + CTA when no testimonials ── */}
        <div className="flex flex-col gap-6">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-muted-foreground text-sm font-medium tracking-widest uppercase"
          >
            {t("statsLabel")}
          </motion.p>

          <div className="grid grid-cols-2 gap-4">
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

          {/* CTA appears here too when no testimonials column */}
          {!showTestimonialsColumn && (
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
          )}

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-muted-foreground text-xs leading-relaxed"
          >
            {t("statsNote")}
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
