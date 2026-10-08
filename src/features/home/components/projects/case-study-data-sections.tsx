import { useTranslations } from "next-intl";

import { PrismaCodeBlock } from "./prisma-code-block";
import { SectionHeading } from "./case-study-primitives";
import type { CaseStudySectionProps } from "./case-study-section-types";

function CaseStudyCodeSection({
  section,
  index,
  relatedSection,
}: CaseStudySectionProps) {
  const t = useTranslations("main.portfolio.caseStudy");

  return (
    <section id={`s-${section.key}`} className="scroll-mt-8">
      <SectionHeading
        counter={String(index + 1).padStart(2, "0")}
        label={section.eyebrow}
        title={section.title}
      />
      {section.lead ? (
        <p className="text-muted-foreground mb-6 max-w-3xl text-lg leading-8">
          {section.lead}
        </p>
      ) : null}
      {section.code ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="overflow-hidden rounded-[1.6rem] bg-[#0b1020] shadow-[0_1.5rem_3.75rem_-2.1875rem_rgba(15,23,42,0.7)]">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <span className="text-muted-foreground ml-3 truncate font-mono text-xs">
                {section.codeLabel || t("implementation")}
              </span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[0.78125rem] leading-6 text-slate-200">
              <code>
                <PrismaCodeBlock code={section.code} />
              </code>
            </pre>
          </div>
          <div className="space-y-3">
            {section.items.map((item) => (
              <article
                key={item.key}
                data-case-study-card
                className="b-card-glow bg-card border-border rounded-3xl border p-5"
              >
                <h3 className="text-foreground font-bold">{item.title}</h3>
                <p className="text-muted-foreground mt-1.5 text-[0.9375rem] leading-7">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      {relatedSection?.items.length ? (
        <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {relatedSection.items.map((item) => (
            <div
              key={item.key}
              data-case-study-card
              className="b-card-glow bg-card border-border rounded-4xl border p-5"
            >
              <dd className="text-primary text-3xl font-extrabold tracking-tight">
                {item.value}
              </dd>
              <dt className="text-muted-foreground mt-1 text-sm">
                {item.title}
              </dt>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

function CaseStudyTableSection({ section, index }: CaseStudySectionProps) {
  const t = useTranslations("main.portfolio.caseStudy");

  return (
    <section id={`s-${section.key}`} className="scroll-mt-8">
      <SectionHeading
        counter={String(index + 1).padStart(2, "0")}
        label={section.eyebrow}
        title={section.title}
      />
      {section.lead ? (
        <p className="text-muted-foreground mb-6 max-w-3xl text-lg leading-8">
          {section.lead}
        </p>
      ) : null}
      <div
        data-case-study-card
        className="b-card-glow bg-card border-border overflow-hidden rounded-[1.5rem] border"
      >
        <dl className="divide-border divide-y">
          {section.items.map((item) => (
            <div
              key={item.key}
              className="grid gap-1 p-5 sm:grid-cols-[10.625rem_1fr] sm:gap-6"
            >
              <dt className="text-foreground font-bold">{item.title}</dt>
              <dd className="text-muted-foreground text-[0.9375rem] leading-7">
                {item.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {section.footnotes.length > 0 ? (
        section.footnoteVariant === "warning" ? (
          <div className="bg-muted border-border mt-4 rounded-2xl border border-l-4 border-l-amber-500 p-5 pl-6">
            <p className="text-foreground font-bold">
              {section.footnoteTitle || t("notes")}
            </p>
            <ul className="text-muted-foreground mt-3 space-y-2 text-[0.9375rem] leading-7">
              {section.footnotes.map((note) => (
                <li key={note} className="flex gap-3">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-muted border-border mt-4 rounded-3xl border p-5">
            <p className="text-foreground font-bold">
              {section.footnoteTitle || t("notes")}
            </p>
            <ul className="text-muted-foreground mt-3 space-y-2 text-[0.9375rem] leading-7">
              {section.footnotes.map((note) => (
                <li key={note} className="flex gap-3">
                  <span className="bg-primary mt-2.5 size-1.5 shrink-0 rounded-full" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : null}
    </section>
  );
}

function CaseStudyMetricsSection({
  section,
  index,
  relatedSection,
  introText,
}: CaseStudySectionProps) {
  return (
    <section id={`s-${section.key}`} className="scroll-mt-8">
      <SectionHeading
        counter={String(index + 1).padStart(2, "0")}
        label={section.eyebrow}
        title={section.title}
      />
      {introText ? (
        <p className="text-muted-foreground mb-6 text-lg leading-8">
          {introText}
        </p>
      ) : null}
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {section.items.map((item) => (
          <div
            key={item.key}
            data-case-study-card
            className="b-card-glow bg-card border-border rounded-3xl border p-6"
          >
            <dd className="text-primary text-3xl font-extrabold tracking-tight md:text-4xl">
              {item.value}
            </dd>
            <dt className="text-muted-foreground mt-2 text-sm">{item.title}</dt>
          </div>
        ))}
      </dl>
      {relatedSection?.items.length ? (
        <>
          <p className="text-primary mt-8 text-xs font-bold tracking-wider uppercase">
            {relatedSection.title}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {relatedSection.items.map((item) => (
              <div
                key={item.key}
                data-case-study-card
                className="b-card-glow bg-muted border-border rounded-3xl border p-5"
              >
                <dd className="text-foreground text-2xl font-extrabold tracking-tight">
                  {item.value}
                </dd>
                <dt className="text-muted-foreground mt-1 text-sm">
                  {item.title}
                </dt>
              </div>
            ))}
          </dl>
        </>
      ) : null}
    </section>
  );
}

export function CaseStudyDataSection(props: CaseStudySectionProps) {
  switch (props.section.kind) {
    case "CODE":
      return <CaseStudyCodeSection {...props} />;
    case "TABLE":
      return <CaseStudyTableSection {...props} />;
    case "METRICS":
      return <CaseStudyMetricsSection {...props} />;
    default:
      return null;
  }
}
