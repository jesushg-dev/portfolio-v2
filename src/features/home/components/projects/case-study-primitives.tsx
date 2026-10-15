import { createElement } from "react";
import {
  BriefcaseBusiness,
  Database,
  Gauge,
  Globe2,
  Layers3,
  LayoutGrid,
  MoveLeft,
  Music2,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  User,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import SkillIcon from "@/features/home/components/skills/skill-icon";
import { Link } from "@/i18n/routing";
import type { CaseStudySectionDTO } from "@/features/projects/lib/case-study";

const SECTION_ICONS = {
  layers: Layers3,
  user: User,
  gauge: Gauge,
  case: BriefcaseBusiness,
  shield: ShieldCheck,
  pal: Palette,
  db: Database,
  term: Terminal,
  layout: LayoutGrid,
  search: Search,
  bolt: Sparkles,
  globe: Globe2,
  music: Music2,
  users: Users,
} as const;

export function renderCaseStudyIcon(icon: string, className: string) {
  const Icon = SECTION_ICONS[icon as keyof typeof SECTION_ICONS] ?? Sparkles;
  return createElement(Icon, {
    className,
    "aria-hidden": true,
  });
}

export function SkillChip({
  title,
  image = "",
}: {
  title: string;
  image?: string;
}) {
  return (
    <li className="bg-muted/50 border-border/80 text-foreground inline-flex items-center gap-2 rounded-xl border py-1 pr-3 pl-1 text-sm font-medium">
      <SkillIcon
        image={image}
        title={title}
        tile
        size="sm"
        className="size-6 rounded-lg text-xs"
      />
      <span>{title}</span>
    </li>
  );
}

export function SectionHeading({
  counter,
  label,
  title,
}: {
  counter: string;
  label: string;
  title: string;
}) {
  const t = useTranslations("main.portfolio.caseStudy");

  return (
    <>
      <p className="text-primary text-xs font-bold tracking-wider uppercase">
        <span className="font-mono">{counter}</span> · {label || t("section")}
      </p>
      <h2 className="text-foreground mt-2 mb-8 text-3xl font-extrabold tracking-tight md:text-4xl">
        {title}
      </h2>
    </>
  );
}

export function BackToProjectsLink() {
  const t = useTranslations("main.portfolio.caseStudy");

  return (
    <Link
      href={{ pathname: "/", hash: "#portfolio" }}
      className="text-muted-foreground hover:text-primary inline-flex items-center gap-2 text-sm font-semibold transition-colors print:hidden"
    >
      <MoveLeft className="size-4" aria-hidden="true" />
      {t("backToProjects")}
    </Link>
  );
}

export function SectionItem({
  item,
}: {
  item: CaseStudySectionDTO["items"][number];
}) {
  return (
    <article
      data-case-study-card
      className="b-card-glow bg-card border-border hover:border-primary/40 flex gap-4 rounded-4xl border p-5 transition-colors"
    >
      <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl border border-current/10">
        {renderCaseStudyIcon(item.icon, "size-5")}
      </span>
      <div className="min-w-0">
        <h3 className="text-foreground font-bold">{item.title}</h3>
        {item.body ? (
          <p className="text-muted-foreground mt-1.5 text-base leading-7">
            {item.body}
          </p>
        ) : null}
        {item.summary ? (
          <p className="text-muted-foreground mt-1.5 text-sm font-medium">
            {item.summary}
          </p>
        ) : null}
        {item.value ? (
          <p className="text-primary mt-3 text-sm font-bold">{item.value}</p>
        ) : null}
        {item.tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <li
                key={tag}
                className="bg-muted text-muted-foreground rounded-lg border border-current px-2.5 py-1 text-xs font-semibold"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
        {item.note ? (
          <p className="text-muted-foreground mt-3 text-sm">{item.note}</p>
        ) : null}
      </div>
    </article>
  );
}
