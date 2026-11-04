import type { ProcessStep } from "../types";
import { processSectionHeadingId } from "./process-page-styles";
import { ProcessReveal, ProcessRevealItem } from "./process-reveal";
import { ProcessSectionHeader } from "./process-section-header";

interface ProcessStepsTimelineProps {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  steps: ProcessStep[];
}

export function ProcessStepsTimeline({
  id = "process",
  eyebrow,
  title,
  description,
  steps,
}: ProcessStepsTimelineProps) {
  return (
    <section
      id={id}
      aria-labelledby={processSectionHeadingId(id)}
      className="border-border/80 border-t py-20 md:py-28"
    >
      <div className="mx-auto w-full px-4 sm:px-6 lg:container lg:px-20">
        <ProcessReveal>
          <ProcessSectionHeader
            sectionId={id}
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
        </ProcessReveal>

        <ol className="border-border/80 divide-border/80 mx-auto max-w-3xl list-none divide-y border-t border-b">
          {steps.map((step, index) => (
            <ProcessRevealItem
              key={step.number}
              index={index}
              className="flex items-start gap-6 py-7"
            >
              <span className="text-primary w-7 shrink-0 pt-1 font-mono text-sm font-semibold">
                {step.number}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mt-2 max-w-2xl text-base leading-relaxed">
                  {step.description}
                </p>
              </div>
            </ProcessRevealItem>
          ))}
        </ol>
      </div>
    </section>
  );
}
