"use client";

import { useEffect, useMemo, useRef, useState, type FC } from "react";
import { ArrowRightIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

import HeaderArticle from "@/components/shared/header-article";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { SkillType } from "@/utils/interfaces/types";
import { skillSlugFromTitle } from "@/utils/tools/skill-slug";
import {
  countSkillsByCategory,
  filterSkillsByCategory,
  SKILL_CATEGORIES,
  type SkillCategoryId,
} from "./lib/skill-display";
import SkillIcon from "./skill-icon";

interface SkillsTerminalProps {
  initialSkills: SkillType[];
}

const SkillsTerminal: FC<SkillsTerminalProps> = ({ initialSkills }) => {
  const t = useTranslations("main.skills");
  const shouldReduceMotion = useReducedMotion();
  const searchRef = useRef<HTMLInputElement>(null);

  const [activeCategory, setActiveCategory] =
    useState<SkillCategoryId>("architecture");
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

  const featuredSkills = useMemo(
    () => visibleSkills.filter((skill) => skill.featured),
    [visibleSkills],
  );

  const regularSkills = useMemo(
    () => visibleSkills.filter((skill) => !skill.featured),
    [visibleSkills],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        !/INPUT|TEXTAREA/.test(
          (document.activeElement as HTMLElement)?.tagName || "",
        )
      ) {
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
      <span className="text-primary font-mono font-medium">
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

      <div className="bg-card border-border/30 hover:border-primary/30 relative overflow-hidden rounded-3xl border shadow-xs transition-all duration-300">
        {/* Terminal Chrome Bar */}
        <div className="border-border/30 bg-muted/20 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full bg-red-400/80"
              aria-hidden="true"
            />
            <span
              className="size-2.5 rounded-full bg-amber-400/80"
              aria-hidden="true"
            />
            <span
              className="size-2.5 rounded-full bg-emerald-400/80"
              aria-hidden="true"
            />
            <span className="text-muted-foreground ml-2 font-mono text-xs">
              expertise.json
            </span>
          </div>

          <label className="border-border/40 bg-background/80 focus-within:border-primary flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-xs transition-colors sm:text-sm">
            <span className="text-primary font-bold">$</span>
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("terminal.searchPlaceholder")}
              aria-label={t("terminal.searchLabel")}
              autoComplete="off"
              className="text-foreground placeholder:text-muted-foreground w-28 bg-transparent outline-none sm:w-36"
            />
            <kbd className="border-border/40 text-muted-foreground rounded border px-1.5 text-[11px]">
              /
            </kbd>
          </label>
        </div>

        {/* Category Tabs */}
        <div
          role="tablist"
          className={cn(
            "border-border/30 bg-muted/10 flex flex-wrap border-b px-3",
            isSearching && "pointer-events-none opacity-40",
          )}
        >
          {SKILL_CATEGORIES.map((category) => {
            const isActive = !isSearching && activeCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-cat={category.id}
                onClick={() => {
                  setSearch("");
                  setActiveCategory(category.id);
                }}
                className={cn(
                  "focus-visible:ring-primary/40 relative flex min-h-11 shrink-0 cursor-pointer items-center gap-2 px-3 py-3 text-xs font-semibold whitespace-nowrap transition-all duration-150 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset sm:px-4 sm:text-sm",
                  isActive
                    ? "text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-t-lg",
                )}
              >
                {isActive && !shouldReduceMotion ? (
                  <motion.span
                    layoutId="skills-terminal-tab"
                    className="bg-primary absolute right-0 bottom-[-1px] left-0 h-0.5"
                    transition={{
                      type: "spring",
                      bounce: 0.15,
                      duration: 0.45,
                    }}
                  />
                ) : null}
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full transition-colors",
                    isActive ? "bg-primary" : "bg-muted-foreground/50",
                  )}
                />
                <span>{t(`tabs.${category.id}.title`)}</span>
                <span className="text-muted-foreground font-mono text-xs opacity-70">
                  {counts[category.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category blurb */}
        <div className="text-muted-foreground px-6 pt-5">
          <p className="text-sm font-medium">{description}</p>
        </div>

        {/* Chips & Cards */}
        <div className="p-6 pt-4">
          {visibleSkills.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center font-mono text-sm">
              {t("terminal.noMatch", { query: search })}
            </p>
          ) : isSearching ? (
            /* Search Results: Flat list of chips */
            <motion.ul
              key={`search-${search}`}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap gap-2.5"
            >
              {visibleSkills.map((skill) => (
                <li key={skill.id}>
                  <Link
                    href={{
                      pathname: "/skills/[slug]",
                      params: { slug: skillSlugFromTitle(skill.title) },
                    }}
                    scroll={false}
                    className="border-border/30 bg-muted/20 hover:bg-card hover:border-primary/40 group flex cursor-pointer items-center gap-2.5 rounded-2xl border py-1.5 pr-4 pl-1.5 text-sm font-medium transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs"
                  >
                    <SkillIcon
                      image={skill.image}
                      title={skill.title}
                      size="md"
                      tile
                    />
                    <span className="text-muted-foreground group-hover:text-foreground">
                      {skill.title}
                    </span>
                  </Link>
                </li>
              ))}
            </motion.ul>
          ) : (
            /* Category View: Featured Cards Grid + Regular Chips */
            <motion.div
              key={activeCategory}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {featuredSkills.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {featuredSkills.map((skill) => (
                    <li key={skill.id}>
                      <Link
                        href={{
                          pathname: "/skills/[slug]",
                          params: { slug: skillSlugFromTitle(skill.title) },
                        }}
                        scroll={false}
                        className="group/feat border-border/30 bg-muted/20 hover:bg-card hover:border-primary/40 flex cursor-pointer flex-col rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs"
                      >
                        <SkillIcon
                          image={skill.image}
                          title={skill.title}
                          size="lg"
                          tile
                        />
                        <p className="text-foreground group-hover/feat:text-primary mt-4 text-sm font-bold tracking-tight transition-colors">
                          {skill.title}
                        </p>
                        <p className="text-primary mt-0.5 text-xs font-semibold">
                          {t("terminal.featured")}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}

              {regularSkills.length > 0 ? (
                <ul className="flex flex-wrap gap-2.5">
                  {regularSkills.map((skill) => (
                    <li key={skill.id}>
                      <Link
                        href={{
                          pathname: "/skills/[slug]",
                          params: { slug: skillSlugFromTitle(skill.title) },
                        }}
                        scroll={false}
                        className="border-border/30 bg-muted/20 hover:bg-card hover:border-primary/40 group flex cursor-pointer items-center gap-2.5 rounded-2xl border py-1.5 pr-4 pl-1.5 text-sm font-medium transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs"
                      >
                        <SkillIcon
                          image={skill.image}
                          title={skill.title}
                          size="md"
                          tile
                        />
                        <span className="text-muted-foreground group-hover:text-foreground">
                          {skill.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </motion.div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          scroll
          href="/certificates"
          className="text-primary hover:text-primary/80 group inline-flex min-h-11 items-center gap-2 py-2 text-sm font-semibold transition-colors"
        >
          <span>{t("modal.seeCertificates")}</span>
          <ArrowRightIcon className="size-4 transition-transform duration-150 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

export default SkillsTerminal;
