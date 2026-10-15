"use client";

import { useMemo, useState } from "react";
import { MediaImage } from "@/components/shared/media-image";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { usePublicCvVisible } from "@/components/app-layout/public-cv-visible";
import { cn } from "@/lib/utils";

export interface ExperienceItem {
  id: string;
  company: string;
  companyLogoUrl?: string | null;
  current: boolean;
  role: string;
  dates: string;
  metrics?: string[];
  skills?: string[];
  responsibilities: string[];
}

interface CompanyGroup {
  id: string;
  company: string;
  companyLogoUrl?: string | null;
  overallDates: string;
  roles: ExperienceItem[];
  hasPromotion: boolean;
}

interface Props {
  experiences: ExperienceItem[];
  viewAllLabel: string;
}

function groupExperiences(items: ExperienceItem[]): CompanyGroup[] {
  const groups: CompanyGroup[] = [];

  for (const item of items) {
    const lastGroup = groups[groups.length - 1];
    const isSameCompany =
      lastGroup?.company.trim().toLowerCase() ===
      item.company.trim().toLowerCase();

    if (isSameCompany) {
      lastGroup.roles.push(item);
      lastGroup.hasPromotion = true;

      // Extract earliest start date and latest end date for unified tenure
      const latestEnd = (
        lastGroup.roles[0]?.dates.split(/[–-]/)[1] ||
        lastGroup.roles[0]?.dates ||
        ""
      ).trim();
      const earliestStart = (
        item.dates.split(/[–-]/)[0] ||
        item.dates ||
        ""
      ).trim();
      lastGroup.overallDates = `${earliestStart} – ${latestEnd}`;
    } else {
      groups.push({
        id: `group-${item.id}`,
        company: item.company,
        companyLogoUrl: item.companyLogoUrl,
        overallDates: item.dates,
        roles: [{ ...item }],
        hasPromotion: false,
      });
    }
  }

  return groups;
}

export function ExperienceAccordion({ experiences, viewAllLabel }: Props) {
  const t = useTranslations("main.experience");
  const showingRecentLabel = t("showingRecent");
  const promotionLabel = t("promotion");
  const showCvLink = usePublicCvVisible();
  const shouldReduceMotion = useReducedMotion();

  const groups = useMemo(() => groupExperiences(experiences), [experiences]);

  // Maintain open state for groups
  const [openGroupIndex, setOpenGroupIndex] = useState<number | null>(0);

  return (
    <div className="w-full">
      <ol
        id="experience-timeline"
        className="md:before:bg-border/30 relative space-y-6 md:before:absolute md:before:top-8 md:before:bottom-8 md:before:left-[14.75rem] md:before:w-px"
      >
        {groups.map((group, groupIdx) => {
          const isGroupOpen = openGroupIndex === groupIdx;
          const isMultiRole = group.roles.length > 1;

          return (
            <li
              key={group.id}
              className={cn(
                "group/item relative grid items-start gap-3 md:grid-cols-[13.5rem_1fr] md:gap-10",
                isGroupOpen && "open-row",
              )}
            >
              {/* Left Column: Sticky Date on Desktop */}
              <div className="hidden items-center md:sticky md:top-28 md:flex md:flex-col md:items-end md:justify-end md:pr-4 md:text-right">
                <time className="text-muted-foreground text-sm font-semibold tracking-wide tabular-nums">
                  {group.overallDates}
                </time>
              </div>

              {/* Connecting Timeline Node perfectly centered on the rail (13.5rem + 1.25rem gap center) */}
              <span
                className={cn(
                  "border-border/40 bg-card absolute top-7 left-[14.75rem] z-10 hidden size-3.5 -translate-x-1/2 rounded-full border transition-all duration-300 md:block",
                  isGroupOpen
                    ? "bg-primary border-primary ring-primary/20 scale-110 shadow-xs ring-4"
                    : "group-hover/item:border-primary/50",
                )}
                aria-hidden="true"
              />

              {/* Right Column: Card */}
              <div
                className={cn(
                  "bg-card border-border/30 hover:border-primary/30 relative overflow-hidden rounded-3xl border shadow-xs transition-all duration-300",
                  isGroupOpen && "border-primary/30 shadow-md",
                )}
              >
                {(() => {
                  const latestRole = group.roles[0];
                  const previousRoles = group.roles.slice(1);
                  const hasDetails = group.roles.some(
                    (r) => r.responsibilities.length > 0,
                  );
                  const panelId = `exp-panel-${group.id}`;

                  return (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenGroupIndex(isGroupOpen ? null : groupIdx)
                        }
                        aria-expanded={isGroupOpen}
                        aria-controls={panelId}
                        className={cn(
                          "focus-visible:ring-ring flex w-full items-center gap-4 p-5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none sm:p-6",
                          hasDetails ? "cursor-pointer" : "cursor-default",
                        )}
                      >
                        {/* Company Logo or Tile Avatar */}
                        {group.companyLogoUrl ? (
                          <span className="relative flex size-11 shrink-0 overflow-hidden rounded-2xl shadow-xs">
                            <MediaImage
                              src={group.companyLogoUrl}
                              alt={group.company}
                              fill
                              className="size-full object-cover"
                              sizes="44px"
                            />
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "border-primary/20 bg-primary/10 text-primary relative flex size-11 shrink-0 items-center justify-center rounded-2xl border font-bold shadow-xs transition-colors",
                              isGroupOpen && "border-primary/40 bg-primary/15",
                            )}
                          >
                            <span className="text-base font-extrabold">
                              {group.company.charAt(0)}
                            </span>
                          </span>
                        )}

                        {/* Title (Role) & Company Subtitle */}
                        <span className="min-w-0 flex-1">
                          <time className="text-muted-foreground mb-1 block text-xs font-semibold tabular-nums md:hidden">
                            {group.overallDates}
                          </time>
                          <span className="text-foreground block text-lg leading-snug font-bold tracking-tight">
                            {latestRole.role}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span className="text-primary text-[15px] font-semibold">
                              · {group.company}
                            </span>
                            {isMultiRole ? (
                              <span className="border-primary/25 bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                                <TrendingUpIcon
                                  className="size-3"
                                  aria-hidden="true"
                                />
                                <span>{promotionLabel}</span>
                              </span>
                            ) : null}
                          </span>
                        </span>

                        {/* Accordion Chevron */}
                        {hasDetails ? (
                          <ChevronDownIcon
                            className={cn(
                              "text-muted-foreground size-5 shrink-0 transition-transform duration-300",
                              isGroupOpen && "text-primary rotate-180",
                            )}
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>

                      {/* Collapsible Content */}
                      {hasDetails ? (
                        <AnimatePresence initial={false}>
                          {isGroupOpen && (
                            <motion.div
                              id={panelId}
                              initial={
                                shouldReduceMotion
                                  ? { opacity: 1 }
                                  : { height: 0, opacity: 0 }
                              }
                              animate={
                                shouldReduceMotion
                                  ? { opacity: 1 }
                                  : { height: "auto", opacity: 1 }
                              }
                              exit={
                                shouldReduceMotion
                                  ? { opacity: 0 }
                                  : { height: 0, opacity: 0 }
                              }
                              transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                              <div className="border-border/20 border-t px-5 pt-5 pb-6 sm:px-6 sm:pl-20">
                                {(() => {
                                  const displayChips =
                                    latestRole.metrics &&
                                    latestRole.metrics.length > 0
                                      ? latestRole.metrics
                                      : latestRole.skills;

                                  if (
                                    !displayChips ||
                                    displayChips.length === 0
                                  )
                                    return null;

                                  return (
                                    <div className="mb-4 flex flex-wrap gap-2">
                                      {displayChips.map((chip) => (
                                        <span
                                          key={chip}
                                          className="border-primary/20 bg-primary/10 text-primary shrink-0 rounded-full border px-3 py-1 text-xs font-bold shadow-2xs"
                                        >
                                          {chip}
                                        </span>
                                      ))}
                                    </div>
                                  );
                                })()}

                                <ul className="space-y-3">
                                  {latestRole.responsibilities.map(
                                    (bullet, bulletIdx) => (
                                      <li
                                        key={`${latestRole.id}-b-${bulletIdx}`}
                                        className="flex items-start gap-3"
                                      >
                                        <CheckIcon
                                          className="text-primary mt-1 size-4 shrink-0"
                                          aria-hidden="true"
                                        />
                                        <span className="text-muted-foreground text-[15px] leading-relaxed">
                                          {bullet}
                                        </span>
                                      </li>
                                    ),
                                  )}
                                </ul>

                                {/* Previous Roles in Promotion Track */}
                                {isMultiRole && previousRoles.length > 0 ? (
                                  <div className="border-border/25 mt-6 border-t pt-5">
                                    <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                                      {t("previousRole")}
                                    </p>
                                    <div className="space-y-5">
                                      {previousRoles.map((prevRole) => (
                                        <div
                                          key={prevRole.id}
                                          className="border-border/30 relative ml-2 border-l pl-4"
                                        >
                                          <span
                                            className="bg-muted-foreground/40 absolute top-1.5 -left-px size-2 -translate-x-1/2 rounded-full"
                                            aria-hidden="true"
                                          />
                                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                                            <h4 className="text-foreground text-sm font-bold">
                                              {prevRole.role}
                                            </h4>
                                            <time className="text-muted-foreground text-xs font-medium tabular-nums">
                                              {prevRole.dates}
                                            </time>
                                          </div>
                                          {prevRole.responsibilities.length >
                                          0 ? (
                                            <ul className="text-muted-foreground mt-2.5 space-y-2 text-xs leading-relaxed">
                                              {prevRole.responsibilities.map(
                                                (resp, i) => (
                                                  <li
                                                    key={i}
                                                    className="flex items-start gap-2"
                                                  >
                                                    <CheckIcon
                                                      className="text-primary/70 mt-0.5 size-3.5 shrink-0"
                                                      aria-hidden="true"
                                                    />
                                                    <span>{resp}</span>
                                                  </li>
                                                ),
                                              )}
                                            </ul>
                                          ) : null}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      ) : null}
                    </>
                  );
                })()}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Footer Navigation */}
      <div className="mt-12 flex flex-col items-center justify-center gap-2 text-center sm:mt-14">
        <p className="text-muted-foreground text-sm">{showingRecentLabel}</p>
        {showCvLink ? (
          <Link
            href="/curriculum-vitae"
            className="group text-primary hover:text-primary/80 inline-flex min-h-11 items-center gap-2 py-2 text-sm font-semibold transition-colors"
          >
            <span>{viewAllLabel}</span>
            <ArrowRightIcon
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
