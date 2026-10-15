"use client";

import { useRef, useEffect, type FC } from "react";
import { Calendar, Globe, MapPin } from "lucide-react";
import type { TimelineCategory } from "@prisma/client";
import { motion, useReducedMotion } from "motion/react";

import { MediaImage } from "@/components/shared/media-image";
import SkillIcon from "@/features/home/components/skills/skill-icon";
import { cn } from "@/lib/utils";
import type { TimelinePublicItem } from "@/features/timeline/lib/map-timeline-public";
import {
  formatTimelineRange,
  calculateTimelineDuration,
  formatTimelineMonthYear,
  getOrganizationInitials,
} from "@/features/timeline/lib/timeline-format";

export interface TimelineItemCardProps {
  item: TimelinePublicItem;
  index: number;
  isActive: boolean;
  showYear: boolean;
  year: number;
  categoryLabels: Record<TimelineCategory, string>;
  rolesLabel: string;
  presentLabel: string;
  techAria: string;
  onIntersect: (index: number) => void;
}

export const TimelineItemCard: FC<TimelineItemCardProps> = ({
  item,
  index,
  isActive,
  showYear,
  year,
  categoryLabels,
  rolesLabel,
  presentLabel,
  techAria,
  onIntersect,
}) => {
  const itemRef = useRef<HTMLLIElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onIntersect(index);
          }
        }
      },
      {
        rootMargin: "-35% 0px -45% 0px",
        threshold: 0.1,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [index, onIntersect]);

  const initials = getOrganizationInitials(item.organization);
  const isRemoteOrOnline = /remote|online/i.test(item.location ?? "");
  const dateRange = formatTimelineRange({
    startDate: item.startDate,
    endDate: item.endDate,
    current: item.current,
    presentLabel,
  });
  const duration = calculateTimelineDuration(
    item.startDate,
    item.endDate,
    item.current,
  );

  const skillsList =
    item.skills && item.skills.length > 0
      ? item.skills
      : item.technologies.map((t) => ({ id: t, title: t, image: null }));

  return (
    <motion.li
      ref={itemRef}
      data-index={index}
      data-active={isActive}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: shouldReduceMotion ? 0.15 : 0.45,
        ease: "easeOut",
      }}
      className="relative min-h-[40vh] py-10 pl-8 md:pl-12"
    >
      {/* Animated Dot on Progress Line */}
      <motion.span
        animate={{
          scale: isActive ? 1.3 : 1,
        }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        className={cn(
          "absolute top-[3.6rem] left-0 size-3.5 -translate-x-1/2 rounded-full border-2 transition-colors duration-300",
          isActive
            ? "border-primary bg-primary ring-primary/25 shadow-lg ring-4"
            : "border-border bg-background",
        )}
        aria-hidden="true"
      >
        {/* Radar Pulse when active */}
        {isActive && !shouldReduceMotion ? (
          <motion.span
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeOut",
            }}
            className="bg-primary/50 absolute -inset-0.5 rounded-full"
            aria-hidden="true"
          />
        ) : null}
      </motion.span>

      {/* Year Heading if first item in year */}
      {showYear ? (
        <motion.p
          animate={{
            opacity: isActive ? 1 : 0.4,
          }}
          transition={{ duration: 0.3 }}
          className={cn(
            "mb-3 text-6xl font-black tracking-tight select-none md:text-7xl",
            isActive
              ? "from-primary to-primary/60 bg-gradient-to-b bg-clip-text text-transparent"
              : "text-muted-foreground/30",
          )}
          aria-hidden="true"
        >
          {year}
        </motion.p>
      ) : null}

      {/* Mobile Inline Media (visible on small/medium screens only) */}
      <figure className="border-border bg-card relative mb-5 aspect-video overflow-hidden rounded-3xl border shadow-lg lg:hidden">
        <div className="from-primary/25 via-accent/15 to-card absolute inset-0 flex items-center justify-center bg-gradient-to-br">
          <span
            className="text-foreground/20 text-7xl leading-none font-black select-none"
            aria-hidden="true"
          >
            {initials}
          </span>
        </div>
        {item.images[0] ? (
          <MediaImage
            src={item.images[0]}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 500px"
            className="object-cover"
          />
        ) : null}
        <figcaption className="bg-background/90 text-foreground border-border/40 absolute bottom-3 left-4 rounded-full border px-3.5 py-1 text-xs font-bold shadow-xs backdrop-blur-md">
          {item.organization}
        </figcaption>
      </figure>

      {/* Milestone Details */}
      <div className="space-y-3">
        {/* Category Eyebrow */}
        <p className="text-primary text-xs font-bold tracking-wider uppercase">
          {categoryLabels[item.category] ?? item.category}
        </p>

        {/* Role & Organization */}
        <div>
          <h2 className="text-foreground text-2xl font-bold tracking-tight">
            {item.title}
          </h2>
          <p className="text-muted-foreground text-lg font-semibold">
            {item.organization}
          </p>
        </div>

        {/* Date & Location metadata */}
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
          {dateRange ? (
            <li className="text-muted-foreground inline-flex items-center gap-1.5">
              <Calendar className="text-primary size-4" aria-hidden="true" />
              <span>
                {dateRange}
                {duration ? (
                  <>
                    {" "}
                    ·{" "}
                    <b className="text-foreground font-semibold">{duration}</b>
                  </>
                ) : null}
              </span>
            </li>
          ) : null}

          {item.location ? (
            <li className="text-muted-foreground inline-flex items-center gap-1.5">
              {isRemoteOrOnline ? (
                <Globe className="text-primary size-4" aria-hidden="true" />
              ) : (
                <MapPin className="text-primary size-4" aria-hidden="true" />
              )}
              <span>{item.location}</span>
            </li>
          ) : null}
        </ul>

        {/* Progression / Career progression sub-roles */}
        {item.roles.length > 0 ? (
          <div className="mt-4 pt-1">
            <p className="text-muted-foreground mb-2 text-xs font-bold tracking-wider uppercase">
              {rolesLabel}
            </p>
            <ol className="border-border/80 space-y-2 border-l-2 pl-4">
              {item.roles.map((r) => {
                const start = formatTimelineMonthYear(r.startDate);
                const end = r.endDate
                  ? formatTimelineMonthYear(r.endDate)
                  : presentLabel;
                const dateSpan = end ? `${start} – ${end}` : start;
                return (
                  <li key={`${r.title}-${r.startDate}`} className="text-sm">
                    <span className="text-foreground font-semibold">
                      {r.title}
                    </span>{" "}
                    <span className="text-muted-foreground">· {dateSpan}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}

        {/* Description */}
        {item.description ? (
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed whitespace-pre-line md:text-base">
            {item.description}
          </p>
        ) : null}

        {/* Technologies list with SkillIcon & Motion hover physics */}
        {skillsList.length > 0 ? (
          <ul
            className="flex flex-wrap items-center gap-2 pt-2"
            aria-label={techAria}
          >
            {skillsList.map((skill) => (
              <motion.li
                key={skill.id || skill.title}
                whileHover={shouldReduceMotion ? {} : { scale: 1.06, y: -2 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="bg-muted/50 border-border/70 text-foreground hover:bg-muted inline-flex cursor-default items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors"
              >
                <SkillIcon
                  image={skill.image}
                  title={skill.title}
                  tile
                  size="sm"
                  className="size-5 rounded text-[10px]"
                />
                <span>{skill.title}</span>
              </motion.li>
            ))}
          </ul>
        ) : null}
      </div>
    </motion.li>
  );
};
