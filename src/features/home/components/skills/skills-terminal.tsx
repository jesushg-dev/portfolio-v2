import { ArrowRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import type { SkillType, SkillTypeType } from "@/utils/interfaces/types";
import { skillSlugFromTitle } from "@/utils/tools/skill-slug";
import { cn } from "@/lib/utils";

interface SkillsTerminalProps {
  skills: Pick<SkillType, "id" | "title" | "type" | "featured">[];
}

interface SpecCategory {
  key: string;
  types: SkillTypeType[];
}

const SPEC_CATEGORIES: SpecCategory[] = [
  {
    key: "frontend",
    types: ["FRONTEND", "MOBILE", "DESKTOP"],
  },
  {
    key: "backend",
    types: ["BACKEND"],
  },
  {
    key: "architecture",
    types: ["ARCHITECTURE"],
  },
  {
    key: "ai",
    types: ["AI"],
  },
  {
    key: "data",
    types: ["DATA"],
  },
  {
    key: "delivery",
    types: ["QUALITY_DELIVERY", "DEVOPS", "TOOLS", "CYBERSECURITY"],
  },
];

export default function SkillsTerminal({ skills }: SkillsTerminalProps) {
  const t = useTranslations("main.skills");

  const specRows = SPEC_CATEGORIES.map(({ key, types }) => ({
    key,
    skills: skills
      .filter((skill) => types.includes(skill.type))
      .sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          a.title.localeCompare(b.title),
      ),
  })).filter((row) => row.skills.length > 0);

  return (
    <div className="relative z-10 mx-auto w-full py-6">
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
                <span aria-hidden="true" className="text-muted-foreground">
                  &quot;
                </span>
                {row.key}
                <span aria-hidden="true" className="text-muted-foreground">
                  &quot;
                </span>
              </dt>
              <dd className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-semibold tracking-tight sm:text-lg md:text-xl">
                {row.skills.map(({ id, title }, i) => (
                  <Link
                    key={id}
                    href={{
                      pathname: "/skills/[slug]",
                      params: { slug: skillSlugFromTitle(title) },
                    }}
                    scroll={false}
                    className={cn(
                      "hover:text-primary inline-flex min-h-11 min-w-11 items-center justify-center px-1.5 transition-colors hover:underline",
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
            className="group text-primary hover:text-primary/80 inline-flex min-h-11 items-center gap-1 font-semibold transition-colors hover:underline"
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
}
