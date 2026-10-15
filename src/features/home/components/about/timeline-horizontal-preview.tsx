"use client";

import type { FC } from "react";
import { MediaImage } from "@/components/shared/media-image";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { Link } from "@/i18n/routing";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TimelinePublicItem } from "@/features/timeline/lib/map-timeline-public";

type TimelineCategory = "WORK" | "STUDY" | "COURSE";

const CATEGORY_ICONS: Record<TimelineCategory, LucideIcon> = {
  WORK: Briefcase,
  STUDY: GraduationCap,
  COURSE: BookOpen,
};

interface TimelineCardProps {
  date: string;
  title: string;
  organization?: string;
  description: string;
  dateTime: string;
  category: TimelineCategory;
  categoryLabel: string;
  image?: string;
}

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

const TimelineCard: FC<TimelineCardProps> = ({
  date,
  title,
  organization,
  description,
  dateTime,
  category,
  categoryLabel,
  image,
}) => {
  const Icon = CATEGORY_ICONS[category] ?? Briefcase;
  const orgTrimmed = organization?.trim();

  return (
    <motion.li
      variants={cardVariants}
      className="group relative flex flex-col items-center text-center"
    >
      {/* Date */}
      <time
        className="text-primary text-sm font-semibold tracking-wide tabular-nums"
        dateTime={dateTime}
      >
        {date}
      </time>

      {/* Node Circle */}
      <Tooltip>
        <TooltipTrigger
          type="button"
          aria-label={categoryLabel}
          className="border-primary/20 bg-card text-primary group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-primary/20 relative z-10 mt-3 flex size-10 items-center justify-center rounded-full border shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:shadow-md"
        >
          <Icon className="size-4" aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          {categoryLabel}
        </TooltipContent>
      </Tooltip>

      {/* Vertical Stem */}
      <span className="bg-primary/20 h-4 w-px shrink-0" aria-hidden="true" />

      {/* Content */}
      <div className="mt-3 flex w-full flex-col items-center">
        {image ? (
          <div className="bg-muted border-border/20 relative mb-3 h-20 w-full overflow-hidden rounded-xl border">
            <MediaImage
              src={image}
              alt=""
              fill
              className="object-cover"
              sizes="280px"
            />
          </div>
        ) : null}

        <h3 className="text-foreground text-[15px] leading-snug font-semibold">
          {title}
          {orgTrimmed ? (
            <span className="text-primary font-medium"> · {orgTrimmed}</span>
          ) : null}
        </h3>
        <p className="text-muted-foreground mt-2 line-clamp-4 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </motion.li>
  );
};

interface TimelineHorizontalPreviewProps {
  items: TimelinePublicItem[];
}

export const TimelineHorizontalPreview: FC<TimelineHorizontalPreviewProps> = ({
  items,
}) => {
  const t = useTranslations("main.about.timeline");
  const shouldReduceMotion = useReducedMotion();

  const getCategoryLabel = (category: TimelineCategory) =>
    t(`categories.${category}` as "categories.WORK");

  const hasItems = items.length > 0;

  return (
    <div className="w-full space-y-10">
      {hasItems ? (
        <TooltipProvider delay={200}>
          <motion.ol
            id="timeline"
            className="lg:before:border-primary/20 relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:before:absolute lg:before:inset-x-[12.5%] lg:before:top-[3.25rem] lg:before:border-t lg:before:border-dashed"
            initial={shouldReduceMotion ? false : "hidden"}
            whileInView={shouldReduceMotion ? undefined : "visible"}
            viewport={{ once: true, margin: "-60px" }}
            variants={listVariants}
          >
            {items.map((item) => (
              <TimelineCard
                key={item.id}
                date={item.date}
                title={item.title}
                organization={item.organization}
                description={item.description}
                dateTime={item.dateTime}
                category={item.category}
                categoryLabel={getCategoryLabel(item.category)}
                image={item.images?.[0]}
              />
            ))}
          </motion.ol>
        </TooltipProvider>
      ) : (
        <p className="text-muted-foreground text-center text-sm">
          {t("empty")}
        </p>
      )}

      {hasItems ? (
        <div className="flex justify-center">
          <Link
            href="/timeline"
            className="group text-primary hover:text-primary/80 inline-flex min-h-11 items-center gap-2 py-2 text-sm font-semibold transition-colors"
          >
            <span>{t("viewAll")}</span>
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      ) : null}
    </div>
  );
};
