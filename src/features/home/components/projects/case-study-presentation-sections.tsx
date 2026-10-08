import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { SectionHeading } from "./case-study-primitives";
import type { CaseStudySectionProps } from "./case-study-section-types";

function CaseStudyStepsSection({ section, index }: CaseStudySectionProps) {
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
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.items.map((item, itemIndex) => (
          <li
            key={item.key}
            data-case-study-card
            className="b-card-glow bg-card border-border rounded-3xl border p-5"
          >
            <span className="text-primary font-mono text-xs font-bold">
              {String(itemIndex + 1).padStart(2, "0")}
            </span>
            <p className="text-foreground mt-2 font-bold">{item.title}</p>
            <p className="text-muted-foreground mt-1.5 text-[0.9375rem] leading-7">
              {item.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CaseStudySwatchesSection({ section, index }: CaseStudySectionProps) {
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
        className="b-card-glow bg-card border-border grid gap-8 rounded-4xl border p-6 md:grid-cols-[1.2fr_1fr] md:p-8"
      >
        <div>
          <p className="text-primary text-xs font-bold tracking-wider uppercase">
            {t("primaryScaleMainLight")}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {section.items.map((item) => (
              <div key={item.key} className="w-22">
                <span
                  className="border-border block h-12 rounded-2xl border"
                  style={{ backgroundColor: item.value }}
                />
                <b className="text-foreground mt-2 block text-xs">
                  {item.title}
                </b>
                <span className="text-muted-foreground font-mono text-xs">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          {section.footnotes.length > 0 ? (
            <>
              <p className="text-primary mt-8 text-xs font-bold tracking-wider uppercase">
                {section.footnoteTitle || t("principles")}
              </p>
              <ul className="text-muted-foreground mt-3 space-y-2.5">
                {section.footnotes.map((note) => (
                  <li key={note} className="flex gap-3 leading-7">
                    <span
                      className="text-primary mt-1 shrink-0"
                      aria-hidden="true"
                    >
                      <Check className="size-4" />
                    </span>
                    {note}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
        <div
          data-case-study-card
          className="b-card-glow bg-muted border-border rounded-3xl border p-6"
        >
          <p className="text-primary text-xs font-bold tracking-wider uppercase">
            {t("themePresetCount")}
          </p>
          <ul className="mt-4 space-y-2.5">
            {["Main", "Orange", "Christmas"].map((theme) => (
              <li
                key={theme}
                data-case-study-card
                className="b-card-glow bg-card border-border flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
              >
                <b>{theme}</b>
                <span className="text-muted-foreground text-sm">
                  {t("lightDark")}
                </span>
              </li>
            ))}
            <li className="border-primary/40 text-primary flex items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3">
              <b>{t("customTheme")}</b>
              <span className="text-muted-foreground text-sm">
                {t("visitorDefined")}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function CaseStudyPresentationSection(props: CaseStudySectionProps) {
  switch (props.section.kind) {
    case "STEPS":
      return <CaseStudyStepsSection {...props} />;
    case "SWATCHES":
      return <CaseStudySwatchesSection {...props} />;
    default:
      return null;
  }
}
