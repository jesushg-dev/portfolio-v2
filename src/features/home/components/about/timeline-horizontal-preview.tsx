"use client";

import type { FC } from "react";
import { useRef } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { motion, useInView, type Variants } from "motion/react";

import { Link } from "@/i18n/routing";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/trpc/react";
import { TimelineSkeleton } from "./timeline-skeleton";

type TimelineCategory = "WORK" | "STUDY" | "COURSE";

const CATEGORY_ICONS: Record<TimelineCategory, LucideIcon> = {
  WORK: Briefcase,
  STUDY: GraduationCap,
  COURSE: BookOpen,
};

interface TimelineCardProps {
  date: string;
  title: string;
  description: string;
  dateTime: string;
  category: TimelineCategory;
  categoryLabel: string;
  image?: string;
}

const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.05,
      staggerChildren: 0.06,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: "easeOut" },
  },
};

const TimelineCard: FC<TimelineCardProps> = ({
  date,
  title,
  description,
  dateTime,
  category,
  categoryLabel,
  image,
}) => {
  const Icon = CATEGORY_ICONS[category];

  return (
    <motion.li
      variants={cardVariants}
      className="flex w-[17.5rem] max-w-[17.5rem] min-w-[17.5rem] shrink-0 snap-center flex-col"
    >
      <div className="flex h-(--timeline-year-h) items-end justify-center px-1 pb-1">
        <time
          className="text-primary-600/80 text-center text-[11px] font-medium tracking-wide tabular-nums"
          dateTime={dateTime}
        >
          {date}
        </time>
      </div>

      <div className="relative flex h-(--timeline-dot-row-h) items-center justify-center">
        <Tooltip>
          <TooltipTrigger
            type="button"
            aria-label={categoryLabel}
            className="bg-background text-primary-600 hover:bg-primary-500/10 relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors"
          >
            <Icon className="size-3.5" aria-hidden />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            {categoryLabel}
          </TooltipContent>
        </Tooltip>
      </div>

      <div
        className="bg-primary-500/25 mx-auto h-4 w-px shrink-0"
        aria-hidden
      />

      <article className="space-y-2 px-1 pt-1">
        {image ? (
          <div className="bg-muted relative mb-1 h-20 w-full overflow-hidden rounded-lg">
            <Image
              src={image}
              alt=""
              fill
              className="object-cover"
              sizes="280px"
              unoptimized
            />
          </div>
        ) : null}

        <h3 className="text-primaryText-200 line-clamp-2 text-[15px] leading-snug font-semibold">
          {title}
        </h3>
        <p className="text-primaryText-800 line-clamp-3 text-sm leading-relaxed">
          {description}
        </p>
      </article>
    </motion.li>
  );
};

export const TimelineHorizontalPreview: FC = () => {
  const t = useTranslations("main.about.timeline");
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(scrollRef, { once: true, margin: "-60px" });

  const getCategoryLabel = (category: TimelineCategory) =>
    t(`categories.${category}` as "categories.WORK");

  const { data: timelineData, isLoading } =
    api.portfolio.getTimelinePublic.useQuery({
      locale,
      category: "WORK",
      limit: 4,
    });

  const hasItems = Boolean(timelineData && timelineData.length > 0);

  return (
    <div className="w-full space-y-4">
      <div
        ref={scrollRef}
        className="themed-scrollbar w-full overflow-x-auto pb-4"
      >
        {isLoading ? (
          <TimelineSkeleton />
        ) : hasItems ? (
          <TooltipProvider delay={200}>
            <motion.ol
              id="timeline"
              className="timeline-horizontal-rail relative flex w-max min-w-full snap-x snap-mandatory gap-7 px-3"
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={listVariants}
            >
              {timelineData?.map((item) => (
                <TimelineCard
                  key={item.id}
                  date={item.date}
                  title={item.title}
                  description={item.description}
                  dateTime={item.dateTime}
                  category={item.category}
                  categoryLabel={getCategoryLabel(item.category)}
                  image={item.images[0]}
                />
              ))}
            </motion.ol>
          </TooltipProvider>
        ) : (
          <p className="text-primaryText-800 text-center text-sm">
            {t("empty")}
          </p>
        )}
      </div>

      {hasItems ? (
        <div className="flex justify-center lg:justify-start">
          <Link
            href="/timeline"
            className="text-primary-800 hover:text-primary-900 inline-flex items-center gap-2 text-sm font-medium transition-colors"
          >
            {t("viewAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
};
