import { useTranslations } from "next-intl";

import type { CaseStudyContentDTO } from "@/features/projects/lib/case-study";

import {
  renderCaseStudyIcon,
  SectionHeading,
  SectionItem,
} from "./case-study-primitives";
import CaseStudySection from "./case-study-section";
import type { CaseStudyPageSection } from "./case-study-view.types";

interface CaseStudyPageSectionProps {
  entry: CaseStudyPageSection;
  index: number;
  content: CaseStudyContentDTO;
  challenge: string | null;
  shortOnTimeSections: CaseStudyPageSection[];
}

export default function CaseStudyPageSectionView({
  entry,
  index,
  content,
  challenge,
  shortOnTimeSections,
}: CaseStudyPageSectionProps) {
  const t = useTranslations("main.portfolio.caseStudy");
  const counter = String(index + 1).padStart(2, "0");

  if (entry.kind === "SUMMARY") {
    return (
      <section id={`s-${entry.key}`} className="scroll-mt-8">
        <SectionHeading
          counter={counter}
          label={entry.eyebrow}
          title={entry.title}
        />
        <div
          className={`grid gap-4 ${content.tldr.length > 1 ? "md:grid-cols-3" : ""}`}
        >
          {content.tldr.map((item) => (
            <article
              key={item.key}
              data-case-study-card
              className="b-card-glow bg-card border-border hover:border-primary/40 rounded-4xl border p-6 transition-colors"
            >
              <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl border border-current/10">
                {renderCaseStudyIcon(item.icon, "size-5")}
              </span>
              <p className="text-primary mt-5 text-xs font-bold tracking-wider uppercase">
                {item.title}
              </p>
              <p className="text-foreground mt-2 leading-7">{item.body}</p>
            </article>
          ))}
        </div>
        {shortOnTimeSections.length > 0 ? (
          <p className="text-muted-foreground mt-6 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">{t("shortOnTime")}</span>
            {shortOnTimeSections.map((shortcut) => (
              <a
                key={shortcut.key}
                href={`#s-${shortcut.key}`}
                className="bg-primary/10 text-primary hover:bg-primary/20 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors"
              >
                {shortcut.title}
              </a>
            ))}
          </p>
        ) : null}
      </section>
    );
  }

  if (entry.kind === "CONTEXT") {
    return (
      <section id={`s-${entry.key}`} className="scroll-mt-8">
        <SectionHeading
          counter={counter}
          label={entry.eyebrow}
          title={entry.title}
        />
        <p className="text-muted-foreground mt-4 text-lg leading-8">
          {content.context}
        </p>
      </section>
    );
  }

  if (entry.kind === "ROLE") {
    return (
      <section id={`s-${entry.key}`} className="scroll-mt-8">
        <SectionHeading
          counter={counter}
          label={entry.eyebrow}
          title={entry.title}
        />
        {content.roleIntro ? (
          <p className="text-muted-foreground mt-4 text-lg leading-8">
            {content.roleIntro}
          </p>
        ) : null}
        {content.responsibilities.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {content.responsibilities.map((item) => (
              <SectionItem key={item.key} item={item} />
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  if (entry.kind === "CHALLENGE") {
    return (
      <section id={`s-${entry.key}`} className="scroll-mt-8">
        <SectionHeading
          counter={counter}
          label={entry.eyebrow}
          title={entry.title}
        />
        {challenge ? (
          <p className="text-muted-foreground mt-4 text-lg leading-8">
            {challenge}
          </p>
        ) : null}
        {content.constraints.length > 0 ? (
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {content.constraints.map((constraint, constraintIndex) => (
              <li
                key={constraint}
                data-case-study-card
                className="b-card-glow bg-card border-border flex items-center gap-3 rounded-2xl border p-4"
              >
                <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold">
                  {constraintIndex + 1}
                </span>
                <span className="text-foreground text-sm leading-6 font-medium">
                  {constraint}
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </section>
    );
  }

  if (entry.kind === "CONTENT") {
    return (
      <CaseStudySection
        section={entry.section}
        relatedSection={entry.relatedSection}
        introText={entry.introText}
        index={index}
      />
    );
  }

  return null;
}
