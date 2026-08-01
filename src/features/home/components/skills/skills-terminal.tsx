"use client";

import { useEffect, useMemo, useRef, useState, type FC } from "react";
import { ArrowRightIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

import HeaderArticle from "@/components/shared/header-article";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { SkillType } from "@/utils/interfaces/types";
import {
  countSkillsByCategory,
  filterSkillsByCategory,
  SKILL_CATEGORIES,
  type SkillCategoryId,
} from "./lib/skill-display";
import SkillItem from "./skill-item";

interface SkillsTerminalProps {
  initialSkills: SkillType[];
}

const SkillsTerminal: FC<SkillsTerminalProps> = ({ initialSkills }) => {
  const t = useTranslations("main.skills");
  const shouldReduceMotion = useReducedMotion();
  const searchRef = useRef<HTMLInputElement>(null);

  const [activeCategory, setActiveCategory] =
    useState<SkillCategoryId>("frontend");
  const [search, setSearch] = useState("");

  const skills = useMemo(() => initialSkills, [initialSkills]);
  const counts = useMemo(() => countSkillsByCategory(skills), [skills]);
  const isSearching = search.trim().length > 0;

  const visibleSkills = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query) {
      return skills.filter((skill) =>
        skill.title.toLowerCase().includes(query),
      );
    }
    return filterSkillsByCategory(skills, activeCategory);
  }, [activeCategory, search, skills]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement !== searchRef.current) {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (
        event.key === "Escape" &&
        document.activeElement === searchRef.current
      ) {
        setSearch("");
        searchRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const description = isSearching ? (
    <span>
      <span className="text-primary-800 font-mono font-medium">
        {t("terminal.matchCount", { count: visibleSkills.length })}
      </span>
      {t("terminal.searchFor", { query: search })}
    </span>
  ) : (
    t(`tabs.${activeCategory}.description`)
  );

  return (
    <div className="relative z-10 mx-auto w-full py-6">
      <HeaderArticle
        subtitle={t("terminal.eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <div className="-mt-8 mb-8 flex justify-center">
        <div className="bg-card/80 border-border/70 text-muted-foreground shadow-2xs inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full border px-4 py-1.5 font-mono text-xs sm:text-sm">
          <span>{"{ "}</span>
          <span>
            <b className="text-foreground font-medium">frontend</b>
            {`: ${counts.frontend}`}
          </span>
          <span className="text-muted-foreground/40">,</span>
          <span>
            <b className="text-foreground font-medium">backend</b>
            {`: ${counts.backend}`}
          </span>
          <span className="text-muted-foreground/40">,</span>
          <span>
            <b className="text-foreground font-medium">tools</b>
            {`: ${counts.tools}`}
          </span>
          <span>{" }"}</span>
        </div>
      </div>

      <section
        className={cn(
          "bg-card/95 border-border overflow-hidden rounded-[14px] border backdrop-blur-md",
          !shouldReduceMotion && "animate-[riseIn_0.55s_0.08s_ease_both]",
        )}
      >
        <div className="border-border bg-muted flex flex-col items-stretch justify-between gap-3 border-b sm:flex-row sm:items-center sm:pr-2">
          <div
            className={cn(
              "flex w-full min-w-0 snap-x snap-mandatory scrollbar-none items-stretch gap-0 overflow-x-auto overscroll-x-contain px-1 pt-0.5 [-ms-overflow-style:none] sm:px-0 [&::-webkit-scrollbar]:hidden",
              isSearching && "pointer-events-none opacity-40",
            )}
          >
            {SKILL_CATEGORIES.map((category) => {
              const isActive = !isSearching && activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  data-cat={category.id}
                  onClick={() => {
                    setSearch("");
                    setActiveCategory(category.id);
                  }}
                  className={cn(
                    "relative flex min-h-11 shrink-0 touch-manipulation snap-start items-center gap-2 border-b-2 px-3 py-3 text-xs whitespace-nowrap transition-colors duration-150 sm:min-h-0 sm:px-4 sm:pt-[15px] sm:pb-[13px] sm:text-sm",
                    isActive && !shouldReduceMotion
                      ? "text-foreground border-transparent font-medium"
                      : isActive
                        ? cn(
                            "text-foreground font-medium",
                            category.borderClass,
                          )
                        : "text-muted-foreground hover:text-foreground border-transparent font-normal",
                  )}
                >
                  {isActive && !shouldReduceMotion ? (
                    <motion.span
                      layoutId="skills-terminal-tab"
                      className={cn(
                        "absolute right-0 bottom-[-2px] left-0 h-0.5 rounded-full",
                        category.indicatorClass,
                      )}
                      transition={{
                        type: "spring",
                        bounce: 0.15,
                        duration: 0.45,
                      }}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "h-[7px] w-[7px] shrink-0 rounded-full opacity-45",
                      isActive
                        ? cn("opacity-100", category.dotClass)
                        : "bg-current",
                    )}
                  />
                  <span>{t(`tabs.${category.id}.title`)}</span>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {counts[category.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-border bg-background focus-within:border-primary mx-2 mb-2 flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors duration-150 sm:mx-0 sm:mb-0 sm:min-h-0 sm:max-w-[220px] sm:flex-[0_1_220px] sm:py-2">
            <span className="text-primary-800 shrink-0 font-mono text-[13px]">
              $
            </span>
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="text"
              placeholder={t("terminal.searchPlaceholder")}
              autoComplete="off"
              aria-label={t("terminal.searchLabel")}
              className="text-foreground placeholder:text-muted-foreground w-full border-none bg-transparent font-mono text-[13px] outline-none"
            />
            <span className="border-border text-muted-foreground shrink-0 rounded border px-1.5 py-px font-mono text-[10.5px]">
              /
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 px-6 pt-4 pb-1 sm:px-6">
          <p className="text-muted-foreground m-0 text-sm">{description}</p>
          <div className="text-muted-foreground font-mono text-[11px]">
            {t("terminal.coreLegend")}
          </div>
        </div>

        {visibleSkills.length === 0 ? (
          <p className="text-muted-foreground px-5 py-11 text-center text-sm">
            {t("terminal.noResults")}
          </p>
        ) : (
          <motion.ul
            key={isSearching ? `search-${search}` : activeCategory}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex list-none flex-wrap gap-x-3 gap-y-2 px-4 py-4 pb-6 sm:gap-x-[26px] sm:gap-y-4 sm:px-7 sm:py-5 sm:pb-[34px]"
          >
            {visibleSkills.map((skill: SkillType) => (
              <li
                key={skill.id}
                className="min-w-[calc(50%-0.375rem)] sm:min-w-0"
              >
                <SkillItem
                  image={skill.image}
                  title={skill.title}
                  featured={skill.featured}
                />
              </li>
            ))}
          </motion.ul>
        )}
      </section>

      <div className="mt-7 flex justify-center">
        <Link
          scroll
          href="/certificates"
          className="text-primary-800 group inline-flex items-center gap-1.5 text-sm font-medium no-underline"
        >
          {t("modal.seeCertificates")}
          <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
};

export default SkillsTerminal;
