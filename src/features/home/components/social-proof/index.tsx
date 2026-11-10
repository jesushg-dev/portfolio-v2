"use client";

import { useTranslations } from "next-intl";
import { ShowcaseHeading, ShowcaseSection } from "@/components/shared/showcase";
import type {
  SoftSkillBentoItem,
  SoftSkillMetric,
} from "@/features/home/components/soft-skills/soft-skills-bento";

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role?: string | null;
  avatarUrl?: string | null;
  linkedInUrl?: string | null;
}

interface SocialProofProps {
  testimonials: TestimonialItem[];
  proofItems?: SoftSkillBentoItem[];
  metrics?: SoftSkillMetric[];
}

function ProofMetric({ metric }: { metric?: SoftSkillMetric }) {
  if (!metric) return null;
  return (
    <div className="mt-auto flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-8">
      <strong className="text-primary text-4xl font-bold tracking-tight whitespace-nowrap sm:text-5xl">
        {metric.value}
      </strong>
      {metric.label ? (
        <span className="text-muted-foreground min-w-0 text-sm leading-relaxed">
          {metric.label}
        </span>
      ) : null}
    </div>
  );
}

function Attribution({ item }: { item: TestimonialItem }) {
  let href: string | null = null;
  try {
    const url = new URL(item.linkedInUrl ?? "");
    if (["http:", "https:"].includes(url.protocol)) href = url.href;
  } catch {}

  return (
    <figcaption className="text-muted-foreground mt-4 text-sm leading-relaxed">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:text-primary inline-flex min-h-11 items-center font-semibold hover:underline"
        >
          {item.author}
        </a>
      ) : (
        <span className="text-foreground font-semibold">{item.author}</span>
      )}
      {item.role ? <span> · {item.role}</span> : null}
    </figcaption>
  );
}

function Quote({ item }: { item: TestimonialItem }) {
  return (
    <figure className="mt-5">
      <blockquote className="text-muted-foreground text-base leading-relaxed sm:text-lg">
        “{item.quote}”
      </blockquote>
      <Attribution item={item} />
    </figure>
  );
}

function WorkingCard({
  eyebrow,
  title,
  quote,
  description,
  metric,
  wide = false,
  placeholder = false,
}: {
  eyebrow: string;
  title: string;
  quote?: TestimonialItem;
  description?: string;
  metric?: SoftSkillMetric;
  wide?: boolean;
  placeholder?: boolean;
}) {
  return (
    <li className={wide ? "md:col-span-2 lg:col-span-2" : ""}>
      <article className="bg-card flex h-full flex-col rounded-[2rem] p-6 sm:p-10">
        <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">
          {eyebrow}
        </p>
        <h3 className="text-foreground mt-3 text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
          {title}
        </h3>
        {quote && !placeholder ? (
          <Quote item={quote} />
        ) : description ? (
          <p
            className={
              placeholder
                ? "text-muted-foreground mt-5 text-base leading-relaxed italic opacity-80 sm:text-lg"
                : "text-muted-foreground mt-5 text-base leading-relaxed sm:text-lg"
            }
          >
            {description}
          </p>
        ) : null}
        <ProofMetric metric={metric} />
      </article>
    </li>
  );
}

export default function SocialProof({
  testimonials,
  proofItems = [],
  metrics = [],
}: SocialProofProps) {
  const t = useTranslations("main.socialProof");
  const published = testimonials.filter(
    (item) => item.author.trim().length > 0,
  );
  const placeholder = testimonials.find(
    (item) => item.author.trim().length === 0,
  );
  if (published.length === 0 && proofItems.length === 0) return null;

  return (
    <ShowcaseSection id="testimonials" ariaLabelledBy="testimonials-heading">
      <ShowcaseHeading
        sectionId="testimonials"
        title={t("titleLead")}
        titleGradient={t("titleGradient")}
        description={t("subtitle")}
      />
      <ul className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        <WorkingCard
          wide
          eyebrow={t("cards.ownership.eyebrow")}
          title={t("cards.ownership.title")}
          quote={published[0]}
          description={proofItems[0]?.description}
          metric={metrics[0]}
        />
        <WorkingCard
          eyebrow={t("cards.delivery.eyebrow")}
          title={t("cards.delivery.title")}
          description={proofItems[0]?.description}
          metric={metrics[1]}
        />
        <WorkingCard
          eyebrow={t("cards.growing.eyebrow")}
          title={t("cards.growing.title")}
          description={placeholder?.quote ?? proofItems[1]?.description}
          placeholder={Boolean(placeholder)}
          metric={metrics[2]}
        />
        <WorkingCard
          wide
          eyebrow={t("cards.judgment.eyebrow")}
          title={t("cards.judgment.title")}
          quote={published[1]}
          description={proofItems[2]?.description}
          metric={metrics[3]}
        />
      </ul>
    </ShowcaseSection>
  );
}
