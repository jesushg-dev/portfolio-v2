"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { renderCaseStudyIcon, SectionHeading } from "./case-study-primitives";
import type { CaseStudySectionProps } from "./case-study-section-types";

function CaseStudyCardsSection({ section, index }: CaseStudySectionProps) {
  return (
    <section id={`s-${section.key}`} className="scroll-mt-8">
      <SectionHeading
        counter={String(index + 1).padStart(2, "0")}
        label={section.eyebrow}
        title={section.title}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.items.map((item) => {
          return (
            <article
              key={item.key}
              data-case-study-card
              className="b-card-glow bg-card border-border hover:border-primary/40 rounded-4xl border p-5 transition-colors"
            >
              <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl border border-current/10">
                {renderCaseStudyIcon(item.icon, "size-5")}
              </div>
              <h3 className="text-foreground mt-4 font-bold">{item.title}</h3>
              <p className="text-muted-foreground mt-1.5 text-base leading-7">
                {item.body}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CaseStudyDecisionsSection({ section, index }: CaseStudySectionProps) {
  const t = useTranslations("main.portfolio.caseStudy");
  const [openDecisionKey, setOpenDecisionKey] = useState(
    section.items[0]?.key ?? "",
  );

  return (
    <section id={`s-${section.key}`} className="scroll-mt-8">
      <SectionHeading
        counter={String(index + 1).padStart(2, "0")}
        label={section.eyebrow}
        title={section.title}
      />
      <p className="text-muted-foreground max-w-3xl text-lg leading-8">
        {section.lead}
      </p>
      <ul className="mt-6 space-y-3">
        {section.items.map((item, itemIndex) => {
          const isOpen = openDecisionKey === item.key;
          return (
            <li
              key={item.key}
              data-case-study-card
              className={`b-card-glow bg-card border-border overflow-hidden rounded-4xl border transition-colors ${isOpen ? "border-primary/40" : ""}`}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenDecisionKey(isOpen ? "" : item.key)}
                className="flex w-full items-start gap-4 p-5 text-left"
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-2xl border font-mono text-sm font-bold transition-colors ${isOpen ? "border-primary bg-primary text-primary-foreground" : "border-primary/20 bg-primary/10 text-primary"}`}
                >
                  {String(itemIndex + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-foreground block text-lg font-bold tracking-tight">
                    {item.title}
                  </span>
                  {item.summary ? (
                    <span className="text-muted-foreground mt-1 block">
                      {item.summary}
                    </span>
                  ) : null}
                </span>
                <span
                  aria-hidden="true"
                  className={`text-muted-foreground mt-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
                >
                  <ChevronDown className="size-4" />
                </span>
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <div className="overflow-hidden">
                  <div className="border-border grid gap-6 border-t px-5 py-5 sm:grid-cols-3 sm:pl-18">
                    <div>
                      <p className="text-primary text-xs font-bold tracking-wider uppercase">
                        {t("why")}
                      </p>
                      <p className="text-muted-foreground mt-2 text-base leading-7">
                        {item.body}
                      </p>
                    </div>
                    <div>
                      <p className="text-primary text-xs font-bold tracking-wider uppercase">
                        {t("alternativesConsidered")}
                      </p>
                      {item.tags.length > 0 ? (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
                            <li
                              key={tag}
                              className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-sm font-medium"
                            >
                              {tag}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground mt-2 text-base">
                          —
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-primary text-xs font-bold tracking-wider uppercase">
                        {t("tradeoff")}
                      </p>
                      <p className="text-muted-foreground mt-2 text-base leading-7">
                        {item.note || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CaseStudyLayersSection({ section, index }: CaseStudySectionProps) {
  return (
    <section id={`s-${section.key}`} className="scroll-mt-8">
      <SectionHeading
        counter={String(index + 1).padStart(2, "0")}
        label={section.eyebrow}
        title={section.title}
      />
      {section.lead ? (
        <p className="text-muted-foreground mb-6 text-lg leading-8">
          {section.lead}
        </p>
      ) : null}
      <div
        data-case-study-card
        className="b-card-glow bg-card border-border rounded-[1.75rem] border p-5 md:p-8"
      >
        <ol>
          {section.items.map((item) => (
            <li key={item.key}>
              <div className="bg-muted border-border rounded-2xl border p-4">
                <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                  {item.title || item.key}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <li
                      key={tag}
                      className="bg-card text-muted-foreground rounded-lg border border-current px-3 py-1.5 text-sm font-semibold"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
              {item.note ? (
                <div className="border-primary/30 relative mx-auto flex h-10 w-[0.0625rem] items-center justify-center border-l border-dashed">
                  <span className="bg-card text-primary absolute rounded-full border border-current px-3 py-1 text-[0.6875rem] font-semibold whitespace-nowrap">
                    {item.note}
                  </span>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function CaseStudyOverviewSection(props: CaseStudySectionProps) {
  switch (props.section.kind) {
    case "CARDS":
      return <CaseStudyCardsSection {...props} />;
    case "DECISIONS":
      return <CaseStudyDecisionsSection {...props} />;
    case "LAYERS":
      return <CaseStudyLayersSection {...props} />;
    default:
      return null;
  }
}
