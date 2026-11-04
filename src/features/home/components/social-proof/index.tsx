"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MediaImage } from "@/components/shared/media-image";
import { ShowcaseSection, ShowcaseHeading } from "@/components/shared/showcase";

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role?: string | null;
  avatarUrl?: string | null;
  linkedInUrl?: string | null;
}

function AuthorName({
  author,
  linkedInUrl,
}: Pick<TestimonialItem, "author" | "linkedInUrl">) {
  let href: string | null = null;
  try {
    const url = new URL(linkedInUrl ?? "");
    if (["http:", "https:"].includes(url.protocol)) href = url.href;
  } catch {}
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-foreground hover:text-primary font-semibold hover:underline"
    >
      {author}
    </a>
  ) : (
    <span className="text-foreground font-semibold">{author}</span>
  );
}

function TestimonialSpotlight({ item }: { item: TestimonialItem }) {
  const initials = item.author
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return (
    <figure className="grid items-center gap-8 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-12 lg:gap-16">
      <figcaption className="flex items-center gap-4 md:flex-col md:items-start md:gap-5">
        <span className="border-border/60 from-primary/15 to-card relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-3xl border bg-linear-to-br text-2xl font-medium shadow-lg md:size-36 md:rounded-[2rem]">
          {item.avatarUrl ? (
            <MediaImage
              src={item.avatarUrl}
              alt=""
              fill
              sizes="(min-width:48rem) 9rem, 5rem"
              className="object-cover"
            />
          ) : (
            <span className="text-primary" aria-hidden="true">
              {initials}
            </span>
          )}
        </span>
        <div className="min-w-0 text-sm">
          <AuthorName author={item.author} linkedInUrl={item.linkedInUrl} />
          {item.role && (
            <p className="text-muted-foreground mt-1.5 max-w-56 text-xs leading-relaxed">
              {item.role}
            </p>
          )}
        </div>
      </figcaption>
      <blockquote className="text-foreground text-lg leading-relaxed font-medium tracking-tight sm:text-xl lg:text-2xl lg:leading-relaxed">
        <span className="text-primary/70 mr-1 text-3xl" aria-hidden="true">
          “
        </span>
        {item.quote}
        <span className="text-primary/70 ml-1 text-3xl" aria-hidden="true">
          ”
        </span>
      </blockquote>
    </figure>
  );
}

export default function SocialProof({
  testimonials,
}: {
  testimonials: TestimonialItem[];
}) {
  const t = useTranslations("main.socialProof");
  const id = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIndex = Math.max(
    0,
    testimonials.findIndex(
      (item) => item.id === (activeId ?? testimonials[0]?.id),
    ),
  );
  const active = testimonials[activeIndex];
  if (!active) return null;
  return (
    <ShowcaseSection id="testimonials" ariaLabelledBy="testimonials-heading">
      <ShowcaseHeading
        sectionId="testimonials"
        eyebrow={t("eyebrow")}
        title={t("titleLead")}
        titleGradient={t("titleGradient")}
        description={t("subtitle")}
        align="left"
      />
      <div className="border-border/60 mx-auto max-w-6xl border-t pt-9 sm:pt-12">
        <div
          id={id}
          aria-live="polite"
          aria-atomic="true"
          className="md:min-h-72"
        >
          <TestimonialSpotlight item={active} />
        </div>
        {testimonials.length > 1 && (
          <div className="mt-8 flex justify-end md:mt-10">
            <div
              role="group"
              aria-label={t("navigation")}
              className="glass-card inline-flex items-center gap-4 rounded-full p-1.5"
            >
              <button
                type="button"
                aria-label={t("previous")}
                aria-controls={id}
                onClick={() =>
                  setActiveId(
                    testimonials[
                      (activeIndex - 1 + testimonials.length) %
                        testimonials.length
                    ].id,
                  )
                }
                className="text-foreground hover:bg-muted/30 focus-visible:ring-ring grid size-11 cursor-pointer place-items-center rounded-full transition-colors focus-visible:ring-2"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </button>
              <span className="text-muted-foreground min-w-10 text-center font-mono text-xs tabular-nums">
                {activeIndex + 1} / {testimonials.length}
              </span>
              <button
                type="button"
                aria-label={t("next")}
                aria-controls={id}
                onClick={() =>
                  setActiveId(
                    testimonials[(activeIndex + 1) % testimonials.length].id,
                  )
                }
                className="text-foreground hover:bg-muted/30 focus-visible:ring-ring grid size-11 cursor-pointer place-items-center rounded-full transition-colors focus-visible:ring-2"
              >
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </ShowcaseSection>
  );
}
