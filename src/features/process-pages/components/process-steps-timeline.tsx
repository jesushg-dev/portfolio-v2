import type { ProcessStep } from "../types";
import { processSectionHeadingId } from "./process-page-styles";
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
      className="px-6 py-20"
    >
      <div className="mx-auto max-w-3xl">
        <ProcessSectionHeader
          sectionId={id}
          eyebrow={eyebrow}
          title={title}
          description={description}
        />

        <ol className="border-primary/20 relative ml-4 space-y-10 border-l-2">
          {steps.map((step) => (
            <li key={step.number} className="relative ml-8">
              <span
                aria-hidden
                className="bg-primary text-primary-foreground absolute top-0 left-[-3.05rem] flex size-8 items-center justify-center rounded-full text-sm font-bold"
              >
                {step.number}
              </span>
              <h3 className="text-foreground mb-1 text-lg font-bold">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
