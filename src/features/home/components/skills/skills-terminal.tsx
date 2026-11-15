"use client";

import { useMemo, type FC } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";

import HeaderArticle from "@/components/shared/header-article";
import { Link } from "@/i18n/routing";
import type { SkillType, SkillTypeType } from "@/utils/interfaces/types";
import { skillSlugFromTitle } from "@/utils/tools/skill-slug";
import { cn } from "@/lib/utils";

export type CompactSkillType = Pick<
  SkillType,
  "id" | "title" | "image" | "type" | "featured" | "trend"
>;

export interface SkillsTerminalProps {
  initialSkills: (SkillType | CompactSkillType)[];
  showHeader?: boolean;
}

interface SpecCategory {
  key: string;
  types: SkillTypeType[];
  fallbackTitles: string[];
}

const SPEC_CATEGORIES: SpecCategory[] = [
  {
    key: "frontend",
    types: ["FRONTEND", "MOBILE", "DESKTOP"],
    fallbackTitles: [
      "React",
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Redux",
      "Angular",
    ],
  },
  {
    key: "backend",
    types: ["BACKEND"],
    fallbackTitles: [
      "Node.js",
      "Nest.js",
      "C# / .NET",
      "GraphQL",
      "REST",
      "Prisma",
    ],
  },
  {
    key: "architecture",
    types: ["ARCHITECTURE"],
    fallbackTitles: [
      "Clean Architecture",
      "DDD",
      "SOLID",
      "Microservices",
      "Event-driven",
    ],
  },
  {
    key: "ai",
    types: ["AI"],
    fallbackTitles: [
      "OpenAI GPT-4o",
      "Claude",
      "Gemini",
      "GitHub Copilot",
      "Cursor",
      "v0",
    ],
  },
  {
    key: "data",
    types: ["DATA"],
    fallbackTitles: ["MySQL", "MongoDB", "Firebase"],
  },
  {
    key: "delivery",
    types: ["QUALITY_DELIVERY", "DEVOPS", "TOOLS", "CYBERSECURITY"],
    fallbackTitles: ["Jest", "Playwright", "Docker", "CI/CD", "Azure", "OWASP"],
  },
];

const SkillsTerminal: FC<SkillsTerminalProps> = ({
  initialSkills,
  showHeader = false,
}) => {
  const t = useTranslations("main.skills");

  const specRows = useMemo(() => {
    return SPEC_CATEGORIES.map((category) => {
      const matchingSkills = initialSkills.filter((s) =>
        category.types.includes(s.type),
      );

      // Prioritize featured skills first, then regular
      const sorted = [...matchingSkills].sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.title.localeCompare(b.title);
      });

      const titles = sorted.map((s) => s.title);

      // Fill in fallback titles if missing
      for (const fallback of category.fallbackTitles) {
        if (!titles.includes(fallback)) {
          titles.push(fallback);
        }
      }

      return {
        key: category.key,
        titles,
      };
    });
  }, [initialSkills]);

  return (
    <div className="relative z-10 mx-auto w-full py-6">
      {showHeader ? (
        <HeaderArticle
          subtitle={t("subtitle")}
          title={t("title")}
          description={t("description")}
        />
      ) : null}

      <div className="home-card-surface bg-card border-border/80 w-full overflow-hidden rounded-2xl border shadow-2xl">
        {/* Terminal Chrome Bar */}
        <div className="border-border/60 bg-muted/20 text-muted-foreground flex items-center gap-1.5 border-b px-4 py-3 text-sm">
          <span
            className="size-2.5 rounded-full bg-[#ff5f57]"
            aria-hidden="true"
          />
          <span
            className="size-2.5 rounded-full bg-[#febc2e]"
            aria-hidden="true"
          />
          <span
            className="size-2.5 rounded-full bg-[#28c840]"
            aria-hidden="true"
          />
          <span className="text-muted-foreground ml-auto font-mono text-sm">
            expertise.json
          </span>
        </div>

        {/* Spec Sheet Definition List */}
        <dl className="divide-border/60 divide-y px-6 sm:px-8">
          {specRows.map((row) => (
            <div
              key={row.key}
              className="grid gap-2.5 py-5 md:grid-cols-[12rem_1fr] md:gap-8"
            >
              <dt className="text-primary font-mono text-sm md:pt-1">
                <span className="text-muted-foreground">&quot;</span>
                {row.key}
                <span className="text-muted-foreground">&quot;</span>
              </dt>
              <dd className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-semibold tracking-tight sm:text-lg md:text-xl">
                {row.titles.map((title, i) => (
                  <Link
                    key={title}
                    href={{
                      pathname: "/skills/[slug]",
                      params: { slug: skillSlugFromTitle(title) },
                    }}
                    scroll={false}
                    className={cn(
                      "inline-flex min-h-11 min-w-11 items-center justify-center px-1.5 transition-colors hover:text-primary hover:underline",
                      i < 3
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground font-normal",
                    )}
                  >
                    {title}
                  </Link>
                ))}
              </dd>
            </div>
          ))}
        </dl>

        {/* Spec Sheet Footer */}
        <div className="border-border/60 text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t px-6 py-3 font-mono text-sm sm:px-8">
          <span className="flex items-center gap-1.5">
            <Check className="size-4 text-emerald-400" aria-hidden="true" />
            <span>{t("updatedTech")}</span>
          </span>
          <Link
            href={{ pathname: "/certificates" }}
            className="text-primary hover:text-primary/80 inline-flex min-h-11 items-center gap-1 font-semibold transition-colors hover:underline"
          >
            <span>{t("seeCertificates")}</span>
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SkillsTerminal;
